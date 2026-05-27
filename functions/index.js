/* eslint-disable */
"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

// ─── Firebase Admin 初期化 ───────────────────────────────────────────────────
admin.initializeApp();
const db = admin.firestore();

// ─── Secret 定義（firebase functions:secrets:set で設定） ─────────────────────
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");
const paypayApiKey = defineSecret("PAYPAY_API_KEY");
const paypayApiSecret = defineSecret("PAYPAY_API_SECRET");
const paypayMerchantId = defineSecret("PAYPAY_MERCHANT_ID");

// ─── CORS ヘルパー ────────────────────────────────────────────────────────────
function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// ─── Firebase Auth トークン検証 ───────────────────────────────────────────────
async function verifyToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) throw new Error("Unauthorized");
  const idToken = authHeader.split("Bearer ")[1];
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded;
}

// ─── 今日の日付 (JST) ─────────────────────────────────────────────────────────
function todayJST() {
  const now = new Date();
  // UTC+9
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. claudeProxy — Claude API の安全なプロキシ
// ═══════════════════════════════════════════════════════════════════════════════
exports.claudeProxy = onRequest(
  { secrets: [anthropicApiKey], cors: true, region: "asia-northeast1" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    try {
      // Auth検証（任意：未ログインでもアクセス可、ただし回数管理はFirestore側で）
      let uid = null;
      try {
        const decoded = await verifyToken(req);
        uid = decoded.uid;
      } catch (_) {
        // 未ログインは許可（フロントで制御）
      }

      const { messages, system } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "messages is required" });
        return;
      }

      const Anthropic = require("@anthropic-ai/sdk");
      const client = new Anthropic.default({ apiKey: anthropicApiKey.value() });

      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: system || "You are a helpful assistant.",
        messages: messages,
      });

      const text = response.content[0]?.text || "";
      res.json({ text });
    } catch (err) {
      console.error("claudeProxy error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. createPayPayOrder — PayPay 決済URL 生成
// ═══════════════════════════════════════════════════════════════════════════════
exports.createPayPayOrder = onRequest(
  {
    secrets: [paypayApiKey, paypayApiSecret, paypayMerchantId],
    cors: true,
    region: "asia-northeast1",
  },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    try {
      const decoded = await verifyToken(req);
      const uid = decoded.uid;

      const amount = Number(req.body.amount) || 100;
      const merchantPaymentId = uuidv4();

      // PayPay SDK 初期化
      const PAYPAY = require("@paypayopa/paypayopa-sdk-node");
      PAYPAY.Configure({
        clientId: paypayApiKey.value(),
        clientSecret: paypayApiSecret.value(),
        merchantId: paypayMerchantId.value(),
        productionMode: false, // サンドボックス。本番時は true に変更
      });

      // 決済リクエストボディ
      const paymentDetails = {
        merchantPaymentId,
        amount: {
          amount,
          currency: "JPY",
        },
        codeType: "ORDER_QR",
        requestedAt: Math.floor(Date.now() / 1000),
        redirectUrl: `https://wanwan-translator.web.app/?payment=success&uid=${uid}&mpid=${merchantPaymentId}`,
        redirectType: "WEB_LINK",
        orderDescription: "犬の気持ち読み取り機 追加診断（1回）",
        orderItems: [
          {
            name: "追加診断",
            quantity: 1,
            unitPrice: { amount, currency: "JPY" },
          },
        ],
      };

      const response = await PAYPAY.QRCodeCreate(paymentDetails);

      if (response.resultInfo?.code !== "SUCCESS") {
        throw new Error(`PayPay error: ${response.resultInfo?.code}`);
      }

      const paymentUrl = response.data?.url;

      // Firestoreに保留中決済を記録
      await db.collection("pendingPayments").doc(merchantPaymentId).set({
        uid,
        amount,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ paymentUrl, merchantPaymentId });
    } catch (err) {
      console.error("createPayPayOrder error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. payPayWebhook — PayPay 決済完了 Webhook
// ═══════════════════════════════════════════════════════════════════════════════
exports.payPayWebhook = onRequest(
  {
    secrets: [paypayApiKey, paypayApiSecret, paypayMerchantId],
    region: "asia-northeast1",
  },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

    try {
      const body = req.body;
      console.log("PayPay Webhook received:", JSON.stringify(body));

      // PayPay からの通知形式に合わせてパース
      const merchantPaymentId =
        body.data?.merchantPaymentId ||
        body.merchantPaymentId ||
        null;

      if (!merchantPaymentId) {
        console.warn("No merchantPaymentId in webhook body");
        res.status(200).send("OK"); // PayPay には200を返す
        return;
      }

      // 決済ステータス確認
      const paymentStatus =
        body.resultInfo?.code ||
        body.data?.status ||
        "";

      if (paymentStatus !== "SUCCESS" && paymentStatus !== "COMPLETED") {
        console.log(`Payment not completed: ${paymentStatus}`);
        res.status(200).send("OK");
        return;
      }

      // Firestore から保留中決済を検索
      const pendingRef = db.collection("pendingPayments").doc(merchantPaymentId);
      const pendingSnap = await pendingRef.get();

      if (!pendingSnap.exists) {
        console.warn(`No pending payment found for ${merchantPaymentId}`);
        res.status(200).send("OK");
        return;
      }

      const { uid } = pendingSnap.data();

      // トランザクションでユーザーのカウントをインクリメント
      await db.runTransaction(async (t) => {
        const userRef = db.collection("users").doc(uid);
        const userSnap = await t.get(userRef);
        const today = todayJST();

        if (userSnap.exists) {
          const data = userSnap.data();
          const lastUsedDate = data.lastUsedDate || "";
          const todayCount = lastUsedDate === today ? (data.todayCount || 0) : 0;

          t.update(userRef, {
            todayCount: todayCount + 1,
            lastUsedDate: today,
            usageCount: admin.firestore.FieldValue.increment(1),
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          t.set(userRef, {
            todayCount: 1,
            lastUsedDate: today,
            usageCount: 1,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // 決済レコードを完了に更新
        t.update(pendingRef, {
          status: "completed",
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(`Payment completed for uid: ${uid}, mpid: ${merchantPaymentId}`);
      res.status(200).send("OK");
    } catch (err) {
      console.error("payPayWebhook error:", err);
      res.status(200).send("OK"); // PayPay には常に200を返す
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. checkPayment — フロントから決済完了を確認するポーリングAPI
// ═══════════════════════════════════════════════════════════════════════════════
exports.checkPayment = onRequest(
  { cors: true, region: "asia-northeast1" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    try {
      const decoded = await verifyToken(req);
      const uid = decoded.uid;

      // ユーザーの最新状態を返す
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        res.json({ todayCount: 0, canUse: true });
        return;
      }

      const data = userSnap.data();
      const today = todayJST();
      const lastUsedDate = data.lastUsedDate || "";
      const todayCount = lastUsedDate === today ? (data.todayCount || 0) : 0;

      res.json({
        todayCount,
        canUse: todayCount === 0,
        usageCount: data.usageCount || 0,
      });
    } catch (err) {
      console.error("checkPayment error:", err);
      res.status(401).json({ error: "Unauthorized" });
    }
  }
);

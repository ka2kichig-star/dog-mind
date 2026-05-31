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
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// ─── CORS ヘルパー ────────────────────────────────────────────────────────────
function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Firebase-Auth");
}

// ─── Firebase Auth トークン検証 ───────────────────────────────────────────────
async function verifyToken(req) {
  let idToken = "";
  // Check X-Firebase-Auth custom header first to bypass GCP's Authorization header validation
  if (req.headers["x-firebase-auth"]) {
    idToken = req.headers["x-firebase-auth"];
    console.log("verifyToken: Found token in X-Firebase-Auth header, length:", idToken.length);
  } else {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      idToken = authHeader.split("Bearer ")[1];
      console.log("verifyToken: Found token in Authorization header, length:", idToken.length);
    }
  }

  if (!idToken) {
    console.warn("verifyToken: No ID token found in headers.");
    throw new Error("Unauthorized");
  }
  
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("verifyToken: Successfully verified token for uid:", decoded.uid);
    return decoded;
  } catch (err) {
    console.error("verifyToken: Failed to verify Firebase ID token:", err.message, err.code);
    throw err;
  }
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
  { secrets: [anthropicApiKey], cors: true, region: "asia-northeast1", invoker: "public" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    try {
      // Auth検証（任意：未ログインでもアクセス可、ただし回数管理はFirestore側で）
      let uid = "debug-test-uid";
      try {
        // 【デバッグ/テスト用】認証チェックを一時的にスキップしたい場合は、以下の行のコメントアウトを解除してください
        // uid = "debug-test-uid";
        
        if (!uid) {
          const decoded = await verifyToken(req);
          uid = decoded.uid;
        }
      } catch (err) {
        console.warn("verifyToken failed, proceeding as anonymous user:", err.message);
        // 未ログインは許可（フロントで制御）
      }

      const { messages, system } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "messages is required" });
        return;
      }

      // Convert image type: 'url' to type: 'base64' automatically
      for (const msg of messages) {
        if (msg.content && Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (part.type === "image" && part.source && part.source.type === "url") {
              const imageUrl = part.source.url;
              const imgRes = await fetch(imageUrl);
              if (!imgRes.ok) {
                throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
              }
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const base64Data = buffer.toString("base64");
              
              let mediaType = contentType;
              if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mediaType)) {
                mediaType = "image/jpeg";
              }
              
              part.source = {
                type: "base64",
                media_type: mediaType,
                data: base64Data
              };
            }
          }
        }
      }

      const Anthropic = require("@anthropic-ai/sdk");
      const AnthropicClass = Anthropic.default ?? Anthropic;
      
      // process.env から取得し、存在しない場合は secrets オブジェクトから取得。前後の余計な改行やスペースを trim で除去します。
      const rawApiKey = process.env.ANTHROPIC_API_KEY || (typeof anthropicApiKey !== "undefined" ? anthropicApiKey.value() : "");
      const apiKey = (rawApiKey || "").trim();

      // Initialize Anthropic client with api key
      const client = new AnthropicClass({ apiKey });

      const response = await client.messages.create({
        model: "claude-sonnet-4-5",
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
// 5. createStripeSession — Stripe Checkout セッション生成
// ═══════════════════════════════════════════════════════════════════════════════
exports.createStripeSession = onRequest(
  {
    secrets: [stripeSecretKey],
    cors: true,
    region: "asia-northeast1",
    invoker: "public",
  },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    try {
      const decoded = await verifyToken(req);
      const uid = decoded.uid;

      const { plan } = req.body;

      // Stripe SDK 初期化
      const Stripe = require("stripe");
      const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: "2024-06-20" });

      // 本番用 Price ID
      const PRICE_IDS = {
        monthly: "price_1TcbXJBduP0zUHEvDr8u2zQL",  // 月額480円/月 使い放題
        peruse:  "price_1TcbYRBduP0zUHEvdxVSNMIp",  // 都度払い 80円/回
      };

      const priceId = plan === "monthly" ? PRICE_IDS.monthly : PRICE_IDS.peruse;
      const mode = plan === "monthly" ? "subscription" : "payment";

      const sessionParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode,
        success_url: `https://wanwan-translator.web.app/?stripe=success&plan=${plan}&uid=${uid}`,
        cancel_url: `https://wanwan-translator.web.app/?stripe=cancel`,
        client_reference_id: uid,
        metadata: {
          uid,
          plan: plan || "monthly",
        },
      };

      if (mode === "payment") {
        sessionParams.payment_intent_data = {
          metadata: {
            uid,
            plan: plan || "monthly",
          }
        };
      }

      if (mode === "subscription") {
        sessionParams.subscription_data = {
          metadata: {
            uid,
            plan: plan || "monthly",
          }
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      console.log(`Stripe session created: ${session.id}, plan: ${plan}, uid: ${uid}`);
      res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      console.error("createStripeSession error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// 6. stripeWebhook — Stripe 決済完了 Webhook
// ═══════════════════════════════════════════════════════════════════════════════
exports.stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
    region: "asia-northeast1",
    invoker: "public",
  },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

    try {
      const Stripe = require("stripe");
      const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: "2024-06-20" });

      let event = req.body;
      const signature = req.headers["stripe-signature"];
      let webhookSecret = "";

      try {
        const functionsInstance = require("firebase-functions");
        if (functionsInstance.config() && functionsInstance.config().stripe && functionsInstance.config().stripe.webhook_secret) {
          webhookSecret = functionsInstance.config().stripe.webhook_secret;
          console.log("Loaded webhookSecret from functions.config().stripe.webhook_secret");
        }
      } catch (configErr) {
        // Ignored in v2
      }

      if (!webhookSecret) {
        webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || (typeof stripeWebhookSecret !== "undefined" ? stripeWebhookSecret.value() : "");
        if (webhookSecret) {
          console.log("Loaded webhookSecret from process.env / Secret Manager");
        }
      }

      const trimmedSecret = (webhookSecret || "").trim();
      console.log(`webhookSecret length (trimmed): ${trimmedSecret.length}`);
      console.log(`stripe-signature header exists: ${!!signature}`);

      if (signature && trimmedSecret) {
        try {
          // Verify webhook signature (req.rawBody contains the buffer)
          event = stripe.webhooks.constructEvent(req.rawBody, signature, trimmedSecret);
          console.log(`Stripe Webhook signature verified successfully. Event: ${event.type}`);
        } catch (err) {
          console.error("Webhook signature verification failed:", err.message);
          res.status(400).send(`Webhook Error: ${err.message}`);
          return;
        }
      } else {
        console.log(`Stripe Webhook signature verification bypassed. Signature: ${!!signature}, Secret: ${!!trimmedSecret}`);
      }

      // ─── checkout.session.completed: 初回決済完了 ───────────────────────────
      if (event.type === "checkout.session.completed") {
        const obj = event.data.object;
        const uid = obj.client_reference_id || obj.metadata?.uid;
        const plan = obj.metadata?.plan || (obj.mode === "subscription" ? "monthly" : "peruse");

        console.log(`checkout.session.completed: uid=${uid}, plan=${plan}, mode=${obj.mode}, subscriptionId=${obj.subscription}`);

        if (!uid) {
          console.warn("No uid in Stripe webhook event metadata or client_reference_id");
          res.status(200).send("OK");
          return;
        }

        const eventRef = db.collection("stripeEvents").doc(event.id);
        const userRef = db.collection("users").doc(uid);

        await db.runTransaction(async (t) => {
          const eventSnap = await t.get(eventRef);
          let userSnap = null;
          if (plan !== "monthly") {
            userSnap = await t.get(userRef);
          }

          if (eventSnap.exists) {
            console.log(`Event ${event.id} already processed.`);
            return;
          }

          t.set(eventRef, {
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            uid,
            plan,
            eventType: event.type
          });

          if (plan === "monthly") {
            // 月額プラン：有効期限を30日後に設定
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);

            t.set(userRef, {
              monthlyPlanActive: true,
              monthlyPlanExpiry: admin.firestore.Timestamp.fromDate(expiry),
              lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
              stripeSessionId: obj.id || null,
              stripeSubscriptionId: obj.subscription || null,
              subscriptionStatus: "active",
              subscriptionPlan: "monthly",
              monthlyCount: 0,
              monthlyLimit: 100,
            }, { merge: true });

            console.log(`Monthly plan activated for uid: ${uid}, subscriptionId: ${obj.subscription}, expires: ${expiry.toISOString()}`);
          } else {
            // 都度払い：クレジット（perUseCredits）を+1
            if (userSnap && userSnap.exists) {
              const data = userSnap.data();
              const currentCredits = data.perUseCredits || 0;
              t.update(userRef, {
                perUseCredits: currentCredits + 1,
                lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            } else {
              t.set(userRef, {
                perUseCredits: 1,
                todayCount: 0,
                usageCount: 0,
                registeredAt: admin.firestore.FieldValue.serverTimestamp(),
                lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
            console.log(`Per-use payment (+1 credit) completed for uid: ${uid}`);
          }
        });
      }

      // ─── payment_intent.succeeded: 都度払いのフォールバック ───────────────────
      else if (event.type === "payment_intent.succeeded") {
        const obj = event.data.object;
        const uid = obj.metadata?.uid;
        const plan = obj.metadata?.plan || "peruse";

        console.log(`payment_intent.succeeded: uid=${uid}, plan=${plan}`);

        if (!uid || plan === "monthly") {
          // 月額はcheckout.session.completedで処理済み or uidなし
          res.status(200).send("OK");
          return;
        }

        const eventRef = db.collection("stripeEvents").doc(event.id);
        const userRef = db.collection("users").doc(uid);

        await db.runTransaction(async (t) => {
          const eventSnap = await t.get(eventRef);
          const userSnap = await t.get(userRef);

          if (eventSnap.exists) {
            console.log(`Event ${event.id} already processed.`);
            return;
          }

          t.set(eventRef, {
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            uid,
            plan,
            eventType: event.type
          });

          if (userSnap.exists) {
            const data = userSnap.data();
            const currentCredits = data.perUseCredits || 0;
            t.update(userRef, {
              perUseCredits: currentCredits + 1,
              lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            t.set(userRef, {
              perUseCredits: 1,
              todayCount: 0,
              usageCount: 0,
              registeredAt: admin.firestore.FieldValue.serverTimestamp(),
              lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
          console.log(`Per-use payment (+1 credit) via payment_intent for uid: ${uid}`);
        });
      }

      // ─── invoice.payment_succeeded: 月額サブスクリプション継続更新 ─────────────
      else if (event.type === "invoice.payment_succeeded") {
        const obj = event.data.object;
        const subscriptionId = obj.subscription;
        const customerId = obj.customer;

        console.log(`invoice.payment_succeeded: subscriptionId=${subscriptionId}, customerId=${customerId}, billing_reason=${obj.billing_reason}`);

        if (!subscriptionId) {
          res.status(200).send("OK");
          return;
        }

        let uid = null;

        // stripeSubscriptionId でユーザーを検索
        const usersSnap = await db.collection("users")
          .where("stripeSubscriptionId", "==", subscriptionId)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          uid = usersSnap.docs[0].id;
        } else {
          // Stripe API からサブスクリプション情報を取得して metadata.uid を確認
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            uid = subscription.metadata?.uid;
            console.log(`Retrieved uid from Stripe subscription metadata: ${uid}`);
          } catch (err) {
            console.error("Failed to retrieve subscription from Stripe:", err.message);
          }
        }

        if (!uid) {
          console.warn(`No user found or resolved for subscriptionId: ${subscriptionId}`);
          res.status(200).send("OK");
          return;
        }

        const userRef = db.collection("users").doc(uid);
        const eventRef = db.collection("stripeEvents").doc(event.id);

        await db.runTransaction(async (t) => {
          const eventSnap = await t.get(eventRef);
          if (eventSnap.exists) {
            console.log(`Event ${event.id} already processed.`);
            return;
          }

          // 有効期限を30日延長
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30);

          t.set(eventRef, {
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            uid,
            plan: "monthly",
            eventType: event.type
          });

          t.set(userRef, {
            monthlyPlanActive: true,
            monthlyPlanExpiry: admin.firestore.Timestamp.fromDate(expiry),
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            stripeSubscriptionId: subscriptionId, // 存在しない場合に備えて保存
            subscriptionStatus: "active",
            subscriptionPlan: "monthly",
            monthlyCount: 0,
            monthlyLimit: 100,
          }, { merge: true });

          console.log(`Monthly plan active/renewed for uid: ${uid}, expires: ${expiry.toISOString()}`);
        });
      }

      // ─── customer.subscription.deleted: サブスクリプションキャンセル ───────────
      else if (event.type === "customer.subscription.deleted") {
        const obj = event.data.object;
        const subscriptionId = obj.id;

        console.log(`customer.subscription.deleted: subscriptionId=${subscriptionId}`);

        const usersSnap = await db.collection("users")
          .where("stripeSubscriptionId", "==", subscriptionId)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          await db.collection("users").doc(userDoc.id).set({
            monthlyPlanActive: false,
            subscriptionStatus: "canceled",
            subscriptionPlan: "",
          }, { merge: true });
          console.log(`Monthly plan cancelled for uid: ${userDoc.id}`);
        }
      }

      res.status(200).send("OK");
    } catch (err) {
      console.error("stripeWebhook error:", err);
      res.status(200).send("OK"); // Stripe には常に200を返す
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// 7. cancelStripeSubscription — Stripe サブスクリプション期末解約
// ═══════════════════════════════════════════════════════════════════════════════
exports.cancelStripeSubscription = onRequest(
  {
    secrets: [stripeSecretKey],
    cors: true,
    region: "asia-northeast1",
    invoker: "public",
  },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    try {
      const decoded = await verifyToken(req);
      const uid = decoded.uid;

      // FirestoreからユーザーのstripeSubscriptionIdを取得
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userData = userSnap.data();
      const subscriptionId = userData.stripeSubscriptionId;

      if (!subscriptionId) {
        res.status(400).json({ error: "No active subscription found for this user" });
        return;
      }

      // Stripe SDK 初期化
      const Stripe = require("stripe");
      const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: "2024-06-20" });

      // Stripeサブスクリプションを期末に解約（cancel_at_period_end: true）
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Firestoreのサブスクリプションキャンセル予約状態を更新
      await userRef.set({
        monthlyPlanCancelScheduled: true,
      }, { merge: true });

      console.log(`Stripe subscription cancel scheduled at period end: ${subscriptionId} for uid: ${uid}`);
      res.json({ success: true, message: "Subscription cancel scheduled successfully." });
    } catch (err) {
      console.error("cancelStripeSubscription error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// 8. adminCancelSubscription — 管理者専用：Stripe サブスクリプション強制即時解約
// ═══════════════════════════════════════════════════════════════════════════════
exports.adminCancelSubscription = onRequest(
  {
    secrets: [stripeSecretKey],
    cors: true,
    region: "asia-northeast1",
    invoker: "public",
  },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

    try {
      const decoded = await verifyToken(req);
      if (decoded.uid !== "OfVGpwdVoUN1peNS1bjGKc1ZG2R2") {
        res.status(403).json({ error: "Forbidden: Admin access only" });
        return;
      }

      const { targetUid } = req.body;
      if (!targetUid) {
        res.status(400).json({ error: "targetUid is required" });
        return;
      }

      // Firestoreから対象ユーザーの stripeSubscriptionId を取得
      const userRef = db.collection("users").doc(targetUid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userData = userSnap.data();
      const subscriptionId = userData.stripeSubscriptionId;

      if (!subscriptionId) {
        res.status(400).json({ error: "No active subscription found for this user" });
        return;
      }

      // Stripe SDK 初期化
      const Stripe = require("stripe");
      const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: "2024-06-20" });

      // Stripeサブスクリプションを即時解約
      await stripe.subscriptions.cancel(subscriptionId);

      // Firestoreのサブスクリプション状態を即時無効化
      await userRef.set({
        monthlyPlanActive: false,
        subscriptionStatus: "canceled",
        subscriptionPlan: "",
        monthlyPlanCancelScheduled: false,
      }, { merge: true });

      console.log(`Stripe subscription force cancelled: ${subscriptionId} for uid: ${targetUid} by admin`);
      res.json({ success: true, message: "Subscription force cancelled successfully." });
    } catch (err) {
      console.error("adminCancelSubscription error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);


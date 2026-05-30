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
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || (typeof stripeWebhookSecret !== "undefined" ? stripeWebhookSecret.value() : "");

      if (signature && webhookSecret) {
        try {
          // Verify webhook signature (req.rawBody contains the buffer)
          event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret.trim());
          console.log(`Stripe Webhook signature verified successfully. Event: ${event.type}`);
        } catch (err) {
          console.error("Webhook signature verification failed:", err.message);
          res.status(400).send(`Webhook Error: ${err.message}`);
          return;
        }
      } else {
        console.log(`Stripe Webhook received directly without signature verification. Event: ${event.type}`);
      }

      if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
        const obj = event.data.object;
        const uid = obj.client_reference_id || obj.metadata?.uid;
        const plan = obj.metadata?.plan || "monthly";

        if (!uid) {
          console.warn("No uid in Stripe webhook event metadata or client_reference_id");
          res.status(200).send("OK");
          return;
        }

        const eventRef = db.collection("stripeEvents").doc(event.id);
        const userRef = db.collection("users").doc(uid);

        await db.runTransaction(async (t) => {
          const eventSnap = await t.get(eventRef);
          if (eventSnap.exists) {
            console.log(`Event ${event.id} already processed.`);
            return;
          }

          // Mark event as processed
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
            }, { merge: true });

            console.log(`Monthly plan activated for uid: ${uid}, expires: ${expiry.toISOString()}`);
          } else {
            // 都度払い：クレジット（perUseCredits）を+1
            const userSnap = await t.get(userRef);
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
            console.log(`Per-use payment (+1 credit) completed for uid: ${uid}`);
          }
        });
      }

      res.status(200).send("OK");
    } catch (err) {
      console.error("stripeWebhook error:", err);
      res.status(200).send("OK"); // Stripe には常に200を返す
    }
  }
);


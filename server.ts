import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  initDatabase,
  getKV,
  setKV,
  getProducts,
  saveProduct,
  deleteProduct,
  decrementProductStock,
  getFAQs,
  saveFAQ,
  deleteFAQ,
  getOrders,
  saveOrder,
  updateOrderStatus,
  getBookings,
  saveBooking,
  updateBookingStatus,
  getConversations,
  getOrCreateConversation,
  setConversationTakeover,
  saveMessage,
  getLastNMessages,
  getActivities,
  addActivity,
  resetAllData,
} from "./src/server/db.ts";
import {
  getWhatsAppConfig,
  isWhatsAppConfigured,
  sendWhatsAppTextMessage,
  markWhatsAppMessageAsRead,
  verifyMetaSignature,
  notifyOwnerOnWhatsApp,
} from "./src/server/whatsapp.ts";
import {
  BusinessInfo,
  AssistantSettings,
  AIResponsePayload,
  Order,
  Booking,
} from "./src/types.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware to capture raw body for webhook signature verification
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// -------------------------------------------------------------
// 1. WhatsApp Cloud API Webhooks
// -------------------------------------------------------------

/**
 * Webhook Verification (Handshake with Meta)
 * Meta makes a GET request with hub.mode, hub.verify_token, and hub.challenge
 */
app.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const cfg = getWhatsAppConfig();
  const expectedVerifyToken = cfg.verifyToken || "chatbuddy_secure_verify_token_2026";

  if (mode === "subscribe" && token === expectedVerifyToken) {
    console.log("[WhatsApp Webhook Handshake]: Verified successfully with Meta!");
    return res.status(200).send(challenge);
  }

  console.warn("[WhatsApp Webhook Handshake Failed]: Token mismatch or invalid mode", {
    receivedToken: token,
    expectedToken: expectedVerifyToken,
  });
  return res.status(403).send("Forbidden");
});

/**
 * Incoming WhatsApp Messages Webhook
 * Meta delivers customer messages via POST request
 */
app.post("/webhook/whatsapp", async (req: any, res) => {
  try {
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const cfg = getWhatsAppConfig();

    // Verify signature if app secret is provided
    if (cfg.appSecret && req.rawBody) {
      const isValid = verifyMetaSignature(req.rawBody, signature, cfg.appSecret);
      if (!isValid) {
        console.warn("[WhatsApp Webhook]: Invalid HMAC signature detected!");
        return res.status(401).send("Invalid signature");
      }
    }

    const body = req.body;

    // Fast 200 OK acknowledgment to Meta
    res.status(200).send("EVENT_RECEIVED");

    // Check if this is a WhatsApp message event
    if (body.object === "whatsapp_business_account" && body.entry) {
      for (const entry of body.entry) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === "messages" && change.value) {
            const value = change.value;
            const messages = value.messages || [];
            const contacts = value.contacts || [];

            for (const msg of messages) {
              await handleIncomingWhatsAppMessage(msg, contacts);
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error("[WhatsApp Webhook Error]:", err);
    // Already sent 200 to Meta or handle error
  }
});

/**
 * Process a single incoming WhatsApp message
 */
async function handleIncomingWhatsAppMessage(msg: any, contacts: any[] = []) {
  const fromPhone = msg.from; // Customer's phone number
  const messageId = msg.id;
  const messageType = msg.type; // 'text', 'image', 'audio', etc.

  // Extract customer display name
  const contact = contacts.find((c: any) => c.wa_id === fromPhone);
  const customerName = contact?.profile?.name || "Customer (" + fromPhone.slice(-4) + ")";

  console.log(`[Incoming WhatsApp Message] From: ${customerName} (${fromPhone}) | Type: ${messageType}`);

  // Mark message as read
  await markWhatsAppMessageAsRead(messageId);

  // Get or create conversation in SQLite
  const conversation = getOrCreateConversation(fromPhone, customerName, "whatsapp");

  // Check if this is an unsupported media type
  if (messageType !== "text") {
    const bizInfo = getKV<any>("business_info", {});
    const unsupportedNotice = `Thank you for reaching out to *${bizInfo.name || "our store"}*! 🍰 Currently our WhatsApp assistant supports text messages. Please type your message, order, or booking request, and I'll assist you immediately!`;
    
    saveMessage(conversation.id, {
      id: "msg-" + Date.now(),
      sender: "user",
      text: `[Sent media: ${messageType}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read",
      messageType: messageType as any,
    });

    saveMessage(conversation.id, {
      id: "msg-" + (Date.now() + 1),
      sender: "assistant",
      text: unsupportedNotice,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read",
    });

    await sendWhatsAppTextMessage(fromPhone, unsupportedNotice);
    return;
  }

  const incomingText = msg.text?.body || "";

  // Save customer message to SQLite
  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  saveMessage(conversation.id, {
    id: messageId || "msg-" + Date.now(),
    sender: "user",
    text: incomingText,
    timestamp: currentTime,
    status: "read",
    messageType: "text",
  });

  // Check Human Takeover: if enabled for this conversation, don't generate bot reply!
  if (conversation.humanTakeover) {
    console.log(`[Human Takeover Active]: Assistant stayed silent for customer ${fromPhone}`);
    addActivity({
      id: "act-" + Date.now(),
      type: "takeover",
      title: "Customer Messaged (Human Takeover)",
      description: `${customerName}: "${incomingText.slice(0, 50)}..."`,
      timestamp: "Just now",
      linkPage: "conversations",
    });
    return;
  }

  // Check if assistant is globally paused in settings
  const settings: AssistantSettings = getKV("settings", {
    assistantName: "Buddy",
    greeting: "Hello!",
    tone: "friendly",
    language: "auto",
    ownerPhone: "",
    active: true,
  });

  const businessInfo: BusinessInfo = getKV("business_info", {
    name: "Artisan Bakes & Café",
    tagline: "",
    hours: "Mon - Sun: 8:00 AM - 9:30 PM",
    deliveryCharges: 4.5,
    freeDeliveryAbove: 35.0,
    paymentMethods: ["Cash on Delivery", "Card"],
    location: "Downtown",
    phone: "+1 (555) 392-1084",
    currency: "$",
  });

  if (!settings.active) {
    const awayMessage = `Thank you for contacting *${businessInfo.name}*! 🌙 Our assistant is currently away. A team member will respond during store hours (${businessInfo.hours}). You can also call us at ${businessInfo.phone}.`;
    saveMessage(conversation.id, {
      id: "msg-away-" + Date.now(),
      sender: "assistant",
      text: awayMessage,
      timestamp: currentTime,
      status: "read",
    });
    await sendWhatsAppTextMessage(fromPhone, awayMessage);
    return;
  }

  // Load last 20 messages for context
  const history = getLastNMessages(conversation.id, 20);
  const products = getProducts();
  const faqs = getFAQs();

  // Run Gemini Assistant Engine
  const aiResult = await processAssistantResponse(
    history,
    businessInfo,
    products,
    faqs,
    settings,
    customerName,
    fromPhone
  );

  // Save Assistant reply to SQLite
  saveMessage(conversation.id, {
    id: "msg-" + (Date.now() + 1),
    sender: "assistant",
    text: aiResult.reply,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: "sent",
    intent: aiResult.intent,
    summary: aiResult.summary,
  });

  // Handle completed order
  if (aiResult.order && aiResult.order.isComplete) {
    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: orderId,
      customerName: aiResult.order.customerName || customerName,
      phone: aiResult.order.phone || fromPhone,
      address: aiResult.order.address || "WhatsApp Delivery Address",
      items: aiResult.order.items || [
        {
          productName: "Ordered Item",
          quantity: 1,
          unitPrice: aiResult.order.subtotal || 25,
          lineTotal: aiResult.order.subtotal || 25,
        },
      ],
      subtotal: Number(aiResult.order.subtotal || 0),
      deliveryFee: Number(aiResult.order.deliveryFee || 0),
      total: Number(aiResult.order.total || (aiResult.order.subtotal || 0) + (aiResult.order.deliveryFee || 0)),
      status: "New",
      createdAt: new Date().toISOString(),
      notes: aiResult.order.notes || "Captured via WhatsApp Cloud API",
    };

    saveOrder(newOrder);

    // Auto-decrement inventory stock!
    if (newOrder.items && newOrder.items.length > 0) {
      for (const item of newOrder.items) {
        decrementProductStock(item.productName, item.quantity);
      }
    }

    addActivity({
      id: "act-" + Date.now(),
      type: "order",
      title: "WhatsApp Order Captured",
      description: `${newOrder.customerName} ordered for $${newOrder.total.toFixed(2)} (Stock decremented)`,
      timestamp: "Just now",
      linkPage: "orders",
    });

    // Notify business owner on WhatsApp
    await notifyOwnerOnWhatsApp(
      "New Order Received! 🛒",
      `Order: #${newOrder.id}\nCustomer: ${newOrder.customerName} (${newOrder.phone})\nAddress: ${newOrder.address}\nTotal: $${newOrder.total.toFixed(2)}\nItems: ${newOrder.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}`
    );
  }

  // Handle completed booking
  if (aiResult.booking && aiResult.booking.isComplete) {
    const bookingId = "BK-" + Math.floor(300 + Math.random() * 700);
    const newBooking: Booking = {
      id: bookingId,
      customerName: aiResult.booking.customerName || customerName,
      phone: aiResult.booking.phone || fromPhone,
      service: aiResult.booking.service || "Table Reservation",
      date: aiResult.booking.date || "Tomorrow",
      time: aiResult.booking.time || "7:00 PM",
      guests: aiResult.booking.guests || 2,
      status: "Confirmed",
      createdAt: new Date().toISOString(),
      notes: aiResult.booking.notes || "Booked via WhatsApp Cloud API",
    };

    saveBooking(newBooking);

    addActivity({
      id: "act-" + Date.now(),
      type: "booking",
      title: "Table Booking Confirmed",
      description: `${newBooking.customerName} reserved ${newBooking.service} for ${newBooking.guests} guests on ${newBooking.date}`,
      timestamp: "Just now",
      linkPage: "bookings",
    });

    // Notify business owner on WhatsApp
    await notifyOwnerOnWhatsApp(
      "New Table Booking! 📅",
      `Booking: #${newBooking.id}\nCustomer: ${newBooking.customerName} (${newBooking.phone})\nService: ${newBooking.service}\nDate & Time: ${newBooking.date} at ${newBooking.time}\nGuests: ${newBooking.guests}`
    );
  }

  // Send WhatsApp message reply to customer
  await sendWhatsAppTextMessage(fromPhone, aiResult.reply);
}

// -------------------------------------------------------------
// 2. Core Gemini Intelligence Engine
// -------------------------------------------------------------

async function processAssistantResponse(
  messages: any[],
  businessInfo: BusinessInfo,
  products: any[],
  faqs: any[],
  settings: AssistantSettings,
  customerName: string = "Customer",
  customerPhone: string = ""
): Promise<AIResponsePayload> {
  const businessName = businessInfo?.name || "Our Store";
  const assistantName = settings?.assistantName || "Buddy";
  const tone = settings?.tone || "Friendly, short, and use light emojis";
  const preferredLang = settings?.language || "customer's language (English, Urdu, Hindi, or Roman Urdu)";

  const productsText = (products || [])
    .map(
      (p: any) =>
        `- ID: ${p.id} | Name: "${p.name}" | Category: ${p.category || "General"} | Price: $${Number(p.price).toFixed(2)} | Stock: ${p.stock} units | In Stock: ${p.stock > 0 && p.inStock !== false ? "YES" : "NO"} | Description: ${p.description || "N/A"}`
    )
    .join("\n");

  const faqsText = (faqs || [])
    .map((f: any, i: number) => `Q${i + 1}: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  const policiesText = `
Business Name: ${businessName}
Assistant Name: ${assistantName}
Operating Hours: ${businessInfo?.hours || "Mon - Sun: 9:00 AM - 9:00 PM"}
Delivery Charges: $${Number(businessInfo?.deliveryCharges || 0).toFixed(2)}
Free Delivery Policy: ${
    Number(businessInfo?.freeDeliveryAbove) > 0
      ? `Free delivery on orders above $${Number(businessInfo.freeDeliveryAbove).toFixed(2)}`
      : "Standard delivery charge applies to all orders"
  }
Payment Methods: ${(businessInfo?.paymentMethods || ["Cash on Delivery", "Card", "Bank Transfer"]).join(", ")}
Location: ${businessInfo?.location || "Downtown"}
Contact Phone: ${businessInfo?.phone || "+1-234-567-8900"}
Owner WhatsApp: ${settings?.ownerPhone || "+1-234-567-8900"}
`;

  const systemInstruction = `
You are ${assistantName}, the WhatsApp assistant of ${businessName}.
Be ${tone}. Use light emojis like a real WhatsApp chat (e.g., ✅, 🍰, 📦, 📍, 😊, 📅, 🙏). Keep replies concise and easy to read on mobile.
Answer ONLY from the products, FAQs, and business info provided below. Never invent prices, stock, or store policies.
Always check stock before confirming any product order or availability. If stock is 0 or insufficient, inform the customer politely and suggest an in-stock alternative if applicable.

ORDER COLLECTION RULES:
To take an order, actively collect step by step:
1. Product item(s) and specific quantity
2. Customer full name
3. Customer phone number
4. Delivery address
Once all 4 details are provided AND items are verified in stock, calculate:
- subtotal = sum of (quantity * item unit price)
- deliveryFee = ${businessInfo?.deliveryCharges || 0} (or $0.00 if subtotal >= ${businessInfo?.freeDeliveryAbove || 9999})
- total = subtotal + deliveryFee
Confirm the full order breakdown to the customer in the reply and set "order.isComplete" to true. If any detail is still missing (e.g. address or phone), set "order.isComplete" to false.

BOOKING COLLECTION RULES:
To take a booking / reservation / consultation, collect:
1. Service / reservation request
2. Date
3. Time
4. Customer name
5. Customer phone number
Once all 5 details are provided, confirm in reply and set "booking.isComplete" to true. If anything is missing, set "booking.isComplete" to false.

UNKNOWN INFORMATION:
If the user asks something not in the provided products, FAQs, or business info, say you'll pass their query to the store manager/team right away and offer to take a message or have the owner (${settings?.ownerPhone || "store manager"}) call them.

LANGUAGE:
Reply in the customer's language. If they speak Urdu, reply in Urdu or Roman Urdu as appropriate. If they speak Hindi, reply in Hindi/Hinglish. If English, reply in English. Preferred default/mode: ${preferredLang}.

AVAILABLE PRODUCTS:
${productsText || "No products currently listed."}

FREQUENTLY ASKED QUESTIONS (FAQs):
${faqsText || "No FAQs listed."}

BUSINESS INFO:
${policiesText}

OUTPUT FORMAT:
You MUST return ONLY a single valid JSON object with EXACTLY this structure:
{
  "reply": "string (the friendly WhatsApp message to send back)",
  "intent": "faq" | "stock_check" | "order" | "booking" | "delivery_info" | "other",
  "order": null or {
    "isComplete": boolean,
    "customerName": "string",
    "phone": "string",
    "address": "string",
    "items": [
      {
        "productId": "string",
        "productName": "string",
        "quantity": number,
        "unitPrice": number,
        "lineTotal": number
      }
    ],
    "subtotal": number,
    "deliveryFee": number,
    "total": number,
    "notes": "string"
  },
  "booking": null or {
    "isComplete": boolean,
    "customerName": "string",
    "phone": "string",
    "service": "string",
    "date": "string",
    "time": "string",
    "guests": number,
    "notes": "string"
  },
  "urgency": "low" | "medium" | "high",
  "summary": "1-sentence internal summary of customer inquiry"
}
`;

  // Format turns ensuring alternating user and model
  const sanitizedTurns: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  const validMessages = (messages || []).filter((m: any) => m.sender === "user" || m.sender === "assistant");

  if (validMessages.length > 0 && validMessages[0].sender === "assistant") {
    sanitizedTurns.push({
      role: "user",
      parts: [{ text: "Hi" }],
    });
  }

  for (const msg of validMessages) {
    const role = msg.sender === "user" ? "user" : "model";
    const text = typeof msg.text === "string" ? msg.text.trim() : JSON.stringify(msg.text);
    if (!text) continue;

    const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
    if (lastTurn && lastTurn.role === role) {
      lastTurn.parts[0].text += "\n" + text;
    } else {
      sanitizedTurns.push({
        role,
        parts: [{ text }],
      });
    }
  }

  if (sanitizedTurns.length === 0) {
    sanitizedTurns.push({
      role: "user",
      parts: [{ text: "Hello" }],
    });
  }

  let parsedResult: any = null;

  if (ai) {
    const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest"];
    for (const modelName of modelsToTry) {
      try {
        const responsePromise = ai.models.generateContent({
          model: modelName,
          contents: sanitizedTurns,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const response: any = await Promise.race([responsePromise, timeoutPromise]);
        const rawText = response.text || "";
        const cleaned = rawText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        try {
          parsedResult = JSON.parse(cleaned);
        } catch {
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) {
            parsedResult = JSON.parse(match[0]);
          }
        }

        if (parsedResult && parsedResult.reply) {
          break;
        }
      } catch (err: any) {
        console.warn(`Gemini try ${modelName}:`, err?.message);
      }
    }
  }

  // Fallback to local rule-based extractor if offline or Gemini 503
  if (!parsedResult || !parsedResult.reply) {
    parsedResult = generateLocalAssistantFallback(
      messages[messages.length - 1]?.text || "",
      businessInfo,
      products,
      faqs,
      settings,
      customerName,
      customerPhone
    );
  }

  return parsedResult;
}

// Local intelligent rule-based fallback simulator
function generateLocalAssistantFallback(
  userText: string,
  businessInfo: any,
  products: any[] = [],
  faqs: any[] = [],
  _settings: any,
  customerName: string = "Customer",
  customerPhone: string = ""
): AIResponsePayload {
  const lower = userText.toLowerCase().trim();
  const bizName = businessInfo?.name || "our store";
  const standardDelivery = Number(businessInfo?.deliveryCharges || 4.5);
  const freeThreshold = Number(businessInfo?.freeDeliveryAbove || 35);

  // 1. ORDER CHECK
  const isOrderIntent =
    lower.includes("order") ||
    lower.includes("buy") ||
    lower.includes("deliver to") ||
    lower.includes("send to") ||
    lower.includes("address");

  if (isOrderIntent) {
    const matchedProduct = products.find((p) => {
      const pName = p.name.toLowerCase();
      return (
        lower.includes(pName) ||
        pName.split(" ").filter((w: string) => w.length > 4).some((w: string) => lower.includes(w))
      );
    }) || products[0];

    const qtyMatch = userText.match(/\b([1-9]|10)\s*(x|piece|pieces|box|boxes|cake|cakes|loaf|loaves|coffee|cup|cups)?\b/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    const hasAddress =
      lower.includes("address") ||
      lower.includes("ave") ||
      lower.includes("street") ||
      lower.includes("st") ||
      lower.includes("road") ||
      lower.includes("rd") ||
      lower.includes("lane");

    const hasPhone = /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(userText) || lower.includes("phone");

    if (matchedProduct && (hasAddress || hasPhone)) {
      const unitPrice = Number(matchedProduct.price);
      const subtotal = unitPrice * quantity;
      const deliveryFee = subtotal >= freeThreshold ? 0 : standardDelivery;
      const total = subtotal + deliveryFee;

      let name = customerName || "Sarah Jenkins";
      const nameMatch = userText.match(/(?:my name is|name is|i am|under)\s+([A-Za-z\s]{2,20})/i);
      if (nameMatch) name = nameMatch[1].trim();

      let phone = customerPhone || "+1 (555) 234-8899";
      const phoneMatch = userText.match(/(\+?[\d\s()-]{7,15})/);
      if (phoneMatch) phone = phoneMatch[0].trim();

      let address = "48 Oak Ave, Apt 3B";
      const addressMatch = userText.match(/(?:address is:?|address:?|deliver to:?|delivery to:?)\s+([^,.\n]+)/i);
      if (addressMatch) address = addressMatch[1].trim();
      else {
        const streetMatch = userText.match(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Boulevard|Blvd)\b/i);
        if (streetMatch) address = streetMatch[0].trim();
      }

      return {
        reply: `🎉 *Order Confirmed!* Thank you, *${name}*!\n\n📦 *Order Breakdown:*\n• ${quantity}x ${matchedProduct.name} ($${subtotal.toFixed(2)})\n• Delivery: $${deliveryFee.toFixed(2)} ${deliveryFee === 0 ? "(FREE! 🎉)" : ""}\n• *Total Amount: $${total.toFixed(2)}*\n\n📍 Delivery to: ${address}\n📞 Contact: ${phone}\n\nOur kitchen has started preparing your order. Estimated delivery: 35-45 minutes. You can pay via Cash on Delivery or Card! 🍰`,
        intent: "order",
        order: {
          isComplete: true,
          customerName: name,
          phone,
          address,
          items: [
            {
              productId: matchedProduct.id,
              productName: matchedProduct.name,
              quantity,
              unitPrice,
              lineTotal: subtotal,
            },
          ],
          subtotal,
          deliveryFee,
          total,
          notes: "Captured in WhatsApp chat",
        },
        booking: null,
        urgency: "high",
        summary: `Completed order for ${name}: ${quantity}x ${matchedProduct.name} ($${total.toFixed(2)})`,
      };
    }

    return {
      reply: `I'd love to take your order for *${bizName}*! 🛍️\n\nTo confirm, please share:\n1. Desired item(s) & quantity\n2. Your full name\n3. Contact phone\n4. Delivery address\n\nI'll check stock and calculate your final total with delivery immediately! 📦`,
      intent: "order",
      order: null,
      booking: null,
      urgency: "medium",
      summary: "Inquired about placing an order",
    };
  }

  // 2. BOOKING CHECK
  if (lower.includes("book") || lower.includes("reservation") || lower.includes("reserve") || lower.includes("table")) {
    const hasTime = /\b(\d{1,2}(:\d{2})?\s*(am|pm))\b/i.test(userText) || lower.includes("tomorrow") || lower.includes("tonight") || lower.includes("pm");

    if (hasTime) {
      let name = customerName || "David Chen";
      const nameMatch = userText.match(/(?:my name is|name is|under)\s+([A-Za-z\s]{2,20})/i);
      if (nameMatch) name = nameMatch[1].trim();

      let time = "7:00 PM";
      const timeMatch = userText.match(/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i);
      if (timeMatch) time = timeMatch[0];

      let date = "Tomorrow";
      if (lower.includes("friday")) date = "This Friday";
      else if (lower.includes("saturday")) date = "This Saturday";
      else if (lower.includes("sunday")) date = "This Sunday";
      else if (lower.includes("today") || lower.includes("tonight")) date = "Tonight";

      let guests = 2;
      const guestMatch = userText.match(/(\d+)\s*(people|guests|persons|person)/i);
      if (guestMatch) guests = parseInt(guestMatch[1], 10);

      return {
        reply: `📅 *Table Reservation Confirmed!* ✨\n\n• Name: *${name}*\n• Service: Table for ${guests}\n• Date & Time: ${date} at ${time}\n• Location: ${businessInfo?.location || "48 Maple Street, Downtown"}\n\nWe look forward to hosting you at *${bizName}*! If you need to make changes, just message here. 😊`,
        intent: "booking",
        order: null,
        booking: {
          isComplete: true,
          customerName: name,
          phone: customerPhone || "+1 (555) 782-9920",
          service: `Table for ${guests}`,
          date,
          time,
          guests,
          notes: "Reserved via WhatsApp Assistant",
        },
        urgency: "medium",
        summary: `Confirmed booking for ${name} (${guests} guests on ${date} at ${time})`,
      };
    }

    return {
      reply: `I'd be delighted to reserve a table for you at *${bizName}*! 📅\n\nPlease let me know:\n• Preferred Date & Time\n• Number of guests\n• Your Name & Phone number\n\nI'll confirm your reservation right away! ✨`,
      intent: "booking",
      order: null,
      booking: null,
      urgency: "medium",
      summary: "Inquired about booking a table",
    };
  }

  // 3. STOCK CHECK
  const matchedProduct = products.find((p) => {
    const nameLower = p.name.toLowerCase();
    return (
      lower.includes(nameLower) ||
      nameLower.split(" ").filter((w: string) => w.length > 3).some((word: string) => lower.includes(word))
    );
  });

  if (matchedProduct) {
    if (matchedProduct.stock > 0 && matchedProduct.inStock !== false) {
      return {
        reply: `Yes! *${matchedProduct.name}* is in stock! ✅ (${matchedProduct.stock} units available)\n💵 Price: $${Number(matchedProduct.price).toFixed(2)}\n📝 ${matchedProduct.description || ""}\n\nWould you like to place an order or know more? Just tell me your desired quantity and address! 🛍️`,
        intent: "stock_check",
        order: null,
        booking: null,
        urgency: "medium",
        summary: `Stock check: ${matchedProduct.name} (In stock: ${matchedProduct.stock})`,
      };
    } else {
      return {
        reply: `Sorry, *${matchedProduct.name}* is currently out of stock 😔. Our bakers bake fresh batches daily! Would you like me to recommend another customer favorite like our *${products[0]?.name || "fresh cakes"}*? 🍰`,
        intent: "stock_check",
        order: null,
        booking: null,
        urgency: "low",
        summary: `Stock check: ${matchedProduct.name} (Out of stock)`,
      };
    }
  }

  // 4. DELIVERY INFO
  if (lower.includes("delivery") || lower.includes("shipping") || lower.includes("charge") || lower.includes("charges")) {
    return {
      reply: `🛵 *Delivery Information for ${bizName}:*\n• Standard Delivery Fee: $${standardDelivery.toFixed(2)}\n• Free Delivery: On all orders over $${freeThreshold.toFixed(2)}! 🎉\n• Timings: ${businessInfo?.hours || "Every day 8am - 9:30pm"}\n• Delivery Window: 30-45 minutes in insulated boxes\n\nWould you like to place an order for delivery today?`,
      intent: "delivery_info",
      order: null,
      booking: null,
      urgency: "low",
      summary: "Inquired about delivery charges and free delivery threshold",
    };
  }

  // 5. PAYMENT METHODS
  if (lower.includes("payment") || lower.includes("pay") || lower.includes("cash") || lower.includes("card")) {
    const methods = (businessInfo?.paymentMethods || ["Cash on Delivery", "Credit/Debit Card", "Bank Transfer"]).join(", ");
    return {
      reply: `💳 *Accepted Payment Methods at ${bizName}:*\n• ${methods}\n\nCash on Delivery is available for all local delivery orders! ✅`,
      intent: "faq",
      order: null,
      booking: null,
      urgency: "low",
      summary: "Inquired about payment options",
    };
  }

  // 6. HOURS & LOCATION
  if (lower.includes("hours") || lower.includes("open") || lower.includes("close") || lower.includes("timing") || lower.includes("location") || lower.includes("where")) {
    return {
      reply: `📍 *Location & Hours for ${bizName}:*\n• Address: ${businessInfo?.location || "48 Maple Street, Downtown"}\n• Operating Hours: ${businessInfo?.hours || "Mon - Sun: 8:00 AM - 9:30 PM"}\n\nFeel free to drop by or order online right here! ✨`,
      intent: "faq",
      order: null,
      booking: null,
      urgency: "low",
      summary: "Inquired about store location and operating hours",
    };
  }

  // 7. FAQS
  for (const faq of faqs) {
    const qLower = faq.question.toLowerCase();
    const keywords = qLower.split(/\s+/).filter((w: string) => w.length > 3);
    const matches = keywords.filter((k: string) => lower.includes(k));
    if (matches.length >= 2 || (keywords.length === 1 && matches.length === 1)) {
      return {
        reply: `${faq.answer} ✅\n\nLet me know if you would like to order or have any other questions!`,
        intent: "faq",
        order: null,
        booking: null,
        urgency: "low",
        summary: `Answered FAQ: "${faq.question}"`,
      };
    }
  }

  // 8. URDU / ROMAN URDU / HINDI
  if (lower.includes("urdu") || lower.includes("salam") || lower.includes("assalam") || lower.includes("kya hal") || lower.includes("hai") || lower.includes("namaste")) {
    return {
      reply: `Walaikum Assalam / Namaste! 👋 *${bizName}* mein khushamdeed! Main aap ka WhatsApp assistant hoon. Aap hamaray fresh items, delivery charges, order ya booking ke baray mein pooch saktay hain. Main aap ki kya madad karoon? 🍰`,
      intent: "other",
      order: null,
      booking: null,
      urgency: "low",
      summary: "Customer greeted in Urdu / Hindi / Roman Urdu",
    };
  }

  // 9. GREETING
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/i.test(lower)) {
    return {
      reply: `Hello! 👋 Welcome to *${bizName}*. How can I sweeten your day? You can check our fresh menu, ask about stock, place an order, or reserve a table! 🍰`,
      intent: "other",
      order: null,
      booking: null,
      urgency: "low",
      summary: "Customer greeted the assistant",
    };
  }

  // 10. DEFAULT
  return {
    reply: `Thanks for messaging *${bizName}*! 😊 I can check stock, take your order, book a table, or answer questions about our delivery and menu. What would you like help with?`,
    intent: "other",
    order: null,
    booking: null,
    urgency: "low",
    summary: "General inquiry",
  };
}

// -------------------------------------------------------------
// 3. REST API Routes for Owner Dashboard
// -------------------------------------------------------------

// System Status Endpoint (Connection Statuses)
app.get("/api/status", (_req, res) => {
  const cfg = getWhatsAppConfig();
  const isDemo = !isWhatsAppConfigured();
  const conversations = getConversations();

  res.json({
    geminiConnected: Boolean(apiKey),
    geminiModel: "gemini-3.8-flash",
    whatsappConnected: isWhatsAppConfigured(),
    whatsappPhoneNumberId: cfg.phoneNumberId || null,
    whatsappVerifyTokenSet: Boolean(cfg.verifyToken),
    whatsappAppSecretSet: Boolean(cfg.appSecret),
    ownerPhone: cfg.ownerPhone || null,
    isDemoMode: isDemo,
    activeConversations: conversations.length,
    webhookUrl: `${process.env.APP_URL || "https://your-domain.com"}/webhook/whatsapp`,
  });
});

// Full state payload for Dashboard
app.get("/api/data", (_req, res) => {
  res.json({
    products: getProducts(),
    faqs: getFAQs(),
    businessInfo: getKV("business_info", {}),
    settings: getKV("settings", {}),
    orders: getOrders(),
    bookings: getBookings(),
    conversations: getConversations(),
    activities: getActivities(),
  });
});

// Products API
app.post("/api/products", (req, res) => {
  const { action, product, id, delta } = req.body;
  if (action === "save" && product) {
    saveProduct(product);
  } else if (action === "delete" && id) {
    deleteProduct(id);
  } else if (action === "adjustStock" && id && typeof delta === "number") {
    decrementProductStock(id, -delta);
  }
  res.json({ success: true, products: getProducts() });
});

// FAQs API
app.post("/api/faqs", (req, res) => {
  const { action, faq, id } = req.body;
  if (action === "save" && faq) {
    saveFAQ(faq);
  } else if (action === "delete" && id) {
    deleteFAQ(id);
  }
  res.json({ success: true, faqs: getFAQs() });
});

// Business Info API
app.post("/api/business-info", (req, res) => {
  setKV("business_info", req.body);
  res.json({ success: true, businessInfo: getKV("business_info", {}) });
});

// Settings API
app.post("/api/settings", (req, res) => {
  setKV("settings", req.body);
  res.json({ success: true, settings: getKV("settings", {}) });
});

// Orders API
app.post("/api/orders", (req, res) => {
  const { action, order, id, status } = req.body;
  if (action === "create" && order) {
    saveOrder(order);
    if (order.items && order.items.length > 0) {
      for (const it of order.items) {
        decrementProductStock(it.productName, it.quantity);
      }
    }
  } else if (action === "updateStatus" && id && status) {
    updateOrderStatus(id, status);
  }
  res.json({ success: true, orders: getOrders(), products: getProducts() });
});

// Bookings API
app.post("/api/bookings", (req, res) => {
  const { action, booking, id, status } = req.body;
  if (action === "create" && booking) {
    saveBooking(booking);
  } else if (action === "updateStatus" && id && status) {
    updateBookingStatus(id, status);
  }
  res.json({ success: true, bookings: getBookings() });
});

// Conversations API
app.post("/api/conversations/takeover", (req, res) => {
  const { conversationId, takeover } = req.body;
  setConversationTakeover(conversationId, Boolean(takeover));
  res.json({ success: true, conversations: getConversations() });
});

// Owner sends manual WhatsApp message to customer
app.post("/api/conversations/send", async (req, res) => {
  const { conversationId, text, customerPhone } = req.body;
  if (!text || !conversationId) {
    return res.status(400).json({ error: "conversationId and text required" });
  }

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const msg = {
    id: "msg-" + Date.now(),
    sender: "owner" as const,
    text,
    timestamp: time,
    status: "sent" as const,
  };

  saveMessage(conversationId, msg);

  // If customer phone is available, dispatch via WhatsApp Cloud API
  if (customerPhone) {
    await sendWhatsAppTextMessage(customerPhone, text);
  }

  res.json({ success: true, conversations: getConversations() });
});

// Simulator Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, businessInfo, products, faqs, settings, customerPhone, customerName } = req.body;

    const convPhone = customerPhone || "+1 (555) 234-8899";
    const convName = customerName || "Sarah Jenkins";
    const conversation = getOrCreateConversation(convPhone, convName, "simulator");

    const userText = messages[messages.length - 1]?.text || "";
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    saveMessage(conversation.id, {
      id: "sim-" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: time,
      status: "read",
    });

    const aiResult = await processAssistantResponse(
      messages,
      businessInfo || getKV("business_info", {}),
      products || getProducts(),
      faqs || getFAQs(),
      settings || getKV("settings", {}),
      convName,
      convPhone
    );

    // Save model response
    saveMessage(conversation.id, {
      id: "sim-" + (Date.now() + 1),
      sender: "assistant",
      text: aiResult.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read",
      intent: aiResult.intent,
      summary: aiResult.summary,
    });

    // Auto-save Order if complete
    if (aiResult.order && aiResult.order.isComplete) {
      const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
      const newOrder: Order = {
        id: orderId,
        customerName: aiResult.order.customerName || convName,
        phone: aiResult.order.phone || convPhone,
        address: aiResult.order.address || "Simulated Address",
        items: aiResult.order.items || [
          {
            productName: "Ordered Item",
            quantity: 1,
            unitPrice: aiResult.order.subtotal || 25,
            lineTotal: aiResult.order.subtotal || 25,
          },
        ],
        subtotal: Number(aiResult.order.subtotal || 0),
        deliveryFee: Number(aiResult.order.deliveryFee || 0),
        total: Number(aiResult.order.total || 0),
        status: "New",
        createdAt: new Date().toISOString(),
        notes: "Captured in WhatsApp Simulator",
      };

      saveOrder(newOrder);

      // Decrement product stock in SQLite
      if (newOrder.items) {
        for (const it of newOrder.items) {
          decrementProductStock(it.productName, it.quantity);
        }
      }

      addActivity({
        id: "act-" + Date.now(),
        type: "order",
        title: "Simulator Order Captured",
        description: `${newOrder.customerName} ordered for $${newOrder.total.toFixed(2)} (Stock auto-decremented)`,
        timestamp: "Just now",
        linkPage: "orders",
      });
    }

    // Auto-save Booking if complete
    if (aiResult.booking && aiResult.booking.isComplete) {
      const bookingId = "BK-" + Math.floor(300 + Math.random() * 700);
      const newBooking: Booking = {
        id: bookingId,
        customerName: aiResult.booking.customerName || convName,
        phone: aiResult.booking.phone || convPhone,
        service: aiResult.booking.service || "Table Reservation",
        date: aiResult.booking.date || "Tomorrow",
        time: aiResult.booking.time || "7:00 PM",
        guests: aiResult.booking.guests || 2,
        status: "Confirmed",
        createdAt: new Date().toISOString(),
        notes: "Booked in Simulator",
      };

      saveBooking(newBooking);

      addActivity({
        id: "act-" + Date.now(),
        type: "booking",
        title: "Simulator Booking Captured",
        description: `${newBooking.customerName} booked ${newBooking.service}`,
        timestamp: "Just now",
        linkPage: "bookings",
      });
    }

    return res.json(aiResult);
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// Webhook Simulator Endpoint: lets user test incoming Meta webhook from the UI
app.post("/api/test/webhook-simulate", async (req, res) => {
  const { customerPhone, customerName, text } = req.body;
  const mockMsg = {
    from: customerPhone || "15552348899",
    id: "wamid.simulated." + Date.now(),
    type: "text",
    text: { body: text || "Hello! Do you have strawberry cake?" },
  };
  const mockContacts = [
    {
      wa_id: customerPhone || "15552348899",
      profile: { name: customerName || "Simulated Customer" },
    },
  ];

  await handleIncomingWhatsAppMessage(mockMsg, mockContacts);
  res.json({
    success: true,
    conversations: getConversations(),
    orders: getOrders(),
    bookings: getBookings(),
    products: getProducts(),
  });
});

// Reset Data endpoint
app.post("/api/reset", (_req, res) => {
  resetAllData();
  res.json({ success: true });
});

// -------------------------------------------------------------
// 4. Vite Dev Server / Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ChatBuddy WhatsApp Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

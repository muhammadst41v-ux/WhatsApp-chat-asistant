import crypto from "node:crypto";

const WHATSAPP_API_VERSION = "v21.0";

export interface WhatsAppConfig {
  token?: string;
  phoneNumberId?: string;
  verifyToken?: string;
  appSecret?: string;
  ownerPhone?: string;
}

export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    token: process.env.WHATSAPP_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "chatbuddy_secure_verify_token_2026",
    appSecret: process.env.WHATSAPP_APP_SECRET || "",
    ownerPhone: process.env.OWNER_PHONE || "",
  };
}

export function isWhatsAppConfigured(): boolean {
  const cfg = getWhatsAppConfig();
  return Boolean(cfg.token && cfg.phoneNumberId);
}

/**
 * Send a WhatsApp text message to a customer or business owner
 */
export async function sendWhatsAppTextMessage(
  toPhone: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cfg = getWhatsAppConfig();

  if (!cfg.token || !cfg.phoneNumberId) {
    console.log(
      `[WhatsApp Cloud API - Demo Mode Simulated Send] To: ${toPhone} | Message: ${text.slice(0, 80)}...`
    );
    return { success: true, messageId: "simulated-" + Date.now() };
  }

  // Format recipient phone: numbers only
  const cleanPhone = toPhone.replace(/\D/g, "");

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${cfg.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp Cloud API Error]:", data);
      return {
        success: false,
        error: data.error?.message || `HTTP ${res.status}`,
      };
    }

    const messageId = data.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err: any) {
    console.error("[WhatsApp Send Exception]:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Mark an incoming WhatsApp message as read
 */
export async function markWhatsAppMessageAsRead(messageId: string): Promise<boolean> {
  const cfg = getWhatsAppConfig();
  if (!cfg.token || !cfg.phoneNumberId || !messageId) return false;

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${cfg.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Could not mark message as read:", err);
    return false;
  }
}

/**
 * Verify Meta's X-Hub-Signature-256 header using the app secret
 */
export function verifyMetaSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  appSecret: string | undefined
): boolean {
  if (!appSecret) {
    // If no app secret is configured, allow in dev/demo mode
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  const providedHash = signatureHeader.replace("sha256=", "");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(providedHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Send an instant WhatsApp notification to the owner for new orders, bookings, or urgent inquiries
 */
export async function notifyOwnerOnWhatsApp(
  title: string,
  details: string
): Promise<void> {
  const cfg = getWhatsAppConfig();
  if (!cfg.ownerPhone) return;

  const alertText = `🔔 *ChatBuddy Alert: ${title}*\n\n${details}\n\n_Sent automatically by your WhatsApp Assistant._`;
  await sendWhatsAppTextMessage(cfg.ownerPhone, alertText);
}

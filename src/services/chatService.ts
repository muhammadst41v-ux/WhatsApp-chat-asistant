import {
  ChatMessage,
  BusinessInfo,
  Product,
  FAQ,
  AssistantSettings,
  AIResponsePayload,
} from "../types.ts";

export async function sendChatMessage(
  messages: ChatMessage[],
  businessInfo: BusinessInfo,
  products: Product[],
  faqs: FAQ[],
  settings: AssistantSettings
): Promise<AIResponsePayload> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
        })),
        businessInfo,
        products,
        faqs,
        settings,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      if (errData?.fallback) {
        return errData.fallback;
      }
      throw new Error(`Server returned ${response.status}`);
    }

    const data: AIResponsePayload = await response.json();
    return data;
  } catch (error) {
    console.error("sendChatMessage fetch error:", error);

    // Fallback response so user experience is uninterrupted
    return {
      reply: `Thank you for your message! 🙏 I'm currently checking with our store counter. You can ask me about our fresh products, stock availability, placing an order, or booking a table at ${businessInfo.name}! 🍰`,
      intent: "other",
      order: null,
      booking: null,
      urgency: "low",
      summary: "Customer sent inquiry (offline fallback)",
    };
  }
}

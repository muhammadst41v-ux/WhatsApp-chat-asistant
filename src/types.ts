export type PageType =
  | "chat"
  | "dashboard"
  | "products"
  | "orders"
  | "bookings"
  | "conversations"
  | "settings";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  inStock: boolean;
  emoji?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface BusinessInfo {
  name: string;
  tagline: string;
  hours: string;
  deliveryCharges: number;
  freeDeliveryAbove: number;
  paymentMethods: string[];
  location: string;
  phone: string;
  currency: string;
}

export interface AssistantSettings {
  assistantName: string;
  greeting: string;
  tone: "friendly" | "professional" | "casual" | "direct";
  language: "auto" | "english" | "urdu" | "hindi" | "roman_urdu";
  ownerPhone: string;
  active: boolean;
}

export interface OrderItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: "New" | "Confirmed" | "Delivered" | "Cancelled";
  createdAt: string;
  notes?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  guests?: number;
  status: "Pending" | "Confirmed" | "Cancelled";
  createdAt: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "owner" | "system";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  isSystemNote?: boolean;
  intent?: "faq" | "stock_check" | "order" | "booking" | "delivery_info" | "other";
  orderData?: any;
  bookingData?: any;
  summary?: string;
  messageType?: "text" | "image" | "audio" | "document" | "system";
}

export interface Conversation {
  id: string;
  customerPhone: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  humanTakeover: boolean;
  unreadCount: number;
  source: "whatsapp" | "simulator";
  messages: ChatMessage[];
}

export interface SystemStatus {
  geminiConnected: boolean;
  geminiModel: string;
  whatsappConnected: boolean;
  whatsappPhoneNumberId: string | null;
  whatsappVerifyTokenSet: boolean;
  whatsappAppSecretSet: boolean;
  ownerPhone: string | null;
  isDemoMode: boolean;
  totalMessages: number;
  activeConversations: number;
  webhookUrl: string;
}

export interface AIResponsePayload {
  reply: string;
  intent: "faq" | "stock_check" | "order" | "booking" | "delivery_info" | "other";
  order: {
    isComplete: boolean;
    customerName?: string;
    phone?: string;
    address?: string;
    items?: OrderItem[];
    subtotal?: number;
    deliveryFee?: number;
    total?: number;
    notes?: string;
  } | null;
  booking: {
    isComplete: boolean;
    customerName?: string;
    phone?: string;
    service?: string;
    date?: string;
    time?: string;
    guests?: number;
    notes?: string;
  } | null;
  urgency: "low" | "medium" | "high";
  summary: string;
}

export interface ActivityLog {
  id: string;
  type: "order" | "booking" | "chat" | "stock" | "whatsapp" | "takeover";
  title: string;
  description: string;
  timestamp: string;
  linkPage?: PageType;
}

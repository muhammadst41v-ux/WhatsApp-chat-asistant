import {
  Product,
  FAQ,
  BusinessInfo,
  AssistantSettings,
  Order,
  Booking,
  ChatMessage,
  ActivityLog,
} from "../types.ts";

const STORAGE_KEYS = {
  PRODUCTS: "chatbuddy_products_v1",
  FAQS: "chatbuddy_faqs_v1",
  BUSINESS_INFO: "chatbuddy_business_info_v1",
  SETTINGS: "chatbuddy_settings_v1",
  ORDERS: "chatbuddy_orders_v1",
  BOOKINGS: "chatbuddy_bookings_v1",
  CHAT_MESSAGES: "chatbuddy_chat_messages_v1",
  ACTIVITIES: "chatbuddy_activities_v1",
};

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: "Artisan Bakes & Café",
  tagline: "Handcrafted cakes, fresh sourdough & specialty roasts",
  hours: "Mon - Sun: 8:00 AM - 9:30 PM",
  deliveryCharges: 4.5,
  freeDeliveryAbove: 35.0,
  paymentMethods: [
    "Cash on Delivery",
    "Credit / Debit Card",
    "Bank Transfer / Zelle / UPI",
  ],
  location: "48 Maple Street, Downtown Arts District",
  phone: "+1 (555) 392-1084",
  currency: "$",
};

export const DEFAULT_SETTINGS: AssistantSettings = {
  assistantName: "Buddy",
  greeting:
    "Hi there! 👋 Welcome to Artisan Bakes & Café. How can I sweeten your day? Let me know if you want to check our menu, check product stock, place an order, or reserve a table! 🍰",
  tone: "friendly",
  language: "auto",
  ownerPhone: "+1 (555) 392-1084",
  active: true,
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Velvet Strawberry Cake (1kg)",
    category: "Cakes",
    price: 28.0,
    stock: 7,
    description: "Layers of moist vanilla sponge with fresh strawberry compote & rich Chantilly cream.",
    inStock: true,
    emoji: "🍓",
  },
  {
    id: "prod-2",
    name: "Double Chocolate Fudge Brownie",
    category: "Pastries",
    price: 4.5,
    stock: 22,
    description: "Decadent Belgian 70% dark chocolate brownie with crackly crust and gooey core.",
    inStock: true,
    emoji: "🍫",
  },
  {
    id: "prod-3",
    name: "Artisan Sourdough Loaf",
    category: "Bakery",
    price: 6.0,
    stock: 14,
    description: "48-hour fermented country sourdough with crispy blistered crust and chewy crumb.",
    inStock: true,
    emoji: "🍞",
  },
  {
    id: "prod-4",
    name: "Iced Caramel Macchiato",
    category: "Beverages",
    price: 5.5,
    stock: 35,
    description: "Freshly pulled double espresso over oat or dairy milk with artisanal caramel drizzle.",
    inStock: true,
    emoji: "☕",
  },
  {
    id: "prod-5",
    name: "Gluten-Free Almond Croissant",
    category: "Pastries",
    price: 5.0,
    stock: 0,
    description: "Twice-baked butter croissant loaded with rich almond paste and toasted flakes.",
    inStock: false,
    emoji: "🥐",
  },
  {
    id: "prod-6",
    name: "Signature Bento Lunch Box",
    category: "Meals",
    price: 14.0,
    stock: 12,
    description: "Smoked chicken or roasted halloumi croissant sandwich, side garden salad, and brownie slice.",
    inStock: true,
    emoji: "🍱",
  },
];

export const DEFAULT_FAQS: FAQ[] = [
  {
    id: "faq-1",
    question: "Do you deliver to my area?",
    answer: "Yes! We offer doorstep delivery across the city within a 15km radius. Orders arrive fresh in insulated thermal boxes within 35-50 minutes.",
    category: "Delivery",
  },
  {
    id: "faq-2",
    question: "What are your delivery charges?",
    answer: "Standard delivery is $4.50, but delivery is 100% FREE on all orders of $35 or more! 🎉",
    category: "Delivery",
  },
  {
    id: "faq-3",
    question: "Can I customize a cake with a personalized message?",
    answer: "Yes, absolutely! We can write any custom message up to 30 characters on our 1kg cakes at no extra charge. Just mention the text during ordering.",
    category: "Custom Orders",
  },
  {
    id: "faq-4",
    question: "Are your items halal and vegetarian friendly?",
    answer: "Yes! All our bakery items and beverages are 100% Halal certified, and we have multiple vegetarian options clearly marked.",
    category: "Dietary",
  },
  {
    id: "faq-5",
    question: "What payment methods are accepted?",
    answer: "We accept Cash on Delivery (COD), Credit/Debit Cards upon delivery, and instant online Bank Transfer / Zelle / JazzCash.",
    category: "Payment",
  },
];

export const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD-1042",
    customerName: "Sarah Jenkins",
    phone: "+1 (555) 234-8899",
    address: "48 Oak Avenue, Apt 3B, Downtown",
    items: [
      {
        productId: "prod-1",
        productName: "Velvet Strawberry Cake (1kg)",
        quantity: 1,
        unitPrice: 28.0,
        lineTotal: 28.0,
      },
      {
        productId: "prod-4",
        productName: "Iced Caramel Macchiato",
        quantity: 2,
        unitPrice: 5.5,
        lineTotal: 11.0,
      },
    ],
    subtotal: 39.0,
    deliveryFee: 0.0, // Free delivery because > $35
    total: 39.0,
    status: "Confirmed",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    notes: "Please write 'Happy Birthday Liam!' on the cake box.",
  },
  {
    id: "ORD-1041",
    customerName: "Marcus Vance",
    phone: "+1 (555) 441-9921",
    address: "12 Elm Street, Suite 402",
    items: [
      {
        productId: "prod-3",
        productName: "Artisan Sourdough Loaf",
        quantity: 2,
        unitPrice: 6.0,
        lineTotal: 12.0,
      },
      {
        productId: "prod-2",
        productName: "Double Chocolate Fudge Brownie",
        quantity: 3,
        unitPrice: 4.5,
        lineTotal: 13.5,
      },
    ],
    subtotal: 25.5,
    deliveryFee: 4.5,
    total: 30.0,
    status: "New",
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    notes: "Leave at front door ring bell.",
  },
  {
    id: "ORD-1039",
    customerName: "Emily Rodriguez",
    phone: "+1 (555) 872-3312",
    address: "301 Pine Ridge Rd, North Hill",
    items: [
      {
        productId: "prod-6",
        productName: "Signature Bento Lunch Box",
        quantity: 3,
        unitPrice: 14.0,
        lineTotal: 42.0,
      },
    ],
    subtotal: 42.0,
    deliveryFee: 0.0,
    total: 42.0,
    status: "Delivered",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    notes: "Call when 5 mins away.",
  },
];

export const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: "BK-302",
    customerName: "David Chen",
    phone: "+1 (555) 782-9920",
    service: "Afternoon High Tea Table for 4",
    date: "Tomorrow",
    time: "3:30 PM",
    guests: 4,
    status: "Confirmed",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    notes: "Window table requested if available.",
  },
  {
    id: "BK-301",
    customerName: "Fatima Noor",
    phone: "+1 (555) 612-4091",
    service: "Custom Wedding Cake Tasting & Consultation",
    date: "This Friday",
    time: "5:00 PM",
    guests: 2,
    status: "Pending",
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    notes: "Looking for 3-tier rustic floral design.",
  },
];

export const DEFAULT_ACTIVITIES: ActivityLog[] = [
  {
    id: "act-1",
    type: "order",
    title: "New Order Placed",
    description: "Sarah Jenkins ordered Velvet Strawberry Cake + 2 Iced Macchiatos ($39.00)",
    timestamp: "45 mins ago",
    linkPage: "orders",
  },
  {
    id: "act-2",
    type: "booking",
    title: "Table Booking Confirmed",
    description: "David Chen confirmed Afternoon High Tea for 4 guests",
    timestamp: "35 mins ago",
    linkPage: "bookings",
  },
  {
    id: "act-3",
    type: "chat",
    title: "Question Answered",
    description: "Customer asked about delivery charges & free delivery rule",
    timestamp: "1 hour ago",
    linkPage: "chat",
  },
  {
    id: "act-4",
    type: "stock",
    title: "Stock Alert",
    description: "Gluten-Free Almond Croissant reached 0 units",
    timestamp: "2 hours ago",
    linkPage: "products",
  },
];

export const DEFAULT_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "init-1",
    sender: "assistant",
    text: DEFAULT_SETTINGS.greeting,
    timestamp: "10:30 AM",
    status: "read",
  },
];

// Helper functions for reading & writing localStorage
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export const StorageService = {
  getProducts: (): Product[] => loadFromStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS),
  saveProducts: (products: Product[]) => saveToStorage(STORAGE_KEYS.PRODUCTS, products),

  getFAQs: (): FAQ[] => loadFromStorage(STORAGE_KEYS.FAQS, DEFAULT_FAQS),
  saveFAQs: (faqs: FAQ[]) => saveToStorage(STORAGE_KEYS.FAQS, faqs),

  getBusinessInfo: (): BusinessInfo =>
    loadFromStorage(STORAGE_KEYS.BUSINESS_INFO, DEFAULT_BUSINESS_INFO),
  saveBusinessInfo: (info: BusinessInfo) => saveToStorage(STORAGE_KEYS.BUSINESS_INFO, info),

  getSettings: (): AssistantSettings =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  saveSettings: (settings: AssistantSettings) => saveToStorage(STORAGE_KEYS.SETTINGS, settings),

  getOrders: (): Order[] => loadFromStorage(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS),
  saveOrders: (orders: Order[]) => saveToStorage(STORAGE_KEYS.ORDERS, orders),

  getBookings: (): Booking[] => loadFromStorage(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS),
  saveBookings: (bookings: Booking[]) => saveToStorage(STORAGE_KEYS.BOOKINGS, bookings),

  getChatMessages: (): ChatMessage[] =>
    loadFromStorage(STORAGE_KEYS.CHAT_MESSAGES, DEFAULT_INITIAL_MESSAGES),
  saveChatMessages: (messages: ChatMessage[]) =>
    saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, messages),

  getActivities: (): ActivityLog[] =>
    loadFromStorage(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES),
  saveActivities: (activities: ActivityLog[]) =>
    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities),

  resetAllToDefaults: () => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(DEFAULT_FAQS));
    localStorage.setItem(STORAGE_KEYS.BUSINESS_INFO, JSON.stringify(DEFAULT_BUSINESS_INFO));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(DEFAULT_INITIAL_MESSAGES));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
  },
};

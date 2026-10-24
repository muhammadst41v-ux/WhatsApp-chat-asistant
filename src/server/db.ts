import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import {
  Product,
  FAQ,
  BusinessInfo,
  AssistantSettings,
  Order,
  Booking,
  ChatMessage,
  ActivityLog,
  Conversation,
} from "../types.ts";

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "chatbuddy.sqlite");
const db = new DatabaseSync(DB_PATH);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      description TEXT,
      in_stock INTEGER NOT NULL,
      emoji TEXT
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      items_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      service TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      customer_phone TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      last_message TEXT,
      last_message_at TEXT,
      human_takeover INTEGER DEFAULT 0,
      unread_count INTEGER DEFAULT 0,
      source TEXT DEFAULT 'whatsapp'
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      wa_message_id TEXT,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'read',
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      link_page TEXT
    );
  `);

  seedDefaultsIfEmpty();
}

// Default Seed Data
const DEFAULT_BUSINESS_INFO: BusinessInfo = {
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

const DEFAULT_SETTINGS: AssistantSettings = {
  assistantName: "Buddy",
  greeting:
    "Hi there! 👋 Welcome to Artisan Bakes & Café. How can I sweeten your day? Let me know if you want to check our menu, check product stock, place an order, or reserve a table! 🍰",
  tone: "friendly",
  language: "auto",
  ownerPhone: "+1 (555) 392-1084",
  active: true,
};

const INITIAL_PRODUCTS: Product[] = [
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
    description: "Smoked chicken or roasted halloumi croissant sandwich, side salad, and brownie slice.",
    inStock: true,
    emoji: "🍱",
  },
];

const INITIAL_FAQS: FAQ[] = [
  {
    id: "faq-1",
    question: "Do you deliver to my area?",
    answer: "Yes! We offer doorstep delivery across the city within a 15km radius. Orders arrive fresh in insulated boxes within 35-50 minutes.",
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
    answer: "We accept Cash on Delivery (COD), Credit/Debit Cards upon delivery, and instant online Bank Transfer / Zelle.",
    category: "Payment",
  },
];

function seedDefaultsIfEmpty() {
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM products");
  const result: any = countStmt.get();
  if (result.count === 0) {
    // Seed KV store
    setKV("business_info", DEFAULT_BUSINESS_INFO);
    setKV("settings", DEFAULT_SETTINGS);

    // Seed Products
    const insertProd = db.prepare(`
      INSERT INTO products (id, name, category, price, stock, description, in_stock, emoji)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of INITIAL_PRODUCTS) {
      insertProd.run(p.id, p.name, p.category, p.price, p.stock, p.description, p.inStock ? 1 : 0, p.emoji || "📦");
    }

    // Seed FAQs
    const insertFaq = db.prepare(`
      INSERT INTO faqs (id, question, answer, category)
      VALUES (?, ?, ?, ?)
    `);
    for (const f of INITIAL_FAQS) {
      insertFaq.run(f.id, f.question, f.answer, f.category || "General");
    }

    // Seed initial demo orders
    saveOrder({
      id: "ORD-1042",
      customerName: "Sarah Jenkins",
      phone: "+1 (555) 234-8899",
      address: "48 Oak Avenue, Apt 3B, Downtown",
      items: [
        { productId: "prod-1", productName: "Velvet Strawberry Cake (1kg)", quantity: 1, unitPrice: 28.0, lineTotal: 28.0 },
        { productId: "prod-4", productName: "Iced Caramel Macchiato", quantity: 2, unitPrice: 5.5, lineTotal: 11.0 },
      ],
      subtotal: 39.0,
      deliveryFee: 0.0,
      total: 39.0,
      status: "Confirmed",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      notes: "Please write 'Happy Birthday Liam!' on box.",
    });

    saveOrder({
      id: "ORD-1041",
      customerName: "Marcus Vance",
      phone: "+1 (555) 441-9921",
      address: "12 Elm Street, Suite 402",
      items: [
        { productId: "prod-3", productName: "Artisan Sourdough Loaf", quantity: 2, unitPrice: 6.0, lineTotal: 12.0 },
      ],
      subtotal: 12.0,
      deliveryFee: 4.5,
      total: 16.5,
      status: "New",
      createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      notes: "Leave at front desk.",
    });

    // Seed initial demo bookings
    saveBooking({
      id: "BK-302",
      customerName: "David Chen",
      phone: "+1 (555) 782-9920",
      service: "Afternoon High Tea Table for 4",
      date: "Tomorrow",
      time: "3:30 PM",
      guests: 4,
      status: "Confirmed",
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      notes: "Window booth requested.",
    });

    // Seed demo conversation
    const convId = "conv-sarah-1";
    saveConversation({
      id: convId,
      customerPhone: "+1 (555) 234-8899",
      customerName: "Sarah Jenkins",
      lastMessage: "Order confirmed: 1x Velvet Strawberry Cake",
      lastMessageAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      humanTakeover: false,
      unreadCount: 0,
      source: "whatsapp",
      messages: [],
    });

    saveMessage(convId, {
      id: "msg-1",
      sender: "user",
      text: "Hi! Do you have the Velvet Strawberry Cake in stock today?",
      timestamp: "10:30 AM",
      status: "read",
    });

    saveMessage(convId, {
      id: "msg-2",
      sender: "assistant",
      text: "Yes! *Velvet Strawberry Cake (1kg)* is in stock! ✅ (7 available). Would you like to order for delivery?",
      timestamp: "10:31 AM",
      status: "read",
    });

    // Seed demo activities
    addActivity({
      id: "act-1",
      type: "whatsapp",
      title: "WhatsApp Connected",
      description: "ChatBuddy initialized with live SQLite database",
      timestamp: "Just now",
      linkPage: "dashboard",
    });
  }
}

// KV Store Helpers
export function getKV<T>(key: string, defaultValue: T): T {
  try {
    const stmt = db.prepare("SELECT value FROM kv_store WHERE key = ?");
    const row: any = stmt.get(key);
    if (!row) return defaultValue;
    return JSON.parse(row.value);
  } catch (e) {
    console.error(`getKV error for ${key}:`, e);
    return defaultValue;
  }
}

export function setKV<T>(key: string, value: T): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO kv_store (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, JSON.stringify(value));
  } catch (e) {
    console.error(`setKV error for ${key}:`, e);
  }
}

// Products CRUD
export function getProducts(): Product[] {
  const stmt = db.prepare("SELECT * FROM products ORDER BY category ASC, name ASC");
  const rows: any[] = stmt.all();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    price: Number(r.price),
    stock: Number(r.stock),
    description: r.description || "",
    inStock: Boolean(r.in_stock),
    emoji: r.emoji || "📦",
  }));
}

export function saveProduct(p: Product): void {
  const stmt = db.prepare(`
    INSERT INTO products (id, name, category, price, stock, description, in_stock, emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      price = excluded.price,
      stock = excluded.stock,
      description = excluded.description,
      in_stock = excluded.in_stock,
      emoji = excluded.emoji
  `);
  stmt.run(p.id, p.name, p.category, p.price, p.stock, p.description, p.stock > 0 && p.inStock ? 1 : 0, p.emoji || "📦");
}

export function deleteProduct(id: string): void {
  const stmt = db.prepare("DELETE FROM products WHERE id = ?");
  stmt.run(id);
}

export function decrementProductStock(productIdentifier: string, quantityToDeduct: number): { success: boolean; updatedStock?: number } {
  const lower = productIdentifier.toLowerCase().trim();
  const products = getProducts();
  const matched = products.find((p) => {
    return p.id === productIdentifier || p.name.toLowerCase() === lower || p.name.toLowerCase().includes(lower);
  });

  if (!matched) return { success: false };

  const newStock = Math.max(0, matched.stock - quantityToDeduct);
  const stmt = db.prepare("UPDATE products SET stock = ?, in_stock = ? WHERE id = ?");
  stmt.run(newStock, newStock > 0 ? 1 : 0, matched.id);

  return { success: true, updatedStock: newStock };
}

// FAQs CRUD
export function getFAQs(): FAQ[] {
  const stmt = db.prepare("SELECT * FROM faqs ORDER BY category ASC");
  const rows: any[] = stmt.all();
  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    answer: r.answer,
    category: r.category || "General",
  }));
}

export function saveFAQ(f: FAQ): void {
  const stmt = db.prepare(`
    INSERT INTO faqs (id, question, answer, category)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      question = excluded.question,
      answer = excluded.answer,
      category = excluded.category
  `);
  stmt.run(f.id, f.question, f.answer, f.category || "General");
}

export function deleteFAQ(id: string): void {
  const stmt = db.prepare("DELETE FROM faqs WHERE id = ?");
  stmt.run(id);
}

// Orders
export function getOrders(): Order[] {
  const stmt = db.prepare("SELECT * FROM orders ORDER BY created_at DESC");
  const rows: any[] = stmt.all();
  return rows.map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone,
    address: r.address,
    items: JSON.parse(r.items_json || "[]"),
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    total: Number(r.total),
    status: r.status as Order["status"],
    createdAt: r.created_at,
    notes: r.notes || "",
  }));
}

export function saveOrder(order: Order): void {
  const stmt = db.prepare(`
    INSERT INTO orders (id, customer_name, phone, address, items_json, subtotal, delivery_fee, total, status, created_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      phone = excluded.phone,
      address = excluded.address,
      items_json = excluded.items_json,
      subtotal = excluded.subtotal,
      delivery_fee = excluded.delivery_fee,
      total = excluded.total,
      status = excluded.status,
      notes = excluded.notes
  `);
  stmt.run(
    order.id,
    order.customerName,
    order.phone,
    order.address,
    JSON.stringify(order.items),
    order.subtotal,
    order.deliveryFee,
    order.total,
    order.status,
    order.createdAt,
    order.notes || ""
  );
}

export function updateOrderStatus(id: string, status: Order["status"]): void {
  const stmt = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
  stmt.run(status, id);
}

// Bookings
export function getBookings(): Booking[] {
  const stmt = db.prepare("SELECT * FROM bookings ORDER BY created_at DESC");
  const rows: any[] = stmt.all();
  return rows.map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone,
    service: r.service,
    date: r.date,
    time: r.time,
    guests: Number(r.guests),
    status: r.status as Booking["status"],
    createdAt: r.created_at,
    notes: r.notes || "",
  }));
}

export function saveBooking(booking: Booking): void {
  const stmt = db.prepare(`
    INSERT INTO bookings (id, customer_name, phone, service, date, time, guests, status, created_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      phone = excluded.phone,
      service = excluded.service,
      date = excluded.date,
      time = excluded.time,
      guests = excluded.guests,
      status = excluded.status,
      notes = excluded.notes
  `);
  stmt.run(
    booking.id,
    booking.customerName,
    booking.phone,
    booking.service,
    booking.date,
    booking.time,
    booking.guests || 2,
    booking.status,
    booking.createdAt,
    booking.notes || ""
  );
}

export function updateBookingStatus(id: string, status: Booking["status"]): void {
  const stmt = db.prepare("UPDATE bookings SET status = ? WHERE id = ?");
  stmt.run(status, id);
}

// Conversations & Messages
export function getConversations(): Conversation[] {
  const stmt = db.prepare("SELECT * FROM conversations ORDER BY last_message_at DESC");
  const rows: any[] = stmt.all();
  return rows.map((r) => {
    const msgStmt = db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC");
    const msgRows: any[] = msgStmt.all(r.id);
    return {
      id: r.id,
      customerPhone: r.customer_phone,
      customerName: r.customer_name,
      lastMessage: r.last_message || "",
      lastMessageAt: r.last_message_at || "",
      humanTakeover: Boolean(r.human_takeover),
      unreadCount: Number(r.unread_count || 0),
      source: (r.source as any) || "whatsapp",
      messages: msgRows.map((m) => ({
        id: m.id,
        sender: m.sender as any,
        text: m.text,
        timestamp: m.timestamp,
        status: m.status as any,
        messageType: m.message_type as any,
      })),
    };
  });
}

export function getOrCreateConversation(customerPhone: string, customerName?: string, source: "whatsapp" | "simulator" = "whatsapp"): Conversation {
  const findStmt = db.prepare("SELECT * FROM conversations WHERE customer_phone = ?");
  let row: any = findStmt.get(customerPhone);

  if (!row) {
    const id = "conv-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const name = customerName || "Customer (" + customerPhone.slice(-4) + ")";
    const insertStmt = db.prepare(`
      INSERT INTO conversations (id, customer_phone, customer_name, last_message, last_message_at, human_takeover, unread_count, source)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?)
    `);
    const now = new Date().toISOString();
    insertStmt.run(id, customerPhone, name, "", now, source);
    row = { id, customer_phone: customerPhone, customer_name: name, last_message: "", last_message_at: now, human_takeover: 0, unread_count: 0, source };
  }

  const msgStmt = db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC");
  const msgRows: any[] = msgStmt.all(row.id);

  return {
    id: row.id,
    customerPhone: row.customer_phone,
    customerName: row.customer_name,
    lastMessage: row.last_message || "",
    lastMessageAt: row.last_message_at || "",
    humanTakeover: Boolean(row.human_takeover),
    unreadCount: Number(row.unread_count || 0),
    source: row.source || "whatsapp",
    messages: msgRows.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
      status: m.status,
      messageType: m.message_type,
    })),
  };
}

export function saveConversation(conv: Conversation): void {
  const stmt = db.prepare(`
    INSERT INTO conversations (id, customer_phone, customer_name, last_message, last_message_at, human_takeover, unread_count, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      last_message = excluded.last_message,
      last_message_at = excluded.last_message_at,
      human_takeover = excluded.human_takeover,
      unread_count = excluded.unread_count
  `);
  stmt.run(
    conv.id,
    conv.customerPhone,
    conv.customerName,
    conv.lastMessage,
    conv.lastMessageAt,
    conv.humanTakeover ? 1 : 0,
    conv.unreadCount,
    conv.source
  );
}

export function setConversationTakeover(conversationId: string, takeover: boolean): void {
  const stmt = db.prepare("UPDATE conversations SET human_takeover = ? WHERE id = ?");
  stmt.run(takeover ? 1 : 0, conversationId);
}

export function saveMessage(conversationId: string, message: ChatMessage): void {
  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, sender, text, message_type, timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);
  stmt.run(
    message.id,
    conversationId,
    message.sender,
    message.text,
    message.messageType || "text",
    message.timestamp,
    message.status || "read"
  );

  // Update conversation last_message
  const updateConv = db.prepare(`
    UPDATE conversations
    SET last_message = ?, last_message_at = ?
    WHERE id = ?
  `);
  updateConv.run(message.text, new Date().toISOString(), conversationId);
}

export function getLastNMessages(conversationId: string, count: number = 20): ChatMessage[] {
  const stmt = db.prepare(`
    SELECT * FROM (
      SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT ?
    ) ORDER BY timestamp ASC
  `);
  const rows: any[] = stmt.all(conversationId, count);
  return rows.map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    timestamp: m.timestamp,
    status: m.status,
    messageType: m.message_type,
  }));
}

// Activities
export function getActivities(): ActivityLog[] {
  const stmt = db.prepare("SELECT * FROM activities ORDER BY id DESC LIMIT 30");
  const rows: any[] = stmt.all();
  return rows.map((r) => ({
    id: r.id,
    type: r.type as any,
    title: r.title,
    description: r.description,
    timestamp: r.timestamp,
    linkPage: r.link_page as any,
  }));
}

export function addActivity(act: ActivityLog): void {
  const stmt = db.prepare(`
    INSERT INTO activities (id, type, title, description, timestamp, link_page)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(act.id, act.type, act.title, act.description, act.timestamp, act.linkPage || null);
}

export function resetAllData(): void {
  db.exec(`
    DELETE FROM products;
    DELETE FROM faqs;
    DELETE FROM orders;
    DELETE FROM bookings;
    DELETE FROM messages;
    DELETE FROM conversations;
    DELETE FROM activities;
    DELETE FROM kv_store;
  `);
  seedDefaultsIfEmpty();
}

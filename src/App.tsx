/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  PageType,
  Product,
  FAQ,
  BusinessInfo,
  AssistantSettings,
  Order,
  Booking,
  ChatMessage,
  ActivityLog,
  Conversation,
  SystemStatus,
} from "./types.ts";
import { StorageService } from "./utils/storage.ts";
import { Sidebar } from "./components/Sidebar.tsx";
import { TestChat } from "./components/TestChat.tsx";
import { Dashboard } from "./components/Dashboard.tsx";
import { ProductsFAQs } from "./components/ProductsFAQs.tsx";
import { Orders } from "./components/Orders.tsx";
import { Bookings } from "./components/Bookings.tsx";
import { Conversations } from "./components/Conversations.tsx";
import { Settings } from "./components/Settings.tsx";
import { Menu, X, MessageSquare, Zap, Radio } from "lucide-react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("chat");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core application states
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [faqs, setFaqs] = useState<FAQ[]>(() => StorageService.getFAQs());
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => StorageService.getBusinessInfo());
  const [settings, setSettings] = useState<AssistantSettings>(() => StorageService.getSettings());
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());
  const [bookings, setBookings] = useState<Booking[]>(() => StorageService.getBookings());
  const [messages, setMessages] = useState<ChatMessage[]>(() => StorageService.getChatMessages());
  const [activities, setActivities] = useState<ActivityLog[]>(() => StorageService.getActivities());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Sync with backend SQLite
  const loadBackendData = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) setProducts(data.products);
        if (data.faqs && data.faqs.length > 0) setFaqs(data.faqs);
        if (data.businessInfo && data.businessInfo.name) setBusinessInfo(data.businessInfo);
        if (data.settings && data.settings.assistantName) setSettings(data.settings);
        if (data.orders) setOrders(data.orders);
        if (data.bookings) setBookings(data.bookings);
        if (data.conversations) setConversations(data.conversations);
        if (data.activities && data.activities.length > 0) setActivities(data.activities);
      }
    } catch (err) {
      console.warn("Backend /api/data initial load fallback to local:", err);
    }

    try {
      const statusRes = await fetch("/api/status");
      if (statusRes.ok) {
        const s = await statusRes.json();
        setSystemStatus(s);
      }
    } catch {
      // offline status
    }
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Sync states to localStorage
  useEffect(() => {
    StorageService.saveProducts(products);
  }, [products]);

  useEffect(() => {
    StorageService.saveFAQs(faqs);
  }, [faqs]);

  useEffect(() => {
    StorageService.saveBusinessInfo(businessInfo);
  }, [businessInfo]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    StorageService.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    StorageService.saveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    StorageService.saveChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    StorageService.saveActivities(activities);
  }, [activities]);

  const handleAddActivity = (newAct: ActivityLog) => {
    setActivities((prev) => [newAct, ...prev.slice(0, 25)]);
  };

  const handleToggleActive = async () => {
    const newSettings = { ...settings, active: !settings.active };
    setSettings(newSettings);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (e) {
      console.warn("Could not save settings:", e);
    }
  };

  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    const current = products.find((p) => p.id === productId);
    const delta = current ? newStock - current.stock : 0;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stock: newStock, inStock: newStock > 0 }
          : p
      )
    );

    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjustStock", id: productId, delta }),
      });
    } catch (e) {
      console.warn("Could not adjust stock on backend:", e);
    }
  };

  const handleToggleTakeover = async (conversationId: string, takeover: boolean) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, humanTakeover: takeover } : c
      )
    );

    try {
      const res = await fetch("/api/conversations/takeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, takeover }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversations) setConversations(data.conversations);
      }
    } catch (e) {
      console.warn("Could not toggle takeover:", e);
    }
  };

  const handleSendOwnerMessage = async (
    conversationId: string,
    text: string,
    customerPhone: string
  ) => {
    try {
      const res = await fetch("/api/conversations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text, customerPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversations) setConversations(data.conversations);
      }
    } catch (e) {
      console.warn("Could not send owner message:", e);
    }
  };

  const handleSimulateWebhook = async (
    customerPhone: string,
    customerName: string,
    text: string
  ) => {
    try {
      const res = await fetch("/api/test/webhook-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerPhone, customerName, text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversations) setConversations(data.conversations);
        if (data.orders) setOrders(data.orders);
        if (data.bookings) setBookings(data.bookings);
        if (data.products) setProducts(data.products);
      }
    } catch (e) {
      console.warn("Could not simulate webhook:", e);
    }
  };

  const handleResetDefaults = async () => {
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch {
      // ignore
    }
    StorageService.resetAllToDefaults();
    setProducts(StorageService.getProducts());
    setFaqs(StorageService.getFAQs());
    setBusinessInfo(StorageService.getBusinessInfo());
    setSettings(StorageService.getSettings());
    setOrders(StorageService.getOrders());
    setBookings(StorageService.getBookings());
    setMessages(StorageService.getChatMessages());
    setActivities(StorageService.getActivities());
    loadBackendData();
  };

  const handleTestPrompt = (promptText: string) => {
    setCurrentPage("chat");
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      {
        id: "msg-" + Date.now(),
        sender: "user",
        text: promptText,
        timestamp: time,
      },
    ]);
  };

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] overflow-hidden text-slate-800">
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#25D366] flex items-center justify-center text-white font-bold text-xs">
              <MessageSquare className="w-4 h-4 fill-white/20" />
            </div>
            <span className="font-bold text-slate-900 text-sm">ChatBuddy</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {systemStatus?.whatsappConnected ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp Live
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-2xs z-40"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 transform md:transform-none transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar
          currentPage={currentPage}
          onSelectPage={(page) => {
            setCurrentPage(page);
            setIsMobileMenuOpen(false);
          }}
          settings={settings}
          onToggleActive={handleToggleActive}
          orders={orders}
          bookings={bookings}
          productsCount={products.length}
          conversationsCount={conversations.length}
          businessName={businessInfo.name}
        />
      </div>

      {/* Main Page Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-14 md:pt-0">
        {currentPage === "chat" && (
          <TestChat
            messages={messages}
            setMessages={setMessages}
            businessInfo={businessInfo}
            products={products}
            faqs={faqs}
            settings={settings}
            orders={orders}
            setOrders={setOrders}
            bookings={bookings}
            setBookings={setBookings}
            onNavigatePage={setCurrentPage}
            onAddActivity={handleAddActivity}
          />
        )}

        {currentPage === "dashboard" && (
          <Dashboard
            orders={orders}
            bookings={bookings}
            products={products}
            faqs={faqs}
            messages={messages}
            settings={settings}
            businessInfo={businessInfo}
            activities={activities}
            onNavigatePage={setCurrentPage}
            onUpdateProductStock={handleUpdateProductStock}
            onToggleActive={handleToggleActive}
          />
        )}

        {currentPage === "products" && (
          <ProductsFAQs
            products={products}
            setProducts={setProducts}
            faqs={faqs}
            setFaqs={setFaqs}
            businessInfo={businessInfo}
            setBusinessInfo={setBusinessInfo}
            onNavigatePage={setCurrentPage}
            onTestPrompt={handleTestPrompt}
          />
        )}

        {currentPage === "orders" && (
          <Orders
            orders={orders}
            setOrders={setOrders}
            products={products}
            businessInfo={businessInfo}
          />
        )}

        {currentPage === "bookings" && (
          <Bookings
            bookings={bookings}
            setBookings={setBookings}
            businessInfo={businessInfo}
          />
        )}

        {currentPage === "conversations" && (
          <Conversations
            conversations={conversations}
            onToggleTakeover={handleToggleTakeover}
            onSendMessage={handleSendOwnerMessage}
            onRefreshData={loadBackendData}
            onSimulateWebhook={handleSimulateWebhook}
          />
        )}

        {currentPage === "settings" && (
          <Settings
            settings={settings}
            setSettings={setSettings}
            onResetDefaults={handleResetDefaults}
            businessInfo={businessInfo}
            onRefreshData={loadBackendData}
          />
        )}
      </main>
    </div>
  );
}

import React from "react";
import {
  MessageSquare,
  ShoppingBag,
  Calendar,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Package,
  Store,
  DollarSign,
  Plus,
} from "lucide-react";
import {
  PageType,
  Order,
  Booking,
  Product,
  FAQ,
  ChatMessage,
  AssistantSettings,
  ActivityLog,
  BusinessInfo,
} from "../types.ts";

interface DashboardProps {
  orders: Order[];
  bookings: Booking[];
  products: Product[];
  faqs: FAQ[];
  messages: ChatMessage[];
  settings: AssistantSettings;
  businessInfo: BusinessInfo;
  activities: ActivityLog[];
  onNavigatePage: (page: PageType) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onToggleActive: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  bookings,
  products,
  faqs,
  messages,
  settings,
  businessInfo,
  activities,
  onNavigatePage,
  onUpdateProductStock,
  onToggleActive,
}) => {
  // Compute Stats
  const totalChats = messages.filter((m) => m.sender === "user").length || 3;
  const ordersTaken = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "Cancelled" ? o.total : 0), 0);
  const bookingsCount = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === "Confirmed").length;
  const questionsAnswered = messages.filter((m) => m.sender === "assistant" && m.intent === "faq").length || faqs.length;

  const lowStockItems = products.filter((p) => p.stock <= 5);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-emerald-100 border border-white/20 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
            <span>AI WhatsApp Bot · gemini-2.5-flash</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {businessInfo.name || "Business"} Assistant
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1 leading-relaxed">
            Simulating live WhatsApp customer conversations. Handling product stock inquiries, 
            instant order confirmations, and reservation bookings around the clock.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigatePage("chat")}
            className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-900 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            Open Test Chat
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleActive}
            className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs border backdrop-blur-xs transition-all ${
              settings.active
                ? "bg-white/15 text-white border-white/30 hover:bg-white/25"
                : "bg-amber-500 text-slate-900 border-amber-400 hover:bg-amber-400"
            }`}
          >
            {settings.active ? "● Bot is Active" : "⏸ Bot is Paused"}
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-[#25D366]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chats Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chats Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {totalChats}
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Customer interactions simulated</p>
        </div>

        {/* Orders Taken */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Orders Taken
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {ordersTaken}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              (${totalRevenue.toFixed(2)})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {orders.filter((o) => o.status === "New").length} new awaiting delivery
          </p>
        </div>

        {/* Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bookings
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {bookingsCount}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {confirmedBookings} confirmed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tables & service reservations</p>
        </div>

        {/* Questions Answered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Questions Answered
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {questionsAnswered}
            </span>
            <span className="text-xs text-purple-600 font-semibold">
              100% automated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">From FAQs & store policies</p>
        </div>
      </div>

      {/* Middle Grid: Recent Activity & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500">Live events captured from WhatsApp chats</p>
            </div>
            <button
              onClick={() => onNavigatePage("chat")}
              className="text-xs font-semibold text-[#075E54] hover:text-[#25D366] flex items-center gap-1"
            >
              Simulate More <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {activities.length > 0 ? (
              activities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  onClick={() => act.linkPage && onNavigatePage(act.linkPage)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        act.type === "order"
                          ? "bg-emerald-50 text-emerald-700"
                          : act.type === "booking"
                          ? "bg-amber-50 text-amber-700"
                          : act.type === "stock"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {act.type === "order" ? (
                        <ShoppingBag className="w-4 h-4" />
                      ) : act.type === "booking" ? (
                        <Calendar className="w-4 h-4" />
                      ) : act.type === "stock" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-[#075E54] transition-colors">
                          {act.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {act.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                        {act.description}
                      </p>
                    </div>
                  </div>
                  {act.linkPage && (
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0 mt-1" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No activity yet. Send messages in the Test Chat to see live events here!
              </p>
            )}
          </div>
        </div>

        {/* Stock / Inventory Watchlist (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Inventory Status</h2>
              <p className="text-xs text-slate-500">Items low in stock or sold out</p>
            </div>
            <button
              onClick={() => onNavigatePage("products")}
              className="text-xs font-semibold text-[#075E54] hover:underline"
            >
              All Products
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((prod) => (
                <div
                  key={prod.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    prod.stock === 0
                      ? "bg-rose-50/60 border-rose-200"
                      : "bg-amber-50/60 border-amber-200"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      ${prod.price.toFixed(2)} ·{" "}
                      <span
                        className={
                          prod.stock === 0
                            ? "text-rose-700 font-bold"
                            : "text-amber-700 font-bold"
                        }
                      >
                        {prod.stock === 0 ? "Out of Stock" : `${prod.stock} left`}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => onUpdateProductStock(prod.id, prod.stock + 5)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg shadow-2xs flex items-center gap-1 shrink-0 transition-all active:scale-95"
                    title="Restock +5 units"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    +5 Stock
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center text-xs text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="font-semibold">All inventory healthy!</p>
                <p className="text-emerald-700 text-[11px]">No items under 5 units right now.</p>
              </div>
            )}
          </div>

          {/* Quick Business Rules Recap */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Standard Delivery:</span>
              <span className="font-semibold text-slate-800">${businessInfo.deliveryCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Free Delivery Above:</span>
              <span className="font-semibold text-emerald-700">${businessInfo.freeDeliveryAbove.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Operating Hours:</span>
              <span className="font-semibold text-slate-800 truncate ml-2">{businessInfo.hours}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

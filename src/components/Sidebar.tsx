import React from "react";
import {
  MessageSquare,
  MessageCircle,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Calendar,
  Settings as SettingsIcon,
  Power,
  Store,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { PageType, AssistantSettings, Order, Booking } from "../types.ts";

interface SidebarProps {
  currentPage: PageType;
  onSelectPage: (page: PageType) => void;
  settings: AssistantSettings;
  onToggleActive: () => void;
  orders: Order[];
  bookings: Booking[];
  productsCount: number;
  conversationsCount?: number;
  businessName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  settings,
  onToggleActive,
  orders,
  bookings,
  productsCount,
  conversationsCount = 0,
  businessName,
}) => {
  const newOrdersCount = orders.filter((o) => o.status === "New").length;
  const pendingBookingsCount = bookings.filter((b) => b.status === "Pending").length;

  const navItems = [
    {
      id: "chat" as PageType,
      label: "Test Chat",
      icon: MessageSquare,
      badge: settings.active ? "Online" : "Paused",
      badgeColor: settings.active
        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
        : "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    },
    {
      id: "dashboard" as PageType,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "products" as PageType,
      label: "Products & FAQs",
      icon: Package,
      badge: `${productsCount}`,
      badgeColor: "bg-slate-100 text-slate-600 border border-slate-200",
    },
    {
      id: "orders" as PageType,
      label: "Orders",
      icon: ShoppingBag,
      badge: newOrdersCount > 0 ? `${newOrdersCount} New` : undefined,
      badgeColor: "bg-[#25D366]/20 text-[#075E54] font-semibold border border-[#25D366]/30",
    },
    {
      id: "bookings" as PageType,
      label: "Bookings",
      icon: Calendar,
      badge: pendingBookingsCount > 0 ? `${pendingBookingsCount} Pending` : undefined,
      badgeColor: "bg-amber-500/15 text-amber-700 font-semibold border border-amber-500/30",
    },
    {
      id: "conversations" as PageType,
      label: "Conversations",
      icon: MessageCircle,
      badge: conversationsCount !== undefined ? `${conversationsCount}` : undefined,
      badgeColor: "bg-slate-100 text-slate-700 border border-slate-200",
    },
    {
      id: "settings" as PageType,
      label: "Settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <aside className="w-64 md:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#075E54] flex items-center justify-center text-white shadow-sm shadow-[#25D366]/30">
            <MessageSquare className="w-5 h-5 fill-white/20 stroke-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 text-base tracking-tight truncate">
                ChatBuddy
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">WhatsApp Assistant</p>
          </div>
        </div>

        {/* Business Context Pill */}
        <div className="mt-3.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2">
          <Store className="w-4 h-4 text-[#075E54] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Connected Business
            </p>
            <p className="text-xs font-semibold text-slate-800 truncate">
              {businessName || "Your Business"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-[#075E54] text-white shadow-sm shadow-[#075E54]/20"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge ? (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
                    isActive ? "bg-white/20 text-white" : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              ) : (
                isActive && <ChevronRight className="w-4 h-4 text-white/70" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Assistant Status & Quick Toggle */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  settings.active ? "bg-[#25D366] animate-pulse" : "bg-slate-400"
                }`}
              />
              <span className="text-xs font-semibold text-slate-800">
                Assistant: {settings.active ? "Active" : "Paused"}
              </span>
            </div>
            <button
              onClick={onToggleActive}
              title={settings.active ? "Pause Assistant" : "Activate Assistant"}
              className={`p-1.5 rounded-lg border transition-all ${
                settings.active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {settings.active
              ? "Auto-answering & capturing orders 24/7"
              : "Assistant paused. Automated away message sent."}
          </p>
        </div>

        {/* Gemini engine tag */}
        <div className="mt-2 px-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#25D366]" />
            <span>gemini-2.5-flash</span>
          </div>
          <span className="font-mono text-[10px]">v1.0</span>
        </div>
      </div>
    </aside>
  );
};

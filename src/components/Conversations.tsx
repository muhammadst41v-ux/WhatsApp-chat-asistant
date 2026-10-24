import React, { useState } from "react";
import {
  MessageSquare,
  Search,
  User,
  Phone,
  Clock,
  Shield,
  Bot,
  UserCheck,
  Send,
  Sparkles,
  CheckCheck,
  Smartphone,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Conversation, ChatMessage } from "../types.ts";

interface ConversationsProps {
  conversations: Conversation[];
  onToggleTakeover: (conversationId: string, takeover: boolean) => void;
  onSendMessage: (conversationId: string, text: string, customerPhone: string) => Promise<void>;
  onRefreshData: () => void;
  onSimulateWebhook: (phone: string, name: string, text: string) => Promise<void>;
}

export const Conversations: React.FC<ConversationsProps> = ({
  conversations,
  onToggleTakeover,
  onSendMessage,
  onRefreshData,
  onSimulateWebhook,
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string>(
    conversations[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerReplyText, setOwnerReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Simulation form
  const [simPhone, setSimPhone] = useState("+15552348899");
  const [simName, setSimName] = useState("Sarah Jenkins");
  const [simText, setSimText] = useState("Do you have Velvet Strawberry Cake in stock today?");

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.customerPhone.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const activeConv =
    conversations.find((c) => c.id === selectedConvId) || filteredConversations[0];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerReplyText.trim() || !activeConv || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(activeConv.id, ownerReplyText.trim(), activeConv.customerPhone);
      setOwnerReplyText("");
    } finally {
      setIsSending(false);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSimulateWebhook(simPhone, simName, simText);
    setShowSimulateModal(false);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden bg-slate-100/70">
      {/* Left List of Customer Conversations */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#075E54]" />
              Conversations
            </h1>
            <p className="text-[11px] text-slate-500">
              Live customer chats & full message logs
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSimulateModal(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1"
              title="Simulate incoming WhatsApp message"
            >
              <Sparkles className="w-3 h-3 text-[#25D366]" />
              Simulate
            </button>
            <button
              onClick={onRefreshData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone or text..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected ? "bg-emerald-50/60 border-l-4 border-l-[#075E54]" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {conv.customerName ? conv.customerName.charAt(0) : "C"}
                    </div>
                    {conv.humanTakeover ? (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center"
                        title="Human Takeover Active"
                      >
                        <UserCheck className="w-2.5 h-2.5 text-white" />
                      </span>
                    ) : (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#25D366] border-2 border-white"
                        title="AI Bot Handling"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {conv.customerName}
                      </h3>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {conv.customerPhone}
                    </p>

                    <p className="text-xs text-slate-600 truncate mt-1">
                      {conv.lastMessage || "Conversation started"}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                          conv.humanTakeover
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100/80 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {conv.humanTakeover ? "👤 Human Takeover" : "🤖 AI Bot"}
                      </span>
                      {conv.source === "whatsapp" && (
                        <span className="text-[9.5px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                          WhatsApp
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* Right Conversation Stream */}
      {activeConv ? (
        <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden">
          {/* Active Conversation Top Bar */}
          <div className="bg-[#F0F2F5] px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-sm">
                {activeConv.customerName ? activeConv.customerName.charAt(0) : "C"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    {activeConv.customerName}
                  </h2>
                  <span className="text-xs font-mono text-slate-500">
                    {activeConv.customerPhone}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                  Active on WhatsApp
                </p>
              </div>
            </div>

            {/* Human Takeover Toggle */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  activeConv.humanTakeover
                    ? "bg-amber-50 text-amber-900 border-amber-300 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                <div className="text-right">
                  <p className="text-xs font-bold leading-tight">
                    {activeConv.humanTakeover ? "Human Takeover ON" : "AI Assistant Active"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {activeConv.humanTakeover
                      ? "Bot is paused for this customer"
                      : "Bot auto-replies 24/7"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleTakeover(activeConv.id, !activeConv.humanTakeover)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeConv.humanTakeover
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-[#075E54] hover:bg-[#128C7E] text-white"
                  }`}
                >
                  {activeConv.humanTakeover ? "Resume Bot" : "Take Over"}
                </button>
              </div>
            </div>
          </div>

          {/* Messages Stream with WhatsApp Wallpaper */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{
              backgroundImage: `radial-gradient(rgba(7,94,84,0.07) 0.5px, transparent 0.5px), radial-gradient(rgba(7,94,84,0.07) 0.5px, #efeae2 0.5px)`,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 10px 10px",
            }}
          >
            <div className="flex justify-center my-1">
              <span className="bg-white/90 text-slate-600 text-xs font-semibold px-3 py-0.5 rounded-full shadow-2xs border border-slate-200/60 uppercase">
                WhatsApp Chat History
              </span>
            </div>

            {activeConv.messages.map((m) => {
              const isCustomer = m.sender === "user";
              const isOwner = m.sender === "owner";

              return (
                <div
                  key={m.id}
                  className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2 max-w-[80%] shadow-2xs border text-xs leading-relaxed ${
                      isCustomer
                        ? "bg-white text-slate-900 rounded-tl-none border-slate-200/80"
                        : isOwner
                        ? "bg-[#cfe8ff] text-slate-900 rounded-tr-none border-[#b5dbfc]"
                        : "bg-[#D9FDD3] text-slate-900 rounded-tr-none border-[#C5ECC0]"
                    }`}
                  >
                    {!isCustomer && (
                      <div className="flex items-center gap-1 mb-1 text-[10px] font-bold">
                        {isOwner ? (
                          <span className="text-blue-700 flex items-center gap-0.5">
                            <User className="w-3 h-3" /> You (Owner Reply)
                          </span>
                        ) : (
                          <span className="text-emerald-700 flex items-center gap-0.5">
                            <Bot className="w-3 h-3" /> Assistant (AI)
                          </span>
                        )}
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{m.text}</p>

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                      <span>{m.timestamp}</span>
                      {!isCustomer && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Owner Reply Bar */}
          <form
            onSubmit={handleSendReply}
            className="bg-[#F0F2F5] px-4 py-3 border-t border-slate-200 flex items-center gap-3 shrink-0"
          >
            <div className="flex-1">
              <input
                type="text"
                value={ownerReplyText}
                onChange={(e) => setOwnerReplyText(e.target.value)}
                placeholder={
                  activeConv.humanTakeover
                    ? "Type your message to reply as business owner directly on WhatsApp..."
                    : "Type message to reply directly (Human takeover recommended)..."
                }
                className="w-full bg-white text-slate-800 text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#25D366]"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !ownerReplyText.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#00A884] hover:bg-[#075E54] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
          <div>
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Select a conversation</p>
            <p className="text-xs text-slate-400">
              View customer conversation history, toggle human takeover, or reply directly.
            </p>
          </div>
        </div>
      )}

      {/* Webhook Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#25D366]" />
                Simulate Incoming WhatsApp Webhook
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Emulates Meta sending an incoming customer message to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/webhook/whatsapp</code>.
              </p>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  required
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#075E54] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-xs"
                >
                  Dispatch Webhook Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

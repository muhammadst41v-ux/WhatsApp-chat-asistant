import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  Smile,
  Paperclip,
  CheckCheck,
  RefreshCw,
  Phone,
  Video,
  MoreVertical,
  Code2,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Calendar,
  Sparkles,
  Smartphone,
  Monitor,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  ChatMessage,
  BusinessInfo,
  Product,
  FAQ,
  AssistantSettings,
  Order,
  Booking,
  PageType,
  AIResponsePayload,
} from "../types.ts";
import { sendChatMessage } from "../services/chatService.ts";

interface TestChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  businessInfo: BusinessInfo;
  products: Product[];
  faqs: FAQ[];
  settings: AssistantSettings;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  onNavigatePage: (page: PageType) => void;
  onAddActivity: (activity: any) => void;
}

export const TestChat: React.FC<TestChatProps> = ({
  messages,
  setMessages,
  businessInfo,
  products,
  faqs,
  settings,
  orders,
  setOrders,
  bookings,
  setBookings,
  onNavigatePage,
  onAddActivity,
}) => {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [viewMode, setViewMode] = useState<"phone" | "web">("phone");
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [lastAiResponse, setLastAiResponse] = useState<AIResponsePayload | null>(null);
  const [customerName, setCustomerName] = useState("Sarah");
  const [customerPhone, setCustomerPhone] = useState("+1 (555) 234-8899");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const quickPrompts = [
    { label: "Check Stock", text: "Do you have the Velvet Strawberry Cake in stock?" },
    { label: "Delivery Info", text: "How much are your delivery charges and what is the free delivery rule?" },
    { label: "Take Order", text: `I'd like to order 1 Velvet Strawberry Cake and 2 Iced Caramel Macchiatos. My name is ${customerName}, phone is ${customerPhone}, address is 48 Oak Ave.` },
    { label: "Book Table", text: `Hi! I want to book a table for 2 people tomorrow at 7:00 PM under ${customerName}, phone ${customerPhone}.` },
    { label: "Out of Stock Test", text: "Do you have the Gluten-Free Almond Croissant available right now?" },
    { label: "Payment Options", text: "What payment methods do you accept for deliveries?" },
    { label: "Urdu / Roman Urdu", text: "Aap k pas delivery kitne der mein hoti hai aur minimum order kya hai?" },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isTyping) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text,
      timestamp: currentTime,
      status: "read",
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    try {
      const aiResponse = await sendChatMessage(
        updatedMessages,
        businessInfo,
        products,
        faqs,
        settings
      );

      setLastAiResponse(aiResponse);

      const assistantTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const assistantMessage: ChatMessage = {
        id: "msg-" + (Date.now() + 1),
        sender: "assistant",
        text: aiResponse.reply,
        timestamp: assistantTime,
        status: "read",
        intent: aiResponse.intent,
        summary: aiResponse.summary,
      };

      const newMessagesList: ChatMessage[] = [...updatedMessages, assistantMessage];

      // Auto-save Order if complete
      if (aiResponse.order && aiResponse.order.isComplete) {
        const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
        const newOrder: Order = {
          id: orderId,
          customerName: aiResponse.order.customerName || customerName,
          phone: aiResponse.order.phone || customerPhone,
          address: aiResponse.order.address || "Customer Address Provided in Chat",
          items:
            aiResponse.order.items && aiResponse.order.items.length > 0
              ? aiResponse.order.items
              : [
                  {
                    productName: "Ordered Item",
                    quantity: 1,
                    unitPrice: aiResponse.order.subtotal || 25,
                    lineTotal: aiResponse.order.subtotal || 25,
                  },
                ],
          subtotal: Number(aiResponse.order.subtotal || 0),
          deliveryFee: Number(aiResponse.order.deliveryFee || 0),
          total: Number(aiResponse.order.total || (aiResponse.order.subtotal || 0) + (aiResponse.order.deliveryFee || 0)),
          status: "New",
          createdAt: new Date().toISOString(),
          notes: aiResponse.order.notes || "Captured automatically by WhatsApp Assistant",
        };

        setOrders((prev) => [newOrder, ...prev]);

        // Add system note bubble in chat
        newMessagesList.push({
          id: "sys-" + Date.now(),
          sender: "system",
          text: `Order saved ✅ (#${orderId} • $${newOrder.total.toFixed(2)})`,
          timestamp: assistantTime,
          isSystemNote: true,
          orderData: newOrder,
        });

        onAddActivity({
          id: "act-" + Date.now(),
          type: "order",
          title: "Order Captured by Assistant",
          description: `${newOrder.customerName} ordered for $${newOrder.total.toFixed(2)}`,
          timestamp: "Just now",
          linkPage: "orders",
        });
      }

      // Auto-save Booking if complete
      if (aiResponse.booking && aiResponse.booking.isComplete) {
        const bookingId = "BK-" + Math.floor(300 + Math.random() * 700);
        const newBooking: Booking = {
          id: bookingId,
          customerName: aiResponse.booking.customerName || customerName,
          phone: aiResponse.booking.phone || customerPhone,
          service: aiResponse.booking.service || "Reservation / Table",
          date: aiResponse.booking.date || "Tomorrow",
          time: aiResponse.booking.time || "7:00 PM",
          guests: aiResponse.booking.guests || 2,
          status: "Confirmed",
          createdAt: new Date().toISOString(),
          notes: aiResponse.booking.notes || "Booked via WhatsApp Assistant simulation",
        };

        setBookings((prev) => [newBooking, ...prev]);

        // Add system note bubble in chat
        newMessagesList.push({
          id: "sys-bk-" + Date.now(),
          sender: "system",
          text: `Booking saved 📅 (#${bookingId} • ${newBooking.service} on ${newBooking.date})`,
          timestamp: assistantTime,
          isSystemNote: true,
          bookingData: newBooking,
        });

        onAddActivity({
          id: "act-" + Date.now(),
          type: "booking",
          title: "Booking Captured by Assistant",
          description: `${newBooking.customerName} booked ${newBooking.service}`,
          timestamp: "Just now",
          linkPage: "bookings",
        });
      }

      // Add general activity for questions
      if (!aiResponse.order?.isComplete && !aiResponse.booking?.isComplete && aiResponse.summary) {
        onAddActivity({
          id: "act-" + Date.now(),
          type: "chat",
          title: `Inquiry (${aiResponse.intent})`,
          description: aiResponse.summary,
          timestamp: "Just now",
          linkPage: "chat",
        });
      }

      setMessages(newMessagesList);
    } catch (err) {
      console.error("Error processing assistant response:", err);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = () => {
    const greetingTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages([
      {
        id: "init-" + Date.now(),
        sender: "assistant",
        text: settings.greeting || "Hello! How can I assist you today? 🍰",
        timestamp: greetingTime,
        status: "read",
      },
    ]);
    setLastAiResponse(null);
  };

  const handlePersonaChange = (preset: string) => {
    if (preset === "sarah") {
      setCustomerName("Sarah Jenkins");
      setCustomerPhone("+1 (555) 234-8899");
    } else if (preset === "ali") {
      setCustomerName("Ali Raza");
      setCustomerPhone("+92 300 1234567");
    } else if (preset === "rahul") {
      setCustomerName("Rahul Sharma");
      setCustomerPhone("+91 98765 43210");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100/70">
      {/* Top Test Control Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Testing Mode
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp Live Simulator
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("phone")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === "phone"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#075E54]" />
              Phone Mockup
            </button>
            <button
              onClick={() => setViewMode("web")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === "web"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-[#075E54]" />
              WhatsApp Web View
            </button>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Customer Persona Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="hidden md:inline font-medium">Customer:</span>
            <select
              value={customerName.includes("Sarah") ? "sarah" : customerName.includes("Ali") ? "ali" : customerName.includes("Rahul") ? "rahul" : "custom"}
              onChange={(e) => handlePersonaChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
            >
              <option value="sarah">Sarah (English)</option>
              <option value="ali">Ali (Urdu / Roman)</option>
              <option value="rahul">Rahul (Hindi / Eng)</option>
            </select>
          </div>

          {/* AI JSON Inspector toggle */}
          <button
            onClick={() => setShowJsonInspector(!showJsonInspector)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all ${
              showJsonInspector
                ? "bg-[#075E54] text-white border-[#075E54]"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON Inspector</span>
          </button>

          {/* Reset Chat */}
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
            title="Reset Chat to greeting"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      <div className="flex-1 flex overflow-hidden p-2 sm:p-4 lg:p-6 justify-center items-center">
        {viewMode === "phone" ? (
          /* Phone Frame Container */
          <div className="w-full max-w-[420px] h-[92vh] max-h-[820px] bg-black rounded-[42px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col relative shrink-0">
            {/* Phone Speaker & Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 mr-2" />
              <div className="w-10 h-1 rounded-full bg-slate-800" />
            </div>

            {/* Inner Phone Screen */}
            <div className="w-full h-full bg-[#EFEAE2] rounded-[32px] overflow-hidden flex flex-col relative border border-slate-700/50">
              {/* WhatsApp Phone Header */}
              <div className="bg-[#075E54] text-white px-3.5 pt-8 pb-3 shadow-md shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 border-2 border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                      {businessInfo.name ? businessInfo.name.charAt(0) : "B"}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] ring-1.5 ring-[#075E54]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold truncate leading-tight">
                      {businessInfo.name || "Your Business"}
                    </h2>
                    <p className="text-[11px] text-emerald-200 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                      online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-white/90">
                  <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                  <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* Chat Messages Body with WhatsApp Wallpaper Texture */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2.5 relative"
                style={{
                  backgroundImage: `radial-gradient(rgba(7,94,84,0.07) 0.5px, transparent 0.5px), radial-gradient(rgba(7,94,84,0.07) 0.5px, #efeae2 0.5px)`,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 10px 10px",
                }}
              >
                {/* Date Badge */}
                <div className="flex justify-center my-1">
                  <span className="bg-white/85 text-slate-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs uppercase tracking-wider border border-slate-200/50">
                    Today
                  </span>
                </div>

                {/* Encryption Notice */}
                <div className="flex justify-center mb-2">
                  <div className="bg-[#FFEECD] text-amber-900/80 text-[10.5px] px-3 py-1.5 rounded-lg max-w-[85%] text-center shadow-2xs leading-relaxed border border-amber-200/60">
                    🔒 Messages are simulated with Gemini 2.5 Flash using store inventory, FAQs & live delivery rules.
                  </div>
                </div>

                {/* Messages List */}
                {messages.map((msg) => renderChatMessage(msg, onNavigatePage))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-end gap-1.5 max-w-[80%] animate-fade-in">
                    <div className="bg-white text-slate-600 px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-2xs border border-slate-200/70 flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">typing</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts Carousel */}
              <div className="bg-white/95 backdrop-blur-xs border-t border-slate-200/80 px-2 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(qp.text)}
                    disabled={isTyping}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 transition-all shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* WhatsApp Message Input Bar */}
              <div className="bg-[#F0F2F5] px-2 py-2 flex items-center gap-1.5 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                  title="Attach file / image"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message as customer..."
                  className="flex-1 bg-white text-slate-800 text-xs px-3 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#25D366] placeholder:text-slate-400"
                />

                {inputText.trim() ? (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isTyping}
                    className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center hover:bg-[#075E54] transition-all shadow-sm shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage("Could you please show me your menu and bestsellers?")}
                    className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors shrink-0"
                    title="Simulate Voice Note / Auto-Prompt"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* WhatsApp Web Desktop Simulator */
          <div className="w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
            {/* Left WhatsApp Web Chat List */}
            <div className="w-full md:w-80 border-r border-slate-200 bg-[#FFFFFF] flex flex-col shrink-0">
              {/* Header */}
              <div className="bg-[#F0F2F5] px-4 py-3 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-sm">
                    {businessInfo.name ? businessInfo.name.charAt(0) : "B"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      WhatsApp Web Simulator
                    </p>
                    <p className="text-[11px] text-slate-500">{businessInfo.phone}</p>
                  </div>
                </div>
              </div>

              {/* Active Conversation Item */}
              <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center gap-3 cursor-pointer">
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {customerName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {customerName} (Customer)
                    </h4>
                    <span className="text-[10px] text-slate-400">now</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {messages[messages.length - 1]?.text || "Chat started"}
                  </p>
                </div>
              </div>

              {/* Store Catalog Quick Reference for Owner */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#075E54]" />
                    In-Stock Items ({products.filter((p) => p.stock > 0).length})
                  </h5>
                  <div className="space-y-1">
                    {products.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 truncate">{p.name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          ${p.price.toFixed(2)} ({p.stock})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Delivery Rules</p>
                  <p>• Standard: ${businessInfo.deliveryCharges.toFixed(2)}</p>
                  <p>• Free over: ${businessInfo.freeDeliveryAbove.toFixed(2)}</p>
                  <p>• Hours: {businessInfo.hours}</p>
                </div>
              </div>
            </div>

            {/* Right WhatsApp Web Conversation View */}
            <div className="flex-1 flex flex-col bg-[#EFEAE2] relative overflow-hidden">
              {/* WhatsApp Web Chat Header */}
              <div className="bg-[#F0F2F5] px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-sm">
                    {businessInfo.name ? businessInfo.name.charAt(0) : "B"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {businessInfo.name}
                    </h3>
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      online · WhatsApp Assistant Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Video className="w-5 h-5 cursor-pointer hover:text-slate-900" />
                  <Phone className="w-5 h-5 cursor-pointer hover:text-slate-900" />
                  <MoreVertical className="w-5 h-5 cursor-pointer hover:text-slate-900" />
                </div>
              </div>

              {/* Messages viewport */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{
                  backgroundImage: `radial-gradient(rgba(7,94,84,0.07) 0.5px, transparent 0.5px), radial-gradient(rgba(7,94,84,0.07) 0.5px, #efeae2 0.5px)`,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 10px 10px",
                }}
              >
                <div className="flex justify-center my-1">
                  <span className="bg-white/90 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full shadow-2xs border border-slate-200/60 uppercase">
                    Today
                  </span>
                </div>

                {messages.map((msg) => renderChatMessage(msg, onNavigatePage))}

                {isTyping && (
                  <div className="flex items-end gap-1.5 max-w-[80%]">
                    <div className="bg-white text-slate-600 px-4 py-3 rounded-2xl rounded-tl-none shadow-2xs border border-slate-200 flex items-center gap-1.5 text-xs">
                      <span>{settings.assistantName || "Assistant"} is typing...</span>
                      <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts bar */}
              <div className="bg-white/95 px-4 py-2 border-t border-slate-200 flex gap-2 overflow-x-auto">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(qp.text)}
                    disabled={isTyping}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all shrink-0"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <div className="bg-[#F0F2F5] px-4 py-3 flex items-center gap-3 border-t border-slate-200">
                <Smile className="w-6 h-6 text-slate-500 cursor-pointer" />
                <Paperclip className="w-6 h-6 text-slate-500 cursor-pointer" />

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message as customer..."
                  className="flex-1 bg-white text-slate-800 text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#25D366]"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isTyping}
                  className="w-10 h-10 rounded-full bg-[#00A884] text-white flex items-center justify-center hover:bg-[#075E54] transition-all shadow-sm shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out / Collapsible Live JSON Inspector */}
      {showJsonInspector && (
        <div className="bg-slate-900 text-slate-100 border-t border-slate-700 p-4 max-h-64 overflow-y-auto shrink-0 shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Gemini Live JSON Extraction Inspector
              </span>
              {lastAiResponse && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Intent: {lastAiResponse.intent}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowJsonInspector(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close ✕
            </button>
          </div>

          {lastAiResponse ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-[11px] mb-1">Intent & Urgency</p>
                <p className="text-emerald-300 font-semibold">{lastAiResponse.intent}</p>
                <p className="text-slate-400 text-[11px] mt-1">
                  Urgency:{" "}
                  <span
                    className={
                      lastAiResponse.urgency === "high"
                        ? "text-rose-400"
                        : lastAiResponse.urgency === "medium"
                        ? "text-amber-400"
                        : "text-slate-300"
                    }
                  >
                    {lastAiResponse.urgency}
                  </span>
                </p>
                <p className="text-slate-400 text-[11px] mt-2">Summary:</p>
                <p className="text-slate-200 text-[11px]">{lastAiResponse.summary}</p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-[11px] mb-1">Extracted Order Object</p>
                {lastAiResponse.order ? (
                  <div>
                    <p className="text-amber-300">
                      Complete: {lastAiResponse.order.isComplete ? "YES ✅" : "Collecting details..."}
                    </p>
                    {lastAiResponse.order.customerName && (
                      <p>Name: {lastAiResponse.order.customerName}</p>
                    )}
                    {lastAiResponse.order.total !== undefined && (
                      <p>Total: ${Number(lastAiResponse.order.total).toFixed(2)}</p>
                    )}
                    <pre className="text-[10px] text-slate-300 mt-1 max-h-20 overflow-y-auto">
                      {JSON.stringify(lastAiResponse.order, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No order parameters in this turn</p>
                )}
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-[11px] mb-1">Extracted Booking Object</p>
                {lastAiResponse.booking ? (
                  <div>
                    <p className="text-blue-300">
                      Complete: {lastAiResponse.booking.isComplete ? "YES 📅" : "Collecting..."}
                    </p>
                    {lastAiResponse.booking.service && (
                      <p>Service: {lastAiResponse.booking.service}</p>
                    )}
                    <pre className="text-[10px] text-slate-300 mt-1 max-h-20 overflow-y-auto">
                      {JSON.stringify(lastAiResponse.booking, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No booking parameters in this turn</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Send a message to see Gemini's live JSON payload extraction here.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Helper renderer for message bubbles
function renderChatMessage(msg: ChatMessage, onNavigatePage: (p: PageType) => void) {
  if (msg.isSystemNote || msg.sender === "system") {
    return (
      <div key={msg.id} className="flex justify-center my-2">
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-1.5 rounded-full shadow-xs flex items-center gap-2 text-xs font-semibold animate-scale-up">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{msg.text}</span>
          {msg.orderData && (
            <button
              onClick={() => onNavigatePage("orders")}
              className="text-emerald-700 underline hover:text-emerald-900 text-[11px] flex items-center gap-0.5 ml-1 font-bold"
            >
              View Order <ExternalLink className="w-3 h-3" />
            </button>
          )}
          {msg.bookingData && (
            <button
              onClick={() => onNavigatePage("bookings")}
              className="text-emerald-700 underline hover:text-emerald-900 text-[11px] flex items-center gap-0.5 ml-1 font-bold"
            >
              View Booking <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Customer messages (outgoing green bubble)
  if (msg.sender === "user") {
    return (
      <div key={msg.id} className="flex justify-end">
        <div className="bg-[#D9FDD3] text-slate-900 rounded-2xl rounded-tr-none px-3.5 py-2 max-w-[82%] shadow-2xs border border-[#C5ECC0] relative group">
          <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>
          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500">
            <span>{msg.timestamp}</span>
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant messages (incoming white bubble)
  return (
    <div key={msg.id} className="flex justify-start">
      <div className="bg-white text-slate-900 rounded-2xl rounded-tl-none px-3.5 py-2 max-w-[85%] shadow-2xs border border-slate-200/80 relative">
        <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
          {msg.intent && (
            <span className="text-[9.5px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
              {msg.intent}
            </span>
          )}
          <span>{msg.timestamp}</span>
        </div>
      </div>
    </div>
  );
}

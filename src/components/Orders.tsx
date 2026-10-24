import React, { useState } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Copy,
  Plus,
  Trash2,
  ChevronDown,
  ExternalLink,
  Phone,
  MapPin,
  Check,
  Receipt,
  X,
} from "lucide-react";
import { Order, Product, BusinessInfo } from "../types.ts";

interface OrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  businessInfo: BusinessInfo;
}

export const Orders: React.FC<OrdersProps> = ({
  orders,
  setOrders,
  products,
  businessInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Order Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    selectedProductId: products[0]?.id || "",
    quantity: 1,
    notes: "",
  });

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm(`Are you sure you want to delete order #${orderId}?`)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }
  };

  const handleCopyWhatsAppConfirmation = (order: Order) => {
    const itemsList = order.items
      .map((it) => `• ${it.quantity}x ${it.productName} ($${it.lineTotal.toFixed(2)})`)
      .join("\n");

    const message = `*Order Confirmation - ${businessInfo.name}* 🍰
Order ID: #${order.id}
Customer: ${order.customerName}
Phone: ${order.phone}
Delivery Address: ${order.address}

*Items:*
${itemsList}

Subtotal: $${order.subtotal.toFixed(2)}
Delivery Fee: $${order.deliveryFee.toFixed(2)}
*Total Amount: $${order.total.toFixed(2)}*
Status: ${order.status}

Thank you for choosing ${businessInfo.name}! Your order is being prepared with care. 🛵`;

    navigator.clipboard.writeText(message);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === manualForm.selectedProductId) || products[0];
    if (!product) return;

    const qty = Number(manualForm.quantity) || 1;
    const subtotal = product.price * qty;
    const deliveryFee = subtotal >= businessInfo.freeDeliveryAbove ? 0 : businessInfo.deliveryCharges;
    const total = subtotal + deliveryFee;

    const newOrder: Order = {
      id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
      customerName: manualForm.customerName || "Walk-in Customer",
      phone: manualForm.phone || businessInfo.phone,
      address: manualForm.address || businessInfo.location,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice: product.price,
          lineTotal: subtotal,
        },
      ],
      subtotal,
      deliveryFee,
      total,
      status: "New",
      createdAt: new Date().toISOString(),
      notes: manualForm.notes || "Manually recorded order",
    };

    setOrders((prev) => [newOrder, ...prev]);
    setIsManualModalOpen(false);
    setManualForm({
      customerName: "",
      phone: "",
      address: "",
      selectedProductId: products[0]?.id || "",
      quantity: 1,
      notes: "",
    });
  };

  // Summary Metrics
  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.status !== "Cancelled" ? o.total : 0),
    0
  );
  const newCount = orders.filter((o) => o.status === "New").length;
  const confirmedCount = orders.filter((o) => o.status === "Confirmed").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            WhatsApp Orders
          </h1>
          <p className="text-sm text-slate-500">
            Real-time orders collected by the AI assistant during live chats.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="px-4 py-2 bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Manual Order
        </button>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Orders
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Total Sales
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            New Awaiting
          </p>
          <p className="text-xl font-bold text-blue-700 mt-1">{newCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
            Delivered
          </p>
          <p className="text-xl font-bold text-purple-700 mt-1">{deliveredCount}</p>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or #ORD ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: "all", label: "All" },
            { id: "New", label: "New" },
            { id: "Confirmed", label: "Confirmed" },
            { id: "Delivered", label: "Delivered" },
            { id: "Cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-[#075E54] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Order Primary Details */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    #{order.id}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      order.status === "New"
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : order.status === "Confirmed"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : order.status === "Delivered"
                        ? "bg-purple-50 text-purple-800 border-purple-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    ·{" "}
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="text-xs text-slate-700 space-y-0.5">
                  <p className="font-semibold text-slate-900 text-sm">
                    {order.customerName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {order.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {order.address}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 max-w-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Items:
                  </p>
                  <ul className="space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-[11px]">
                        <span>
                          <strong className="text-slate-900">{item.quantity}x</strong>{" "}
                          {item.productName}
                        </span>
                        <span className="font-mono text-slate-600">
                          ${item.lineTotal.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <p className="text-[10.5px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-2">
                      📝 Note: {order.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Total & Action Controls */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <div className="text-left md:text-right">
                  <p className="text-[11px] text-slate-400">Total Bill</p>
                  <p className="text-xl font-bold font-mono text-slate-900">
                    ${order.total.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Subtotal: ${order.subtotal.toFixed(2)} + Delivery: $
                    {order.deliveryFee.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value as Order["status"])
                    }
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  >
                    <option value="New">New</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  {/* Copy WhatsApp confirmation receipt */}
                  <button
                    onClick={() => handleCopyWhatsAppConfirmation(order)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                    title="Copy WhatsApp order message"
                  >
                    {copiedId === order.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy WA</span>
                      </>
                    )}
                  </button>

                  {/* Delete Order */}
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No orders found</h3>
            <p className="text-xs text-slate-500">
              When a customer completes an order in the WhatsApp Test Chat, it appears right here!
            </p>
          </div>
        )}
      </div>

      {/* Manual Order Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Create Manual Order
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.customerName}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, customerName: e.target.value })
                  }
                  placeholder="e.g. Liam Smith"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.phone}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Product
                  </label>
                  <select
                    value={manualForm.selectedProductId}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, selectedProductId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualForm.quantity}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, quantity: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={manualForm.address}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, address: e.target.value })
                    }
                    placeholder="Street, suite, city"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Order Notes
                </label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, notes: e.target.value })
                  }
                  placeholder="Special instructions or customer allergies..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#075E54] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-xs"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

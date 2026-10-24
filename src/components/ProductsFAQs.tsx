import React, { useState } from "react";
import {
  Package,
  HelpCircle,
  Store,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  Phone,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Save,
} from "lucide-react";
import { Product, FAQ, BusinessInfo, PageType } from "../types.ts";

interface ProductsFAQsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  faqs: FAQ[];
  setFaqs: React.Dispatch<React.SetStateAction<FAQ[]>>;
  businessInfo: BusinessInfo;
  setBusinessInfo: React.Dispatch<React.SetStateAction<BusinessInfo>>;
  onNavigatePage: (page: PageType) => void;
  onTestPrompt: (promptText: string) => void;
}

export const ProductsFAQs: React.FC<ProductsFAQsProps> = ({
  products,
  setProducts,
  faqs,
  setFaqs,
  businessInfo,
  setBusinessInfo,
  onNavigatePage,
  onTestPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<"products" | "faqs" | "business">("products");

  // Product filters & search
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Cakes",
    price: 0,
    stock: 10,
    description: "",
    inStock: true,
  });

  // FAQ filters & modal
  const [faqSearch, setFaqSearch] = useState("");
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "General",
  });

  // Business info form state
  const [infoForm, setInfoForm] = useState<BusinessInfo>({ ...businessInfo });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategory === "all" || p.category === productCategory;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filtered FAQs
  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // Handlers for Products
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category: categories[0] || "Bakery",
      price: 10.0,
      stock: 10,
      description: "",
      inStock: true,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      description: p.description,
      inStock: p.inStock,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...productForm,
                price: Number(productForm.price),
                stock: Number(productForm.stock),
                inStock: Number(productForm.stock) > 0 && productForm.inStock,
              }
            : p
        )
      );
    } else {
      const newProduct: Product = {
        id: "prod-" + Date.now(),
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        inStock: Number(productForm.stock) > 0 && productForm.inStock,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleAdjustStock = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + delta);
          return {
            ...p,
            stock: newStock,
            inStock: newStock > 0,
          };
        }
        return p;
      })
    );
  };

  // Handlers for FAQs
  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ question: "", answer: "", category: "General" });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (f: FAQ) => {
    setEditingFaq(f);
    setFaqForm({ question: f.question, answer: f.answer, category: f.category || "General" });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;

    if (editingFaq) {
      setFaqs((prev) =>
        prev.map((f) => (f.id === editingFaq.id ? { ...f, ...faqForm } : f))
      );
    } else {
      const newFaq: FAQ = {
        id: "faq-" + Date.now(),
        ...faqForm,
      };
      setFaqs((prev) => [...prev, newFaq]);
    }
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = (id: string) => {
    if (confirm("Delete this FAQ item?")) {
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    }
  };

  // Handlers for Business Info
  const handleSaveBusinessInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessInfo({
      ...infoForm,
      deliveryCharges: Number(infoForm.deliveryCharges),
      freeDeliveryAbove: Number(infoForm.freeDeliveryAbove),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const togglePaymentMethod = (method: string) => {
    const current = infoForm.paymentMethods || [];
    if (current.includes(method)) {
      setInfoForm({
        ...infoForm,
        paymentMethods: current.filter((m) => m !== method),
      });
    } else {
      setInfoForm({
        ...infoForm,
        paymentMethods: [...current, method],
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Products & FAQs Knowledge Base
          </h1>
          <p className="text-sm text-slate-500">
            The assistant uses this exact data to verify stock, quote prices, and answer customer queries.
          </p>
        </div>

        {/* Tab navigation pills */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "products"
                ? "bg-[#075E54] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("faqs")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "faqs"
                ? "bg-[#075E54] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            FAQs ({faqs.length})
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "business"
                ? "bg-[#075E54] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Business & Delivery Info
          </button>
        </div>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name or ingredient..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="px-3.5 py-1.5 bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{p.emoji || "📦"}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                              {p.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10.5px] font-medium border border-slate-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(p.id, -1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition-colors"
                            title="Decrease stock"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono font-bold px-1.5 ${
                              p.stock === 0
                                ? "text-rose-600"
                                : p.stock <= 5
                                ? "text-amber-600"
                                : "text-slate-800"
                            }`}
                          >
                            {p.stock}
                          </span>
                          <button
                            onClick={() => handleAdjustStock(p.id, 1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition-colors"
                            title="Increase stock"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.stock > 0 && p.inStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAQS */}
      {activeTab === "faqs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search FAQs by question or answer..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              />
            </div>

            <button
              onClick={handleOpenAddFaq}
              className="px-3.5 py-1.5 bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add FAQ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {faq.category || "General"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditFaq(faq)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700"
                        title="Edit FAQ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    Q: {faq.question}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {faq.answer}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Assistant trained</span>
                  <button
                    onClick={() => {
                      onTestPrompt(faq.question);
                      onNavigatePage("chat");
                    }}
                    className="text-xs font-semibold text-[#075E54] hover:text-[#25D366] flex items-center gap-1"
                  >
                    Test in Chat <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BUSINESS & DELIVERY INFO */}
      {activeTab === "business" && (
        <form onSubmit={handleSaveBusinessInfo} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#075E54]" />
                Store Identity & Location
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The assistant introduces this business name and shares this address for pickups or local navigation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={infoForm.name}
                  onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Business Subtitle
                </label>
                <input
                  type="text"
                  value={infoForm.tagline}
                  onChange={(e) => setInfoForm({ ...infoForm, tagline: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Hours *
                </label>
                <input
                  type="text"
                  value={infoForm.hours}
                  onChange={(e) => setInfoForm({ ...infoForm, hours: e.target.value })}
                  placeholder="e.g. Mon - Sun: 8:00 AM - 9:30 PM"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Contact Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={infoForm.phone}
                  onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Location & Address
                </label>
                <input
                  type="text"
                  value={infoForm.location}
                  onChange={(e) => setInfoForm({ ...infoForm, location: e.target.value })}
                  placeholder="e.g. 48 Maple Street, Downtown Arts District"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>
            </div>
          </div>

          {/* Delivery & Payment Rules */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#075E54]" />
                Delivery Charges & Free-Delivery Rules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The assistant calculates delivery fees and automatically applies free delivery based on these exact figures.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standard Delivery Fee ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={infoForm.deliveryCharges}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, deliveryCharges: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-xs pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Charged on standard local orders</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Free Delivery Rule (Minimum Order Amount $)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={infoForm.freeDeliveryAbove}
                    onChange={(e) =>
                      setInfoForm({
                        ...infoForm,
                        freeDeliveryAbove: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Orders equal or above this get free delivery ($0 fee)
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Accepted Payment Methods (The bot lists these when asked)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    "Cash on Delivery",
                    "Credit / Debit Card",
                    "Bank Transfer / Zelle / UPI",
                    "JazzCash / EasyPaisa",
                    "Apple Pay / Google Pay",
                  ].map((method) => {
                    const isChecked = (infoForm.paymentMethods || []).includes(method);
                    return (
                      <button
                        type="button"
                        key={method}
                        onClick={() => togglePaymentMethod(method)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{method}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
                  <Check className="w-4 h-4" /> Changes saved successfully!
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                Save Business Info
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Red Velvet Cupcake"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="e.g. Pastries"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    In Stock Toggle
                  </label>
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, inStock: !productForm.inStock })}
                    className={`w-full py-2 px-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      productForm.inStock
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-rose-50 text-rose-800 border-rose-300"
                    }`}
                  >
                    {productForm.inStock ? "Available" : "Mark Sold Out"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Ingredients
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Flavor notes, portion size, allergen details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#075E54] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit FAQ Modal */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingFaq ? "Edit FAQ" : "Add New FAQ"}
              </h3>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  placeholder="Delivery, Dietary, Payments, Reservations..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Question *
                </label>
                <input
                  type="text"
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="e.g. Do you bake eggless cakes?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assistant's Answer *
                </label>
                <textarea
                  rows={3}
                  required
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="The precise answer the WhatsApp bot will reply with..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#075E54] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-xs"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

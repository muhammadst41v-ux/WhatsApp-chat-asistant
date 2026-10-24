import React, { useState } from "react";
import {
  Calendar,
  Search,
  Plus,
  Clock,
  Phone,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Copy,
  Trash2,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { Booking, BusinessInfo } from "../types.ts";

interface BookingsProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  businessInfo: BusinessInfo;
}

export const Bookings: React.FC<BookingsProps> = ({
  bookings,
  setBookings,
  businessInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    phone: "",
    service: "Dine-in Table Reservation",
    date: "Tomorrow",
    time: "7:00 PM",
    guests: 2,
    notes: "",
  });

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (bookingId: string, newStatus: Booking["status"]) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
  };

  const handleDeleteBooking = (id: string) => {
    if (confirm("Delete this booking request?")) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleCopyConfirmation = (booking: Booking) => {
    const message = `*Booking Confirmation - ${businessInfo.name}* 📅
Booking ID: #${booking.id}
Customer: ${booking.customerName}
Phone: ${booking.phone}
Service: ${booking.service}
Date: ${booking.date}
Time: ${booking.time}
Guests: ${booking.guests || 2}
Status: ${booking.status}

Location: ${businessInfo.location}
We look forward to hosting you! If you need to make changes, please reply to this WhatsApp message. ✨`;

    navigator.clipboard.writeText(message);
    setCopiedId(booking.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.customerName.trim()) return;

    const newBooking: Booking = {
      id: "BK-" + Math.floor(300 + Math.random() * 700),
      customerName: bookingForm.customerName,
      phone: bookingForm.phone || businessInfo.phone,
      service: bookingForm.service,
      date: bookingForm.date,
      time: bookingForm.time,
      guests: Number(bookingForm.guests) || 2,
      status: "Confirmed",
      createdAt: new Date().toISOString(),
      notes: bookingForm.notes || "Manual reservation recorded",
    };

    setBookings((prev) => [newBooking, ...prev]);
    setIsModalOpen(false);
    setBookingForm({
      customerName: "",
      phone: "",
      service: "Dine-in Table Reservation",
      date: "Tomorrow",
      time: "7:00 PM",
      guests: 2,
      notes: "",
    });
  };

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "Confirmed").length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bookings & Reservations
          </h1>
          <p className="text-sm text-slate-500">
            Automated customer table and appointment requests handled via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Manual Booking
        </button>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Bookings
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">{bookings.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            Pending Approval
          </p>
          <p className="text-xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Confirmed
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{confirmedCount}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings by name, phone, or service..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: "all", label: "All" },
            { id: "Pending", label: "Pending" },
            { id: "Confirmed", label: "Confirmed" },
            { id: "Cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
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

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    #{booking.id}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      booking.status === "Pending"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : booking.status === "Confirmed"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{booking.service}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {booking.date} at {booking.time}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {booking.guests || 2} Guests
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {booking.customerName}
                  </p>
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {booking.phone}
                  </p>
                  {booking.notes && (
                    <p className="text-slate-600 text-[11px] pt-1 mt-1 border-t border-slate-200/60 italic">
                      "{booking.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Status Actions & Copy WA */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {booking.status !== "Confirmed" && (
                    <button
                      onClick={() => handleStatusChange(booking.id, "Confirmed")}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      Confirm
                    </button>
                  )}
                  {booking.status !== "Cancelled" && (
                    <button
                      onClick={() => handleStatusChange(booking.id, "Cancelled")}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    >
                      Cancel
                    </button>
                  )}
                  {booking.status !== "Pending" && (
                    <button
                      onClick={() => handleStatusChange(booking.id, "Pending")}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      Pending
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyConfirmation(booking)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                    title="Copy WhatsApp confirmation"
                  >
                    {copiedId === booking.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteBooking(booking.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete booking"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No bookings found</h3>
            <p className="text-xs text-slate-500">
              When customers ask to reserve a table or book an appointment in WhatsApp, it appears here automatically.
            </p>
          </div>
        )}
      </div>

      {/* Manual Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Add Manual Booking
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={bookingForm.customerName}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, customerName: e.target.value })
                  }
                  placeholder="e.g. David Chen"
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
                    value={bookingForm.phone}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 782-9920"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingForm.guests}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        guests: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Service / Request
                </label>
                <input
                  type="text"
                  required
                  value={bookingForm.service}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, service: e.target.value })
                  }
                  placeholder="e.g. Afternoon High Tea Table for 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={bookingForm.date}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, date: e.target.value })
                    }
                    placeholder="e.g. Tomorrow or Friday"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={bookingForm.time}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, time: e.target.value })
                    }
                    placeholder="e.g. 7:30 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, notes: e.target.value })
                  }
                  placeholder="Seating preferences or anniversary celebration..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#075E54] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-xs"
                >
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

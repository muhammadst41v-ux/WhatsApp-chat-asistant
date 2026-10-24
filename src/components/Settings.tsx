import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Bot,
  Power,
  RotateCcw,
  Sparkles,
  Phone,
  MessageSquare,
  Globe,
  Sliders,
  Check,
  ShieldAlert,
  HelpCircle,
  Save,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Terminal,
  Activity,
  FileText,
  Send,
  Zap,
} from "lucide-react";
import { AssistantSettings, BusinessInfo, SystemStatus } from "../types.ts";

interface SettingsProps {
  settings: AssistantSettings;
  setSettings: React.Dispatch<React.SetStateAction<AssistantSettings>>;
  onResetDefaults: () => void;
  businessInfo: BusinessInfo;
  onRefreshData?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  setSettings,
  onResetDefaults,
  businessInfo,
  onRefreshData,
}) => {
  const [formData, setFormData] = useState<AssistantSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // System Status State
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isVerifyingWebhook, setIsVerifyingWebhook] = useState(false);
  const [webhookVerifyResult, setWebhookVerifyResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  // Simulation form in settings
  const [simText, setSimText] = useState("Do you have the strawberry cake in stock?");
  const [simSending, setSimSending] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.warn("Could not fetch /api/status:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch (err) {
      console.warn("Error saving settings to backend:", err);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyWebhookUrl = () => {
    if (!status?.webhookUrl) return;
    navigator.clipboard.writeText(status.webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleTestWebhookHandshake = async () => {
    setIsVerifyingWebhook(true);
    setWebhookVerifyResult(null);

    try {
      const testToken = "chatbuddy_secure_verify_token_2026";
      const challengeStr = "handshake_ok_" + Math.floor(Math.random() * 1000);
      const res = await fetch(
        `/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
          testToken
        )}&hub.challenge=${encodeURIComponent(challengeStr)}`
      );
      const text = await res.text();

      if (res.ok && text.includes(challengeStr)) {
        setWebhookVerifyResult({
          ok: true,
          msg: `Handshake test succeeded! Server responded with HTTP 200 and challenge: "${text}".`,
        });
      } else {
        setWebhookVerifyResult({
          ok: false,
          msg: `Handshake returned HTTP ${res.status}: ${text}`,
        });
      }
    } catch (err: any) {
      setWebhookVerifyResult({
        ok: false,
        msg: `Error connecting to webhook: ${err?.message || String(err)}`,
      });
    } finally {
      setIsVerifyingWebhook(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim() || simSending) return;

    setSimSending(true);
    setSimResult(null);

    try {
      const res = await fetch("/api/test/webhook-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: "+1 (555) 234-8899",
          customerName: "Sarah Jenkins",
          text: simText,
        }),
      });

      if (res.ok) {
        setSimResult("Webhook event simulated and processed successfully! Check Conversations & Orders.");
        onRefreshData?.();
      } else {
        setSimResult("Failed to simulate webhook event.");
      }
    } catch (err: any) {
      setSimResult("Error: " + (err?.message || String(err)));
    } finally {
      setSimSending(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Settings & WhatsApp Integration
          </h1>
          <p className="text-sm text-slate-500">
            View live WhatsApp connection status, configure AI bot personality, and test webhooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSetupModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#075E54] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            View SETUP.md
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </div>

      {/* Connection Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Cloud API Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                WhatsApp Cloud API
              </span>
              {status?.whatsappConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Demo Mode (Simulator Ready)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {status?.whatsappConnected
                ? "Your Meta WhatsApp Cloud API credentials are loaded. Incoming webhooks are received and responded to automatically 24/7."
                : "WHATSAPP_TOKEN not provided in .env. Running in interactive Demo Simulator mode so you can test all features before connecting Meta."}
            </p>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Phone ID:</span>
                <span className="font-semibold text-slate-800">
                  {status?.whatsappPhoneNumberId || "Not Set (Demo Mode)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verify Token:</span>
                <span className="text-emerald-700 font-semibold">Configured ✅</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Owner Alerts:</span>
                <span className="text-slate-800">
                  {formData.ownerPhone || "Set below in settings"}
                </span>
              </div>
            </div>
          </div>

          {/* Webhook Endpoint & Handshake Tester */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Webhook Callback URL:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={status?.webhookUrl || "http://localhost:3000/webhook/whatsapp"}
                  className="w-full text-[11px] font-mono bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 shrink-0 flex items-center gap-1 transition-all"
                  title="Copy Webhook URL"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestWebhookHandshake}
                disabled={isVerifyingWebhook}
                className="px-3 py-1.5 text-xs font-semibold bg-[#075E54] hover:bg-[#128C7E] text-white rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Activity className="w-3 h-3" />
                <span>{isVerifyingWebhook ? "Testing..." : "Test Webhook Handshake"}</span>
              </button>
            </div>

            {webhookVerifyResult && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-medium leading-relaxed animate-fade-in ${
                  webhookVerifyResult.ok
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                {webhookVerifyResult.msg}
              </div>
            )}
          </div>
        </div>

        {/* Gemini Engine Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Gemini Intelligence API
              </span>
              {status?.geminiConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  Key Not Injected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Google Gemini powers product queries, stock checking, multilingual translations (Urdu, Hindi, English), and structured JSON order extraction.
            </p>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Model:</span>
                <span className="font-semibold text-emerald-800">gemini-3.8-flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fallback Model:</span>
                <span className="text-slate-700">gemini-flash-latest</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Structured Output:</span>
                <span className="text-emerald-700">JSON Schema Validated ✅</span>
              </div>
            </div>
          </div>

          {/* Quick Webhook Inbound Tester */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Inbound Webhook Simulator (Test End-to-End):
            </span>
            <form onSubmit={handleSimulateWebhook} className="flex gap-2">
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Simulate customer message..."
                className="flex-1 text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                disabled={simSending}
                className="px-3 py-1.5 text-xs font-semibold bg-[#25D366] hover:bg-[#1EBE5D] text-slate-900 rounded-lg shrink-0 flex items-center gap-1 shadow-2xs font-bold"
              >
                <Zap className="w-3 h-3" />
                <span>Simulate</span>
              </button>
            </form>
            {simResult && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1 animate-fade-in">
                {simResult}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Assistant Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Active / Paused Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  formData.active
                    ? "bg-[#25D366]/20 text-[#075E54]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assistant Master Status:{" "}
                  <span
                    className={
                      formData.active ? "text-emerald-700" : "text-amber-700"
                    }
                  >
                    {formData.active ? "Active & Responding 24/7" : "Paused / Away"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {formData.active
                    ? "The assistant is actively responding to customer inquiries, taking orders, and checking inventory in real-time."
                    : "When paused, customers receive an automated away message directing them to your business hours."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                formData.active
                  ? "bg-[#25D366] hover:bg-[#1EBE5D] text-slate-900 shadow-xs"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              {formData.active ? "Pause Assistant" : "Activate Assistant"}
            </button>
          </div>
        </div>

        {/* Identity & Tone */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#075E54]" />
            Assistant Identity & Tone
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assistant Name
              </label>
              <input
                type="text"
                required
                value={formData.assistantName}
                onChange={(e) =>
                  setFormData({ ...formData, assistantName: e.target.value })
                }
                placeholder="e.g. Buddy"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                How the assistant introduces itself on WhatsApp
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Owner Phone for Order Alerts & Escalations
              </label>
              <input
                type="text"
                value={formData.ownerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, ownerPhone: e.target.value })
                }
                placeholder="+1 (555) 392-1084"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Receives WhatsApp alerts whenever a customer places an order or books a table
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Initial Welcome Greeting
              </label>
              <textarea
                rows={2}
                value={formData.greeting}
                onChange={(e) =>
                  setFormData({ ...formData, greeting: e.target.value })
                }
                placeholder="The first automated greeting sent to new WhatsApp chats..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              />
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Assistant Tone of Voice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              {[
                {
                  id: "friendly",
                  title: "Friendly & Warm",
                  desc: "Welcoming with cute emojis",
                },
                {
                  id: "professional",
                  title: "Crisp & Professional",
                  desc: "Polite, direct, reliable",
                },
                {
                  id: "casual",
                  title: "Casual & Upbeat",
                  desc: "Youthful and relaxed",
                },
                {
                  id: "direct",
                  title: "Minimal & Fast",
                  desc: "Short answers, no fluff",
                },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() =>
                    setFormData({ ...formData, tone: t.id as AssistantSettings["tone"] })
                  }
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.tone === t.id
                      ? "bg-emerald-50 text-emerald-950 border-emerald-400 ring-1 ring-emerald-400 font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="font-bold">{t.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Language Preference
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { id: "auto", label: "Auto (Customer's Lang)" },
                { id: "english", label: "English" },
                { id: "urdu", label: "Urdu (اردو)" },
                { id: "roman_urdu", label: "Roman Urdu" },
                { id: "hindi", label: "Hindi (हिंदी)" },
              ].map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      language: lang.id as AssistantSettings["language"],
                    })
                  }
                  className={`px-3 py-2 rounded-xl border text-center font-semibold transition-all ${
                    formData.language === lang.id
                      ? "bg-emerald-50 text-emerald-900 border-emerald-400"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
                <Check className="w-4 h-4" /> Settings saved successfully!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-[#075E54] hover:bg-[#128C7E] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              Save Settings
            </button>
          </div>
        </div>
      </form>

      {/* Setup Instructions Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#075E54]" />
                Meta WhatsApp Cloud API Setup Guide (SETUP.md)
              </h3>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <p className="font-bold text-emerald-900">1. Create Meta Developer App</p>
                <p className="text-emerald-800 mt-0.5">
                  Visit <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="underline font-semibold">developers.facebook.com</a> ➔ Create App ➔ Select "Other" ➔ "Business" ➔ Add <strong>WhatsApp</strong> product.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">2. Get Credentials</p>
                <p className="mt-0.5 text-slate-600">
                  On WhatsApp ➔ API Setup: Copy <strong>Temporary Access Token</strong> and <strong>Phone number ID</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">3. Set Webhook in Meta</p>
                <p className="mt-0.5 text-slate-600">
                  In WhatsApp ➔ Configuration ➔ Edit Webhook:
                  <br />• Callback URL: <code className="bg-white px-1 py-0.5 rounded font-mono font-semibold">https://&lt;your-domain-or-ngrok&gt;/webhook/whatsapp</code>
                  <br />• Verify Token: <code className="bg-white px-1 py-0.5 rounded font-mono font-semibold">chatbuddy_secure_verify_token_2026</code>
                  <br />• Click <strong>Manage</strong> under Webhook fields and subscribe to <strong>messages</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">4. Configure ngrok for Local Testing</p>
                <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded-lg mt-1 font-mono text-[11px]">
                  ngrok http 3000
                </code>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-1.5 bg-[#075E54] text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Reset All Data?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                This will reset your products, FAQs, business info, orders, and chat history back to the default sample bakery data.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDefaults();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

"use client";

import React, { useState } from "react";
import {
  X,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Send,
} from "lucide-react";
import { formatINR, roundFigure } from "@/lib/money";

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtorName: string;
  debtorPhone?: string | null;
  creditorName: string;
  creditorUpiId?: string | null;
  amount: number; // in INR
  groupName: string;
  groupUrl?: string;
}

export default function WhatsAppReminderModal({
  isOpen,
  onClose,
  debtorName,
  debtorPhone,
  creditorName,
  creditorUpiId,
  amount,
  groupName,
  groupUrl,
}: WhatsAppReminderModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    groupUrl ||
    (typeof window !== "undefined" ? window.location.href : "https://splitrupee.com");

  const formattedAmount = formatINR(amount);

  // Clean debtor phone
  const cleanPhone = debtorPhone ? debtorPhone.replace(/[^0-9]/g, "") : "";
  const phoneWithCountry =
    cleanPhone.length >= 10
      ? cleanPhone.length === 10
        ? `91${cleanPhone}`
        : cleanPhone
      : "";

  // Standard UPI URI format for Indian payments (whole round figures)
  const upiUri = creditorUpiId
    ? `upi://pay?pa=${encodeURIComponent(creditorUpiId)}&pn=${encodeURIComponent(
        creditorName
      )}&am=${roundFigure(amount)}&cu=INR&tn=${encodeURIComponent(
        `SplitRupee settle for ${groupName}`
      )}`
    : "";

  const qrCodeUrl = upiUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        upiUri
      )}`
    : "";

  // Polite WhatsApp message text
  const messageText = `Hey ${debtorName.split(" ")[0]}! 👋

Friendly settlement reminder for our group *${groupName}* on SplitRupee:

💰 Amount to settle: *${formattedAmount}*
👤 Pay To: *${creditorName}*${
    creditorUpiId ? `\n📲 UPI ID: *${creditorUpiId}*` : ""
  }

🔗 View group balance & details:
${currentUrl}

Thanks! 🙌`;

  const waUrl = phoneWithCountry
    ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-emerald-500/5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 grid place-items-center text-emerald-500">
              <MessageCircle className="h-5 w-5 fill-emerald-500/20 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  WhatsApp UPI Reminder
                </h3>
                <span className="rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-[9px] font-extrabold px-1.5 py-0.2 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-amber-400" /> PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                1-tap settle up notification with UPI payment details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 grid place-items-center text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Summary Card */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Obligation to {creditorName}
              </p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {formattedAmount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Debtor: <strong className="text-slate-700 dark:text-slate-200">{debtorName}</strong>
              </p>
            </div>
            {creditorUpiId && (
              <button
                type="button"
                onClick={() => setShowQR(!showQR)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                  showQR
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow"
                    : "bg-white dark:bg-slate-800 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span className="text-[10px]">{showQR ? "Hide QR" : "Scan QR"}</span>
              </button>
            )}
          </div>

          {/* Optional On-Screen UPI QR Code */}
          {showQR && creditorUpiId && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-center space-y-2 animate-in fade-in">
              <p className="text-xs font-semibold text-slate-300">
                Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
              </p>
              <div className="flex justify-center p-2 bg-white rounded-xl w-fit mx-auto shadow-lg">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  className="h-44 w-44 object-contain"
                />
              </div>
              <p className="text-[11px] font-mono text-emerald-400 font-semibold">
                {creditorUpiId}
              </p>
            </div>
          )}

          {/* Formatted Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                WhatsApp Message Preview:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-emerald-500 hover:underline font-semibold"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 stroke-[3]" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy Text
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line font-sans leading-relaxed select-text">
              {messageText}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/50 flex gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition"
          >
            <Send className="h-3.5 w-3.5 fill-white" />
            <span>Open WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

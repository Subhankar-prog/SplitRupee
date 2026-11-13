"use client";

import React, { useState } from "react";
import {
  X,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Smartphone,
  ShieldCheck,
  Send,
} from "lucide-react";
import { formatINR, roundFigure } from "@/lib/money";
import { useDialogAccessibility } from "@/components/ui/primitives";
import QrCodeImage from "@/components/ui/QrCodeImage";

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
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  useDialogAccessibility(isOpen, onClose, dialogRef);

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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--overlay-backdrop)] p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-popover flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] grid place-items-center text-[var(--status-positive)]">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id={titleId} className="font-display text-base font-semibold text-[var(--text-primary)]">
                  WhatsApp UPI Reminder
                </h3>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                1-tap settle up notification with UPI payment details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="h-11 w-11 sm:h-8 sm:w-8 rounded-lg border border-[var(--border-subtle)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Summary Card */}
          <div className="rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-positive)]">
                Obligation to {creditorName}
              </p>
              <p className="font-display text-xl font-semibold text-[var(--text-primary)] tabular-nums">
                {formattedAmount}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Debtor: <strong className="text-[var(--text-primary)]">{debtorName}</strong>
              </p>
            </div>
            {creditorUpiId && (
              <button
                type="button"
                onClick={() => setShowQR(!showQR)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                  showQR
                    ? "bg-[var(--brand-primary)] text-[var(--brand-ink)] border-transparent"
                    : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span className="text-[10px]">{showQR ? "Hide QR" : "Scan QR"}</span>
              </button>
            )}
          </div>

          {/* Optional On-Screen UPI QR Code */}
          {showQR && creditorUpiId && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 text-center space-y-2">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
              </p>
              <div className="flex justify-center p-2 bg-white rounded-xl border border-[#D8C8B5] w-fit mx-auto">
                <QrCodeImage
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  size={176}
                  fallbackLabel="UPI QR unavailable"
                  fallbackValue={creditorUpiId}
                />
              </div>
              <p className="text-[11px] font-mono text-[var(--status-positive)] font-semibold">
                {creditorUpiId}
              </p>
            </div>
          )}

          {/* Formatted Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">
                WhatsApp Message Preview:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline font-medium"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 stroke-[2.5]" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy Text
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3.5 text-xs text-[var(--text-primary)] whitespace-pre-line font-sans leading-relaxed select-text">
              {messageText}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] flex gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--status-positive)] stroke-[2.5]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex-1 flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-xs font-semibold text-[var(--brand-ink)] transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

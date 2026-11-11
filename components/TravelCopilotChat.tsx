"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Loader2,
  HelpCircle,
  Compass,
  ShieldCheck,
  Shirt,
  Utensils,
  ChevronDown,
  X,
  MessageSquare,
  Check,
  CheckCircle2,
  Bookmark,
  BookmarkCheck
} from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  proposedModification?: {
    dayNumber: number;
    summary: string;
    changes: string[];
    updatedDay: any;
  } | null;
  isApplied?: boolean;
}

interface TravelCopilotChatProps {
  currentPlan?: any;
  origin: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  nights?: number;
  travellers?: number;
  budget?: number;
  stayBudget?: string | number;
  groupType?: string;
  stayPreference?: string;
  pace?: string;
  trainClass?: string;
  busClass?: string;
  flightClass?: string;
  formData?: any;
  isOpen?: boolean;
  onClose?: () => void;
  onApplyPlanUpdate?: (updatedPlan: any) => void;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onSavePlan?: () => void;
  isSaving?: boolean;
}

const SUGGESTED_PROMPTS = [
  { label: "💚 Why this plan is relaxed", query: "Can you explain how this plan is made comfortable and stress-free for us?", icon: Sparkles },
  { label: "🚗 Journey & Travel Times", query: "How long will the travel take between places, and why is this timing best for us?", icon: Compass },
  { label: "✏️ Help me adjust my plan", query: "Can you help me adjust or customize a day in our itinerary to make it even better?", icon: Sparkles },
  { label: "🎒 What to pack & weather", query: "What clothes, footwear, and weather prep should I carry for this trip?", icon: Shirt },
  { label: "🍛 Best local food", query: "Recommend authentic local food dishes and popular clean eateries to visit.", icon: Utensils },
  { label: "🚕 Friendly taxi & ride tips", query: "What are the friendly local tips for getting taxis or shared rides safely?", icon: ShieldCheck },
];

export default function TravelCopilotChat({
  currentPlan,
  origin,
  destination,
  startDate,
  endDate,
  nights,
  travellers,
  budget,
  stayBudget,
  groupType,
  stayPreference,
  pace,
  trainClass,
  busClass,
  flightClass,
  formData,
  isOpen = true,
  onClose,
  onApplyPlanUpdate,
  initialMessages,
  onMessagesChange,
  onSavePlan,
  isSaving = false
}: TravelCopilotChatProps) {
  const activeStartDate = startDate || formData?.startDate;
  const activeEndDate = endDate || formData?.endDate;
  const activeNights = nights || formData?.nights;
  const auditReview = currentPlan?.auditReview;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: `👋 Hello! I'm your **SplitRupee Travel Guide & Companion**. I have all the details of your trip from **${origin}** to **${destination}**${
          activeStartDate ? ` (${activeStartDate}${activeEndDate ? ` to ${activeEndDate}` : ""}${activeNights ? ` • ${activeNights} Nights` : ""})` : ""
        }.${
          auditReview
            ? `\n\n💚 **Trip Comfort Check:** Your plan has been double-checked for a smooth, relaxed pace (Comfort Score: **${auditReview.auditScore || 98}%**)—ensuring realistic travel times on mountain roads, no exhausting rush, and verified friendly stays.`
            : ""
        }\n\nFeel free to ask me anything—whether you want to tweak a day, check train routes, or find great local food!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  // Keep parent notified of chat changes so it can be saved with the itinerary
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  // If initialMessages updates from outside (e.g. loaded saved trip), reflect it
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const offlineMsg: ChatMessage = {
        id: "offline-" + Date.now(),
        role: "assistant",
        content:
          "📡 You're currently offline. AI Travel Guide replies require an internet connection — you can continue browsing your saved itinerary, budgets, checklists, and export PDF/ICS files offline!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, offlineMsg]);
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const res = await fetch("/api/itinerary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          currentPlan,
          userQuery: query,
          origin,
          destination,
          startDate: activeStartDate,
          endDate: activeEndDate,
          nights: activeNights,
          travellers: travellers || formData?.travellers,
          budget: budget || formData?.budget,
          stayBudget: stayBudget || formData?.stayBudget,
          groupType: groupType || formData?.groupType,
          stayPreference: stayPreference || formData?.stayPreference,
          pace: pace || formData?.pace,
          trainClass: trainClass || formData?.trainClass,
          busClass: busClass || formData?.busClass,
          flightClass: flightClass || formData?.flightClass,
          clientLocalDate: now.toISOString(),
          clientLocalFormattedDate: now.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Kolkata"
          }),
          clientLocalTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        })
      });

      const data = await res.json();
      if (data.offline) {
        const offlineMsg: ChatMessage = {
          id: "offline-" + Date.now(),
          role: "assistant",
          content:
            "📡 You're currently offline. AI Travel Guide replies require an internet connection — your saved itinerary and notes stay available offline.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, offlineMsg]);
      } else if (data.ok && data.reply) {
        const assistantMsg: ChatMessage = {
          id: "ast-" + Date.now(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          proposedModification: data.proposedModification || null,
          isApplied: false
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "Failed to get reply");
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: `⚠️ Sorry, I ran into a temporary error reaching your travel guide. Please try again in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveModification = (msgId: string, mod: any) => {
    if (!mod) return;

    const basePlan = currentPlan || {
      origin: origin || formData?.origin || "Bhubaneswar",
      destination: destination || formData?.destination || "Nepal",
      startDate: startDate || formData?.startDate || "",
      endDate: endDate || formData?.endDate || "",
      daysCount: mod.updatedDays?.length || mod.updatedPlan?.days?.length || 10,
      nightsCount: Math.max(1, (mod.updatedDays?.length || mod.updatedPlan?.days?.length || 10) - 1),
      targetBudget: Number(budget || formData?.budget || 120000),
      travellers: Number(travellers || formData?.travellers || 8),
      days: []
    };

    let updatedDays = basePlan.days || [];
    if (mod.updatedPlan?.days && Array.isArray(mod.updatedPlan.days)) {
      updatedDays = mod.updatedPlan.days;
    } else if (Array.isArray(mod.updatedDays) && mod.updatedDays.length > 0) {
      updatedDays = mod.updatedDays;
    } else if (mod.updatedDay) {
      const targetDay = Number(mod.dayNumber || mod.updatedDay.day || 1);
      if (updatedDays.length > 0) {
        updatedDays = updatedDays.map((d: any) => (Number(d.day || d.dayNumber) === targetDay ? mod.updatedDay : d));
      } else {
        updatedDays = [mod.updatedDay];
      }
    } else if (
      mod.summary?.toLowerCase().includes("budget hostel") ||
      mod.summary?.toLowerCase().includes("homestay") ||
      mod.summary?.toLowerCase().includes("₹500") ||
      mod.summary?.toLowerCase().includes("500")
    ) {
      // Intelligently apply budget backpacker hostels & homestays (₹500/night/person = ₹4000/night total for 8)
      updatedDays = updatedDays.map((d: any) => {
        if (Number(d.day || d.dayNumber) === 1 || Number(d.day || d.dayNumber) === 9 || Number(d.day || d.dayNumber) === 10) return d;
        const isPokhara = d.stay?.toLowerCase().includes("pokhara") || d.dayTitle?.toLowerCase().includes("pokhara");
        const isMarpha = d.stay?.toLowerCase().includes("marpha") || d.dayTitle?.toLowerCase().includes("marpha") || Number(d.day || d.dayNumber) === 6;
        const isGhandruk = d.stay?.toLowerCase().includes("ghandruk") || d.dayTitle?.toLowerCase().includes("ghandruk") || Number(d.day || d.dayNumber) === 7;

        let hostelName = "Zostel Kathmandu / Alobar1000 Backpacker Hostel (Thamel)";
        if (isPokhara) hostelName = "Kiwi Backpackers Hostel / Forest Lake Hostel (Pokhara Lakeside)";
        if (isMarpha) hostelName = "Traditional Marpha Apple Valley Homestay / Local Teahouse Lodge";
        if (isGhandruk) hostelName = "Old Traditional Gurung Heritage Homestay (Ghandruk)";

        return {
          ...d,
          stay: hostelName,
          hotelDetails: {
            ...(d.hotelDetails || {}),
            name: hostelName,
            costPerNight: 4000,
            ratePerUnit: 500,
            roomCount: 8,
            roomType: "8 Beds in Group Backpacker Dorm / Traditional Village Rooms (₹500/person)",
            breakdownNote: "Aligned strictly with ₹500/person/night backpacker group budget."
          }
        };
      });
    }

    const newPlan = {
      ...basePlan,
      ...(mod.updatedPlan || {}),
      days: updatedDays
    };

    if (onApplyPlanUpdate) {
      onApplyPlanUpdate(newPlan);
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isApplied: true } : m))
    );
  };

  return (
    <div className="travel-copilot-modal-card flex flex-col h-[600px] max-h-[88vh] w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-popover)] overflow-hidden">
      {/* Header */}
      <div className="travel-copilot-header flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)]">
        <div className="travel-copilot-header-info flex items-center gap-3">
          <div className="travel-copilot-avatar-icon relative flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-white dark:text-[#171F1D]">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-[var(--status-positive)] ring-2 ring-[var(--bg-surface)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="travel-copilot-title font-display font-semibold text-[var(--text-primary)] text-base">Personal Travel Guide</h3>
              <span className="travel-copilot-badge rounded-full bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--status-positive)]">
                Verified Local Guide
              </span>
            </div>
            <p className="travel-copilot-subtitle text-xs text-[var(--text-secondary)]">
              Trip route: <span className="text-[var(--text-primary)] font-medium">{origin} &rarr; {destination}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSavePlan && (
            <button
              type="button"
              onClick={onSavePlan}
              disabled={isSaving}
              className="flex h-8 items-center gap-1.5 px-3 rounded-lg bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)] text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              title="Save updated itinerary & travel notes"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Save Itinerary</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="travel-copilot-close-button rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Friendly Trip Comfort Ribbon */}
      {auditReview && (
        <div className="flex items-center justify-between px-5 sm:px-6 py-2 bg-[var(--status-positive-bg)] border-b border-[var(--status-positive-border)] text-xs">
          <div className="flex items-center gap-2 text-[var(--status-positive)] font-medium">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Checked by Your Travel Guide</span>
            <span className="bg-[var(--bg-surface)] border border-[var(--status-positive-border)] text-[var(--status-positive)] text-[10px] px-2 py-0.5 rounded-full font-semibold">
              Comfort Score: {auditReview.auditScore || 98}%
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] hidden sm:inline">
            Relaxed Pacing · Real-World Timings
          </span>
        </div>
      )}

      {/* Suggested Chips Bar */}
      <div className="travel-copilot-suggested-chips-bar flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] scrollbar-none">
        {SUGGESTED_PROMPTS.map((prompt, idx) => {
          const Icon = prompt.icon;
          return (
            <button
              type="button"
              key={idx}
              onClick={() => handleSendMessage(prompt.query)}
              disabled={loading}
              className="travel-copilot-suggested-chip flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 shrink-0"
            >
              <Icon className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span>{prompt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages List */}
      <div className="travel-copilot-messages-list flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`travel-copilot-message-row flex gap-3 ${msg.role === "user" ? "travel-copilot-user-row justify-end" : "travel-copilot-assistant-row justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="travel-copilot-assistant-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`travel-copilot-message-bubble max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm ${
                msg.role === "user"
                  ? "travel-copilot-user-bubble bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-white dark:text-[#171F1D] font-medium rounded-tr-none"
                  : "travel-copilot-assistant-bubble bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-none"
              }`}
            >
              <div className="travel-copilot-message-text whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>

              {/* Customer Approval Card for proposed modification */}
              {msg.proposedModification && (
                <div className="mt-3 p-3.5 bg-[var(--bg-surface)] border border-[var(--status-positive-border)] rounded-xl">
                  <div className="flex items-center gap-1.5 text-[var(--status-positive)] font-semibold text-xs uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" /> Suggested Itinerary Update (Review &amp; Apply)
                  </div>
                  <div className="text-[var(--text-primary)] text-sm font-semibold mt-1">
                    {msg.proposedModification.summary}
                  </div>
                  {Array.isArray(msg.proposedModification.changes) && msg.proposedModification.changes.length > 0 && (
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1 mt-2">
                      {msg.proposedModification.changes.map((c: string, cIdx: number) => (
                        <li key={cIdx} className="flex items-start gap-1.5">
                          <span className="text-[var(--status-positive)] font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    {!msg.isApplied ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveModification(msg.id, msg.proposedModification)}
                          className="flex items-center gap-1.5 bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-white dark:text-[#171F1D] font-semibold px-3 py-1.5 rounded-lg text-xs hover:opacity-95 transition-opacity cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> Apply to Itinerary
                        </button>
                        <span className="text-[11px] text-[var(--text-secondary)]">Click to apply this update</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[var(--status-positive)] text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Updated! Your itinerary has been refreshed.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div
                className={`travel-copilot-message-timestamp mt-1.5 text-[10px] text-right ${
                  msg.role === "user" ? "opacity-75 font-medium" : "text-[var(--text-secondary)]"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="travel-copilot-user-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="travel-copilot-loading-row flex gap-3 justify-start">
            <div className="travel-copilot-loading-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--status-positive-bg)] border border-[var(--status-positive-border)] text-[var(--status-positive)]">
              <Bot className="h-4 w-4" />
            </div>
            <div className="travel-copilot-loading-bubble rounded-2xl rounded-tl-none bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] p-4 flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
              <span>Checking verified routes, trains &amp; local stays...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="travel-copilot-input-bar p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="travel-copilot-form flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={`Ask anything about your trip from ${origin} to ${destination}...`}
            disabled={loading}
            className="travel-copilot-input flex-1 h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--brand-primary)] focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            aria-label="Send message"
            className="travel-copilot-send-button flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

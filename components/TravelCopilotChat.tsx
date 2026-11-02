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
  MessageSquare
} from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
  onClose
}: TravelCopilotChatProps) {
  const activeStartDate = startDate || formData?.startDate;
  const activeEndDate = endDate || formData?.endDate;
  const activeNights = nights || formData?.nights;
  const auditReview = currentPlan?.auditReview;

  const [messages, setMessages] = useState<ChatMessage[]>([
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
  ]);

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
      if (data.ok && data.reply) {
        const assistantMsg: ChatMessage = {
          id: "ast-" + Date.now(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "Failed to get reply");
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: `⚠️ Sorry, I ran into an error connecting to the AI engine. Please try again in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="travel-copilot-modal-card flex flex-col h-[600px] w-full rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="travel-copilot-header flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
        <div className="travel-copilot-header-info flex items-center gap-3">
          <div className="travel-copilot-avatar-icon relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="travel-copilot-title font-bold text-white text-base">SplitRupee Copilot</h3>
              <span className="travel-copilot-badge rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Live AI Grounded
              </span>
            </div>
            <p className="travel-copilot-subtitle text-xs text-slate-400">
              Trip context: <span className="text-white font-medium">{origin} → {destination}</span>
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="travel-copilot-close-button rounded-xl bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Friendly Trip Comfort Ribbon */}
      {auditReview && (
        <div className="flex items-center justify-between px-6 py-2 bg-gradient-to-r from-emerald-950/50 via-slate-900/60 to-teal-950/50 border-b border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Checked by Your Travel Guide</span>
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Comfort Score: {auditReview.auditScore || 98}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Relaxed Pacing • Real-World Timings
          </span>
        </div>
      )}

      {/* Suggested Chips Bar */}
      <div className="travel-copilot-suggested-chips-bar flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-white/5 bg-slate-950/30 scrollbar-none">
        {SUGGESTED_PROMPTS.map((prompt, idx) => {
          const Icon = prompt.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.query)}
              disabled={loading}
              className="travel-copilot-suggested-chip flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-emerald-400 transition disabled:opacity-50 shrink-0"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-400" />
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
              <div className="travel-copilot-assistant-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`travel-copilot-message-bubble max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm ${
                msg.role === "user"
                  ? "travel-copilot-user-bubble bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-medium rounded-tr-none shadow-lg shadow-emerald-500/10"
                  : "travel-copilot-assistant-bubble bg-slate-800/80 border border-white/10 text-slate-200 rounded-tl-none backdrop-blur-md"
              }`}
            >
              <div className="travel-copilot-message-text whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
              <div
                className={`travel-copilot-message-timestamp mt-1.5 text-[10px] text-right ${
                  msg.role === "user" ? "text-slate-900/70 font-semibold" : "text-slate-400"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="travel-copilot-user-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="travel-copilot-loading-row flex gap-3 justify-start">
            <div className="travel-copilot-loading-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="travel-copilot-loading-bubble rounded-2xl rounded-tl-none bg-slate-800/80 border border-white/10 p-4 backdrop-blur-md flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Analyzing live travel grounding data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="travel-copilot-input-bar p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
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
            placeholder={`Ask AI anything about your trip from ${origin} to ${destination}...`}
            disabled={loading}
            className="travel-copilot-input flex-1 rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="travel-copilot-send-button flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

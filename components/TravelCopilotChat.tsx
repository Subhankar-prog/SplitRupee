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
  currentPlan: any;
  origin: string;
  destination: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const SUGGESTED_PROMPTS = [
  { label: "Nathula / Border Permits", query: "What permits or documents do I need for Nathula Pass or Sikkim/Nepal border travel?", icon: Compass },
  { label: "Weather & Clothing Tips", query: "What clothes, footwear, and weather prep should I carry for this trip?", icon: Shirt },
  { label: "Local Food Spots", query: "Recommend authentic local food dishes and popular clean eateries to visit.", icon: Utensils },
  { label: "Taxi & Driver Safety", query: "What are the rules and guidelines for local taxi stands and shared 4WD jeeps?", icon: ShieldCheck },
];

export default function TravelCopilotChat({
  currentPlan,
  origin,
  destination,
  isOpen = true,
  onClose
}: TravelCopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Hello! I'm your **SplitRupee Travel Copilot**. I have full context of your verified blueprint from **${origin}** to **${destination}**.\n\nHow can I help you customize or plan your journey today?`,
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
      const res = await fetch("/api/itinerary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          currentPlan,
          userQuery: query,
          origin,
          destination
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
    <div className="flex flex-col h-[600px] w-full rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">SplitRupee Copilot</h3>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Live AI Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Trip context: <span className="text-white font-medium">{origin} → {destination}</span>
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggested Chips Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-white/5 bg-slate-950/30 scrollbar-none">
        {SUGGESTED_PROMPTS.map((prompt, idx) => {
          const Icon = prompt.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.query)}
              disabled={loading}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-emerald-400 transition disabled:opacity-50 shrink-0"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-400" />
              <span>{prompt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-medium rounded-tr-none shadow-lg shadow-emerald-500/10"
                  : "bg-slate-800/80 border border-white/10 text-slate-200 rounded-tl-none backdrop-blur-md"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
              <div
                className={`mt-1.5 text-[10px] text-right ${
                  msg.role === "user" ? "text-slate-900/70 font-semibold" : "text-slate-400"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-800/80 border border-white/10 p-4 backdrop-blur-md flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Analyzing live travel grounding data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={`Ask AI anything about your trip from ${origin} to ${destination}...`}
            disabled={loading}
            className="flex-1 rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

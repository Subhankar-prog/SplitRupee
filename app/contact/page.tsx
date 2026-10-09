"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Phone,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("support");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          We're here to help your group
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Have a question, feedback, or need help with a group split? Send us a note below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Side: Direct Contact Details (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
            <h3 className="text-sm font-bold text-white">Direct Support Channels</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">WhatsApp Support</p>
                  <p className="text-slate-400 text-[11px]">+91 98765 43210</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">Instant reply (10am - 8pm IST)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Email Us</p>
                  <p className="text-slate-400 text-[11px]">support@splitrupee.com</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Response within 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Knowledge Base</p>
                  <p className="text-slate-400 text-[11px]">Check our comprehensive FAQ</p>
                  <Link href="/faq" className="text-[11px] text-emerald-400 hover:underline">
                    View FAQ articles →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Message Form (7 cols) */}
        <div className="md:col-span-7">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
            {sent ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Message Received!</h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Thank you <span className="font-semibold text-white">{name}</span>. Our team will review your note and get back to <span className="font-semibold text-white">{email}</span> shortly.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setName("");
                    setEmail("");
                    setMessage("");
                  }}
                  className="mt-4 text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="aarav@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Topic
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="support">Help with a Group or Split</option>
                    <option value="feedback">Feature Suggestion & Feedback</option>
                    <option value="upi">UPI Settlement Inquiry</option>
                    <option value="business">Partnership / College Event</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what's on your mind..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

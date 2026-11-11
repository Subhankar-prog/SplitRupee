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
import ThemeSelect from "@/components/ThemeSelect";

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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3.5 py-1 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
          <MessageSquare className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          <span>Get in Touch</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          We&apos;re here to help your group
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Have a question, feedback, or need help with a group split? Send us a note below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Direct Contact Details (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-6 shadow-[var(--shadow-card)]">
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">Direct Support Channels</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[color:var(--border-subtle)] shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">WhatsApp Support</p>
                  <a 
                    href="https://wa.me/916372466462" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[var(--status-positive)] hover:underline text-[11px] font-mono"
                  >
                    +91 6372466462
                  </a>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Instant reply (10am - 8pm IST)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[color:var(--border-subtle)] shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Email Us</p>
                  <a 
                    href="mailto:pandasubhankar24@gmail.com" 
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] transition-colors"
                  >
                    pandasubhankar24@gmail.com
                  </a>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Response within 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-sand)]/15 text-[var(--status-warning)] border border-[color:var(--border-subtle)] shrink-0">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Knowledge Base</p>
                  <p className="text-[var(--text-secondary)] text-[11px]">Check our comprehensive FAQ</p>
                  <Link href="/faq" className="text-[11px] font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline">
                    View FAQ articles →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Message Form (7 cols) */}
        <div className="md:col-span-7">
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
            {sent ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="h-10 w-10 text-[var(--status-positive)] mx-auto" />
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">Message Received!</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                  Thank you <span className="font-medium text-[var(--text-primary)]">{name}</span>. Our team will review your note and get back to <span className="font-medium text-[var(--text-primary)]">{email}</span> shortly.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setName("");
                    setEmail("");
                    setMessage("");
                  }}
                  className="mt-4 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="aarav@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Topic
                  </label>
                  <ThemeSelect
                    value={topic}
                    onChange={(val) => setTopic(val)}
                    options={[
                      { value: "support", label: "Help with a Group or Split" },
                      { value: "feedback", label: "Feature Suggestion & Feedback" },
                      { value: "upi", label: "UPI Settlement Inquiry" },
                      { value: "business", label: "Partnership / College Event" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what's on your mind..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] py-3 text-xs font-medium text-white dark:text-[#171F1D] hover:opacity-95 transition-opacity"
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

"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
import ThemeSelect from "@/components/ThemeSelect";

const CONTACT_EMAIL = "pandasubhankar24@gmail.com";
const WHATSAPP_NUMBER = "916372466462";

const TOPIC_OPTIONS = [
  { value: "support", label: "Help with a Group or Split" },
  { value: "pro", label: "Request SplitRupee Pro Access" },
  { value: "feedback", label: "Feature Suggestion & Feedback" },
  { value: "upi", label: "UPI Settlement Inquiry" },
  { value: "business", label: "Partnership / College Event" },
];

function ContactContent() {
  const searchParams = useSearchParams();
  const initialTopicParam = searchParams.get("topic");
  const initialPlanParam = searchParams.get("plan");
  const resolvedInitialTopic = TOPIC_OPTIONS.some((o) => o.value === initialTopicParam)
    ? (initialTopicParam as string)
    : "support";
  const resolvedPlan =
    initialPlanParam === "monthly" || initialPlanParam === "yearly" ? initialPlanParam : "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState(resolvedInitialTopic);
  const [botcheck, setBotcheck] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (TOPIC_OPTIONS.some((o) => o.value === initialTopicParam)) {
      setTopic(initialTopicParam as string);
    }
  }, [initialTopicParam]);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmittedMessage("");

    if (trimmedName.length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!trimmedEmail || !emailValid) {
      setErrorMessage("Please enter a valid email address so we can reply.");
      return;
    }
    if (trimmedMessage.length < 10) {
      setErrorMessage("Please write a message of at least 10 characters.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          topic,
          plan: topic === "pro" ? resolvedPlan : "",
          message: trimmedMessage,
          botcheck,
        }),
      });

      let data: { ok?: boolean; message?: string; error?: string } | null = null;
      try {
        data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      } catch {
        data = null;
      }

      if (!res.ok || data?.ok !== true) {
        setErrorMessage(
          data?.message ||
            "Your message could not be delivered right now. Please try again or reach us directly via Email or WhatsApp."
        );
        return;
      }

      setSubmittedMessage(
        data.message || "Your message has been delivered. We will reply to your email soon."
      );
      setName("");
      setEmail("");
      setMessage("");
      setBotcheck("");
    } catch {
      setErrorMessage(
        "Network error while sending your message. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-10">
      <div className="space-y-3 max-w-2xl">
        <p className="text-sm font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">Contact SplitRupee</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Get in touch with our team
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
          Have a question about group splits, UPI links, or SplitRupee Pro access? Send us a direct message below or use WhatsApp or email.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-6 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
              Direct Support Channels
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[color:var(--border-subtle)] shrink-0">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">WhatsApp Support</p>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--status-positive)] hover:underline text-sm font-mono"
                  >
                    +91 6372466462
                  </a>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    Direct WhatsApp chat link
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border border-[color:var(--border-subtle)] shrink-0">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Email Us</p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors break-all"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    Direct founder &amp; product support inbox
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-gold-bg)] text-[var(--accent-gold-ink)] border border-[color:var(--border-subtle)] shrink-0">
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Knowledge Base</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-0.5">
                    Check answers for UPI, splits, and privacy
                  </p>
                  <Link
                    href="/faq"
                    className="text-xs sm:text-sm font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] hover:underline inline-flex min-h-[44px] sm:min-h-0 items-center mt-1"
                  >
                    View FAQ articles
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-5">
            {topic === "pro" && resolvedPlan && (
              <div className="rounded-xl border border-[var(--accent-gold-border)] bg-[var(--accent-gold-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--accent-gold-ink)] flex items-center justify-between gap-2">
                <span>
                  Selected Pro inquiry option:{" "}
                  <strong className="font-semibold">
                    {resolvedPlan === "yearly" ? "Yearly (₹499/year)" : "Monthly (₹49/month)"}
                  </strong>
                </span>
                <span className="text-[11px] font-mono">Confirmed before billing</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4 text-sm">
              {/* Honeypot field for automated spam filtering */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact-botcheck">Leave this field empty</label>
                <input
                  id="contact-botcheck"
                  name="botcheck"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={botcheck}
                  onChange={(e) => setBotcheck(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-1.5"
                  >
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    disabled={submitting}
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMessage("");
                    }}
                    className="w-full min-h-[44px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] disabled:opacity-60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    disabled={submitting}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                    }}
                    className="w-full min-h-[44px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <span
                  id="contact-topic-label"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-1.5"
                >
                  Topic
                </span>
                <ThemeSelect
                  id="contact-topic"
                  labelId="contact-topic-label"
                  value={topic}
                  onChange={(val) => {
                    setTopic(val);
                    setErrorMessage("");
                  }}
                  options={TOPIC_OPTIONS}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  disabled={submitting}
                  rows={4}
                  placeholder="Write your question, issue details, or SplitRupee account email for Pro access..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setErrorMessage("");
                  }}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-dark)] dark:focus-visible:ring-[var(--brand-primary)] leading-relaxed disabled:opacity-60"
                />
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-[var(--status-negative-border)] bg-[var(--status-negative-bg)] px-3 py-2.5 text-xs sm:text-sm font-medium text-[var(--status-negative)]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {submittedMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-2.5 rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] px-3.5 py-3 text-xs sm:text-sm font-medium text-[var(--status-positive)]"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Message Sent</p>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                      {submittedMessage}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] py-3 text-sm font-semibold text-[var(--brand-ink)] transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 text-sm text-[var(--text-secondary)]">
          Loading contact page...
        </div>
      }
    >
      <ContactContent />
    </Suspense>
  );
}

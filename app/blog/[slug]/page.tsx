import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Calculator, Home, Plane, QrCode } from "lucide-react";
import { BLOG_GUIDES, getBlogGuideBySlug } from "@/lib/blogGuides";

interface BlogArticlePageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return BLOG_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export function generateMetadata({ params }: BlogArticlePageProps): Metadata {
  const guide = getBlogGuideBySlug(params.slug);
  if (!guide) {
    return {
      title: "Guide Not Found | SplitRupee Blog",
      description: "The requested SplitRupee guide could not be found.",
    };
  }
  return {
    title: `${guide.title} | SplitRupee Blog`,
    description: guide.desc,
  };
}

export default function BlogArticlePage({ params }: BlogArticlePageProps) {
  const guide = getBlogGuideBySlug(params.slug);
  if (!guide) {
    notFound();
  }

  const Icon =
    guide.iconName === "plane"
      ? Plane
      : guide.iconName === "home"
        ? Home
        : QrCode;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-8">
      <div className="space-y-4">
        <Link
          href="/blog"
          className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to All Guides</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--status-positive)]">
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{guide.category}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{guide.date}</span>
          <span aria-hidden="true">·</span>
          <span>{guide.readTime}</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
          {guide.title}
        </h1>

        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
          {guide.intro}
        </p>
      </div>

      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-8">
        {guide.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
              {section.heading}
            </h2>
            {section.body.map((paragraph, idx) => (
              <p key={idx} className="text-sm sm:text-base text-[var(--text-secondary)] leading-7">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="space-y-2 pt-1 text-sm sm:text-base text-[var(--text-secondary)] list-disc pl-5">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="leading-7">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-display text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
            <span>Continue exploring SplitRupee</span>
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{guide.relatedTool.description}</p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            href={guide.relatedTool.href}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-4 text-sm font-semibold text-[var(--brand-ink)] transition-colors"
          >
            <Calculator className="h-4 w-4" aria-hidden="true" />
            <span>{guide.relatedTool.label}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}


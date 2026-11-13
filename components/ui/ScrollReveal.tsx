"use client";

import React from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

type SupportedTag = "div" | "section" | "article" | "aside" | "ul" | "li" | "main";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  stagger?: 1 | 2 | 3 | 4 | 5;
  delay?: number;
  className?: string;
  as?: SupportedTag;
}

export default function ScrollReveal({
  children,
  stagger,
  delay,
  className = "",
  as = "div",
  ...props
}: ScrollRevealProps) {
  const ref = useScrollReveal<HTMLDivElement>({ delay });
  const staggerClass = stagger ? `sr-stagger-${stagger}` : "";
  const combinedClass = `sr-scroll-reveal ${staggerClass} ${className}`.trim();

  const Tag = as as "div";

  return (
    <Tag ref={ref} className={combinedClass} {...props}>
      {children}
    </Tag>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/themeContext";

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export interface SelectOption {
  value: string;
  label: string;
}

interface ThemeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  name?: string;
  id?: string;
  labelId?: string;
  ariaLabel?: string;
  semanticName?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export default function ThemeSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  name,
  id,
  labelId,
  ariaLabel,
  semanticName,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false
}: ThemeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseSlug = toKebabCase(semanticName || name || placeholder || "select");

  // Normalize options into { value, label }
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption =
    normalizedOptions.find((opt) => opt.value === value) ||
    normalizedOptions.find((opt) => opt.label === value) ||
    normalizedOptions.find(
      (opt) =>
        value &&
        (opt.value.toLowerCase().startsWith(value.toLowerCase()) ||
          opt.label.toLowerCase().startsWith(value.toLowerCase()))
    );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      id={id}
      data-dropdown={baseSlug}
      className={`dropdown-container dropdown-wrapper ${baseSlug}-container ${baseSlug}-wrapper relative w-full ${isOpen ? "z-[100]" : "z-10"} ${className}`}
    >
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        id={id ? `${id}-trigger` : undefined}
        data-trigger={baseSlug}
        aria-labelledby={labelId}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`dropdown-trigger ${baseSlug}-dropdown ${baseSlug}-trigger w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left select-none outline-none border ${
          isOpen
            ? "border-[var(--brand-primary)] ring-2 ring-[var(--status-positive-bg)]"
            : "border-[var(--border-strong)] hover:border-[var(--brand-primary)]"
        } bg-[var(--bg-surface)] text-[var(--text-primary)] ${buttonClassName} ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className={`dropdown-value-text ${baseSlug}-value truncate text-[var(--text-primary)]`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`dropdown-chevron ${baseSlug}-chevron h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            data-menu={baseSlug}
            style={{ backgroundColor: "var(--bg-surface)", zIndex: 100 }}
            className={`dropdown-menu ${baseSlug}-menu absolute top-full left-0 w-full min-w-full sm:min-w-[240px] mt-1.5 z-[100] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-popover)] text-[var(--text-primary)] rounded-xl p-1.5 max-h-64 overflow-y-auto space-y-0.5 ${menuClassName}`}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              const optionSlug = toKebabCase(opt.label || opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-option={optionSlug}
                  data-value={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`dropdown-option ${baseSlug}-option ${baseSlug}-option-${optionSlug} w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[var(--status-positive-bg)] text-[var(--status-positive)] font-semibold border border-[var(--status-positive-border)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)]"
                  }`}
                >
                  <span className={`dropdown-option-label ${baseSlug}-option-label truncate pr-2`}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[var(--status-positive)] shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

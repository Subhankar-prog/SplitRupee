"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      className={`dropdown-container dropdown-wrapper ${baseSlug}-container ${baseSlug}-wrapper relative w-full ${isOpen ? "z-50" : "z-10"} ${className}`}
    >
      {name && <input type="hidden" name={name} value={value} />}

      <button
        type="button"
        id={id ? `${id}-trigger` : undefined}
        data-trigger={baseSlug}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`dropdown-trigger ${baseSlug}-dropdown ${baseSlug}-trigger w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition text-left select-none outline-none ${
          isOpen
            ? "bg-slate-950 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            : "bg-slate-950/70 border-white/10 hover:border-emerald-500/50 hover:bg-slate-900/80"
        } border ${
          buttonClassName.includes("text-") ? "" : "text-slate-200"
        } ${buttonClassName} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`dropdown-value-text ${baseSlug}-value truncate`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`dropdown-chevron ${baseSlug}-chevron h-3.5 w-3.5 text-emerald-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-300" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            data-menu={baseSlug}
            style={{ backgroundColor: "#08101b" }}
            className={`dropdown-menu ${baseSlug}-menu absolute top-full left-0 w-full min-w-full sm:min-w-[240px] mt-1.5 z-[100] bg-[#08101b] border border-emerald-500/40 rounded-xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.98)] max-h-64 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-emerald-500/30 ${menuClassName}`}
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
                  className={`dropdown-option ${baseSlug}-option ${baseSlug}-option-${optionSlug} w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/25 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm"
                      : "text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-200"
                  }`}
                >
                  <span className={`dropdown-option-label ${baseSlug}-option-label truncate pr-2`}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/userContext";
import {
  Plus,
  Menu,
  X,
  Calculator,
  Crown,
  LayoutDashboard,
  LogOut,
  KeyRound,
  Bell,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Clock,
  ChevronDown,
  ShieldCheck,
  QrCode,
  Check,
  Edit2,
  Plane,
} from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { currentUser, logout, refreshUsers } = useUser();
  const [showGlobalAddExpense, setShowGlobalAddExpense] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Quick UPI Edit in Profile Dropdown
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [upiInput, setUpiInput] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiSaved, setUpiSaved] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUpiInput(currentUser.upiId || "");
    }
  }, [currentUser]);

  async function handleSaveUpi() {
    if (!currentUser) return;
    setSavingUpi(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          upiId: upiInput.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshUsers();
        setUpiSaved(true);
        setTimeout(() => {
          setUpiSaved(false);
          setIsEditingUpi(false);
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to save UPI ID", err);
    } finally {
      setSavingUpi(false);
    }
  }

  // Live Clock & Date State
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  // Notification items
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "1",
      title: "New expense added",
      desc: "Aarav added Curlies Beach Shack Dinner ₹3,600",
      time: "10m ago",
      unread: true,
    },
    {
      id: "2",
      title: "Settlement received",
      desc: "Diya settled ₹1,200 via UPI (Google Pay)",
      time: "1h ago",
      unread: true,
    },
    {
      id: "3",
      title: "Group invited",
      desc: "You were added to Goa Beach Trip 🌴",
      time: "3h ago",
      unread: false,
    },
  ]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Clock Ticker Effect
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
      setCurrentTime(timeStr.replace(/:/g, " : "));
      setCurrentDate(dateStr);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Fullscreen toggle handler
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // Dynamic Time-of-Day Greeting
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  }

  const unreadCount = notifications.filter((n) => n.unread).length;
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/join");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-4 md:px-6">
          {/* ================= LEFT SECTION ================= */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Sidebar / Menu toggle — ONLY show on mobile screens (< md) */}
            {isAppRoute ? (
              <button
                onClick={onToggleSidebar}
                className="md:hidden grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition shrink-0"
                title="Toggle Sidebar"
                aria-label="Toggle navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
            ) : (
              /* Public pages: show hamburger only on mobile (< md) */
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 shrink-0"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}

            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
                <span className="text-base sm:text-lg">₹</span>
              </div>
              <div className="leading-tight hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white text-sm sm:text-base">
                    SplitRupee
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                    PRO
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block -mt-0.5 tracking-wider uppercase font-semibold">
                  Expense Mgmt
                </span>
              </div>
              {/* Show just "SR" brand mark on very small screens */}
              <span className="xs:hidden font-extrabold tracking-tight text-white text-base">SR</span>
            </Link>

            {/* Dynamic Greeting: Good Evening, Name (desktop only) */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-white/10 text-xs text-slate-300">
                <span>
                  {getGreeting()},{" "}
                  <span className="font-bold text-white">{currentUser.name.split(" ")[0]}</span>
                </span>
              </div>
            )}

            {/* Desktop Navigation Links for Public Pages */}
            {!isAppRoute && (
              <nav className="hidden md:flex items-center gap-1 ml-3 pl-3 border-l border-white/10 text-xs font-medium text-slate-300">
                <Link href="/#features" className="rounded-lg px-2.5 py-1.5 hover:text-white hover:bg-white/5 transition">
                  Features
                </Link>
                <Link href="/calculator" className="rounded-lg px-2.5 py-1.5 hover:text-white hover:bg-white/5 transition">
                  Calculator
                </Link>
                <Link href="/itinerary" className="rounded-lg px-2.5 py-1.5 hover:text-white hover:bg-white/5 transition flex items-center gap-1">
                  <Plane className="h-3 w-3 text-emerald-400" />
                  <span>Itinerary</span>
                </Link>
                <Link href="/pro" className="rounded-lg px-2.5 py-1.5 text-amber-400 hover:bg-white/5 transition">
                  Pro
                </Link>
                <Link href="/faq" className="rounded-lg px-2.5 py-1.5 hover:text-white hover:bg-white/5 transition">
                  FAQ
                </Link>
              </nav>
            )}
          </div>

          {/* ================= RIGHT SECTION ================= */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Clock Pill — only on large screens */}
            {currentTime && (
              <div className="hidden xl:flex items-center gap-2.5 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 shadow-sm">
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-500 text-slate-950">
                  <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <div className="leading-tight text-left">
                  <p className="font-bold font-mono text-white text-[11px] tracking-wider">
                    {currentTime}
                  </p>
                  <p className="text-[9px] text-indigo-300/80 font-medium">
                    {currentDate}
                  </p>
                </div>
              </div>
            )}

            {/* Fullscreen Toggle — hidden on small mobile */}
            <button
              onClick={toggleFullscreen}
              className="hidden md:grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Theme Toggle — hidden on mobile */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="hidden md:grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-amber-400 transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notification Bell */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 font-bold text-[9px] text-white shadow">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-white/15 bg-slate-900 p-4 shadow-2xl space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-emerald-400" /> Notifications
                      </h4>
                      <button
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, unread: false }))
                          )
                        }
                        className="text-[10px] text-emerald-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`rounded-xl p-2.5 text-xs transition ${
                            n.unread ? "bg-white/10 border border-emerald-500/30" : "bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-white text-[11px]">{n.title}</p>
                            <span className="text-[9px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">{n.desc}</p>
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/activity"
                      onClick={() => setNotificationsOpen(false)}
                      className="block text-center text-[11px] font-semibold text-emerald-400 hover:underline pt-1"
                    >
                      View Full Activity Feed →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Add Expense CTA Button — desktop only */}
            {currentUser && (
              <button
                onClick={() => setShowGlobalAddExpense(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 transition"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Add Expense</span>
                <span className="sm:inline md:hidden">Add</span>
              </button>
            )}

            {/* USER PROFILE PILL & DROPDOWN */}
            {currentUser ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-1 sm:p-1.5 sm:pr-2.5 text-left hover:border-emerald-500/40 hover:bg-white/10 transition shadow-sm"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl font-bold text-slate-950 text-xs shadow"
                      style={{ background: currentUser.avatarColor || "#10b981" }}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                  </div>

                  {/* Name — hidden on small mobile */}
                  <div className="hidden sm:block leading-tight text-left min-w-0">
                    <p className="font-bold text-white text-xs truncate max-w-[100px] sm:max-w-[120px]">
                      {currentUser.name.split(" ")[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Active
                    </p>
                  </div>

                  <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-slate-400 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 sm:w-64 rounded-2xl border border-white/15 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Header Box */}
                    <div className="rounded-xl bg-white/5 p-3 space-y-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-lg grid place-items-center text-xs font-bold text-slate-950 shrink-0"
                          style={{ background: currentUser.avatarColor || "#10b981" }}
                        >
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs truncate">
                            {currentUser.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {currentUser.email || currentUser.phone || "SplitRupee User"}
                          </p>
                        </div>
                      </div>

                      {/* Active UPI Address Card with Quick Edit */}
                      <div className="pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-400 flex items-center gap-1 font-medium">
                            <QrCode className="h-3 w-3 text-emerald-400" />
                            UPI Address:
                          </span>
                          {!isEditingUpi && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUpiInput(currentUser.upiId || "");
                                setIsEditingUpi(true);
                              }}
                              className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
                            >
                              {currentUser.upiId ? "Edit" : "+ Add UPI"}
                            </button>
                          )}
                        </div>

                        {isEditingUpi ? (
                          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={upiInput}
                              onChange={(e) => setUpiInput(e.target.value.toLowerCase().trim())}
                              placeholder="e.g. 9876543210@ybl"
                              className="w-full text-[11px] font-mono bg-slate-950 border border-emerald-500/60 rounded-lg px-2.5 py-1.5 text-white outline-none focus:ring-1 focus:ring-emerald-500"
                              autoFocus
                            />
                            {/* Quick handle suggestions */}
                            <div className="flex flex-wrap gap-1">
                              {["@ybl", "@paytm", "@okaxis", "@okhdfcbank"].map((h) => (
                                <button
                                  key={h}
                                  type="button"
                                  onClick={() => {
                                    const base = upiInput.includes("@")
                                      ? upiInput.split("@")[0]
                                      : upiInput || (currentUser.phone ? currentUser.phone.slice(-10) : currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, ""));
                                    setUpiInput(`${base}${h}`);
                                  }}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 hover:border-emerald-500 hover:text-white"
                                >
                                  {h}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-1.5 pt-0.5">
                              <button
                                onClick={handleSaveUpi}
                                disabled={savingUpi}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold py-1 rounded-md transition shadow flex items-center justify-center gap-1"
                              >
                                {savingUpi ? "Saving..." : upiSaved ? "Saved! ✓" : "Save UPI"}
                              </button>
                              <button
                                onClick={() => setIsEditingUpi(false)}
                                className="text-[10px] text-slate-400 px-2 py-1 rounded-md hover:bg-white/10 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-black/40 rounded-lg px-2 py-1.5 border border-white/5">
                            <span className="text-[11px] font-mono font-medium text-emerald-300 truncate">
                              {currentUser.upiId || (
                                <span className="text-slate-500 italic font-sans text-[10px]">
                                  No UPI linked yet
                                </span>
                              )}
                            </span>
                            {currentUser.upiId ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-1.5" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="space-y-0.5 text-xs">
                      {/* Mobile-only: Add Expense */}
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setShowGlobalAddExpense(true);
                        }}
                        className="sm:hidden w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-slate-200 hover:bg-white/10 transition text-left"
                      >
                        <Plus className="h-4 w-4 text-emerald-400" />
                        <span>Add Expense</span>
                      </button>

                      <Link
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-slate-200 hover:bg-white/10 transition"
                      >
                        <LayoutDashboard className="h-4 w-4 text-emerald-400" />
                        <span>My Dashboard</span>
                      </Link>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setShowChangePassword(true);
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-slate-200 hover:bg-white/10 transition text-left"
                      >
                        <KeyRound className="h-4 w-4 text-amber-400" />
                        <span>Change Password</span>
                      </button>

                      <Link
                        href="/pro"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-amber-400 hover:bg-white/10 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <Crown className="h-4 w-4" />
                          <span>SplitRupee Pro</span>
                        </div>
                        <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded font-bold">PRO</span>
                      </Link>

                      <div className="border-t border-white/10 my-1" />

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-rose-400 hover:bg-rose-500/10 transition text-left font-semibold"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Public / Logged Out Action Buttons */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="hidden sm:block rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}


          </div>
        </div>

        {/* Mobile Dropdown Menu — Public pages */}
        {mobileMenuOpen && !isAppRoute && (
          <div className="border-t border-white/10 bg-slate-950/98 px-4 py-4 space-y-1 backdrop-blur-xl">
            {currentTime && (
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5 text-xs text-indigo-300 mb-3">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Time</span>
                <span className="font-mono font-bold text-white">{currentTime}</span>
              </div>
            )}
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
            >
              Features
            </Link>
            <Link
              href="/calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
            >
              Bill & Tip Split Calculator
            </Link>
            <Link
              href="/itinerary"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition flex items-center gap-2"
            >
              <Plane className="h-4 w-4 text-emerald-400" />
              <span>AI Travel Itinerary</span>
            </Link>
            <Link
              href="/pro"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm text-amber-400 hover:bg-white/5 transition"
            >
              SplitRupee Pro
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
            >
              FAQ
            </Link>

            <div className="pt-3 border-t border-white/10 flex gap-2">
              {currentUser ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowChangePassword(true);
                    }}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-xs font-semibold text-white"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex-1 rounded-xl bg-rose-500/20 border border-rose-500/30 py-2.5 text-center text-xs font-bold text-rose-400"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-xs font-semibold text-white"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-center text-xs font-bold text-slate-950"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Add Expense Modal */}
      {showGlobalAddExpense && (
        <AddExpenseModal
          onClose={() => setShowGlobalAddExpense(false)}
          onSaved={() => {
            setShowGlobalAddExpense(false);
            window.dispatchEvent(new Event("splitrupee_refresh"));
          }}
        />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
}

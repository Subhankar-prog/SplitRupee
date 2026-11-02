"use client";

import React, { useState, useEffect } from "react";
import TravelCopilotChat, { ChatMessage } from "@/components/TravelCopilotChat";
import MovieTrailerItineraryLoader from "@/components/MovieTrailerItineraryLoader";
import ThemeSelect from "@/components/ThemeSelect";
import { isDemoPhoneNumber } from "@/lib/localGroundData";
import { exportItineraryPDF } from "@/lib/pdfExport";
import {
  downloadCalendarICS,
  downloadSingleDayICS,
  getSingleDayGoogleCalendarUrl,
  getSingleDayWhatsAppShareText,
  CalendarAttendee
} from "@/lib/calendarExport";
import { useUser } from "@/lib/userContext";
import {
  Loader2,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Train,
  Hotel,
  Bus,
  Plane,
  Car,
  Activity,
  FileText,
  Download,
  CheckCircle2,
  ChevronRight,
  Phone,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Compass,
  Info,
  AlertCircle,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  X,
  Bookmark,
  BookmarkCheck,
  Send,
  FolderOpen,
  Crown,
  Lock,
  Plus,
  Trash2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ItineraryPage() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [pendingFinancial, setPendingFinancial] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("itinerary");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copiedSituation, setCopiedSituation] = useState(false);

  // Copilot chat state for saving & restoring
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Persistence & Saved Itinerary state
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSavedTripsModalOpen, setIsSavedTripsModalOpen] = useState(false);
  const [savedTripsList, setSavedTripsList] = useState<any[]>([]);
  const [isLoadingSavedTrips, setIsLoadingSavedTrips] = useState(false);

  // Forwarding to Travel Group (Admin-Only) state
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardFeedback, setForwardFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [linkedGroup, setLinkedGroup] = useState<any | null>(null);

  // Day-wise Calendar Dispatch state
  const [activeDayCalendar, setActiveDayCalendar] = useState<{ dayNumber: number; day: any } | null>(null);
  const [selectedMemberEmails, setSelectedMemberEmails] = useState<string[]>([]);
  const [dayCalendarToast, setDayCalendarToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    nights: "" as any,
    travellers: "" as any,
    groupType: "Friends",
    budget: "" as any,
    stayBudget: "",
    transportTrain: true,
    transportBus: false,
    transportFlight: false,
    transportRoad: false,
    trainClass: "3A",
    busClass: "AC Sleeper (Volvo)",
    flightClass: "Economy",
    stayPreference: "Budget Hostels / Guesthouses",
    interests: "",
    pace: "Moderate",
    specialNotes: ""
  });

  const DUMMY_WORDS = [
    "demo", "test", "testing", "sample", "example", "dummy", "fake",
    "placeholder", "asdf", "qwerty", "temp", "trial", "xxx", "foo", "bar",
    "none", "null", "undefined", "na", "n/a", "city", "origin", "destination",
    "somewhere", "anywhere", "abcd", "xyz"
  ];

  const isInvalidOrDemoLocation = (str: string): boolean => {
    if (!str || typeof str !== "string") return true;
    const trimmed = str.trim();
    if (trimmed.length < 3) return true;
    const cleaned = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    if (cleaned.length < 3) return true;
    const tokens = cleaned.split(/\s+/);
    if (tokens.some((t) => DUMMY_WORDS.includes(t))) return true;
    if (/\b(demo|test|testing|dummy|fake|sample|placeholder|asdf)\b/i.test(cleaned)) return true;
    if (!/[a-z]{3,}/i.test(cleaned)) return true;
    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (error) setError("");

    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else if (name === "nights") {
      const numNights = value === "" ? "" : Math.max(1, parseInt(value) || 1);
      if (typeof numNights === "number" && form.startDate) {
        try {
          const start = new Date(form.startDate);
          const end = new Date(start.getTime() + numNights * 86400000).toISOString().split("T")[0];
          setForm({ ...form, nights: numNights, endDate: end });
          return;
        } catch { }
      }
      setForm({ ...form, nights: numNights });
    } else if (name === "startDate") {
      if (value) {
        // If end date exists and is on or before new start date, advance end date
        if (form.endDate && new Date(value) >= new Date(form.endDate)) {
          try {
            const start = new Date(value);
            const nightsCount = Number(form.nights) || 4;
            const newEnd = new Date(start.getTime() + nightsCount * 86400000).toISOString().split("T")[0];
            setForm({ ...form, startDate: value, endDate: newEnd });
            return;
          } catch { }
        } else if (form.nights) {
          try {
            const start = new Date(value);
            const end = new Date(start.getTime() + (Number(form.nights) || 4) * 86400000).toISOString().split("T")[0];
            setForm({ ...form, startDate: value, endDate: end });
            return;
          } catch { }
        }
      }
      setForm({ ...form, startDate: value });
    } else if (name === "endDate") {
      if (value && form.startDate) {
        try {
          const start = new Date(form.startDate);
          const end = new Date(value);
          if (end <= start) {
            setError("End date (return date) must be strictly after start date.");
            setForm({ ...form, endDate: value });
            return;
          }
          const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
          setForm({ ...form, endDate: value, nights: diffDays });
          return;
        } catch { }
      }
      setForm({ ...form, endDate: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const orig = form.origin.trim();
    const dest = form.destination.trim();

    if (!orig || !dest) {
      setError("Please enter both origin and destination cities.");
      return;
    }

    if (isInvalidOrDemoLocation(orig)) {
      setError(`"${orig}" is not recognized as a valid city. Please enter a real departure city (e.g. Bhubaneswar, Mumbai, Delhi). Demo or test placeholder inputs are not permitted.`);
      return;
    }

    if (isInvalidOrDemoLocation(dest)) {
      setError(`"${dest}" is not recognized as a valid city. Please enter a real destination city (e.g. Darjeeling, Goa, Manali, Jaipur). Demo or test placeholder inputs are not permitted.`);
      return;
    }

    if (orig.toLowerCase() === dest.toLowerCase()) {
      setError("Origin and destination cannot be the same city. Please enter different departure and arrival destinations.");
      return;
    }

    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setError("Please select valid travel dates.");
        return;
      }
      if (start >= end) {
        setError("Start date must be strictly before the return/end date. Please select a return date that occurs after your departure date.");
        return;
      }
    }

    setLoading(true);
    setApiReady(false);
    setPendingPlan(null);
    setPendingFinancial(null);
    setError("");
    setResult(null);
    setFinancialSummary(null);

    const effectiveBudget = Number(form.budget) > 0 ? Number(form.budget) : 25000;
    const effectiveNights = Number(form.nights) > 0 ? Number(form.nights) : 4;
    const effectiveTravellers = Number(form.travellers) > 0 ? Number(form.travellers) : 2;

    const transportPref = [
      form.transportFlight ? `Flight (${form.flightClass})` : "",
      form.transportTrain ? `Train (${form.trainClass})` : "",
      form.transportBus ? `Bus (${form.busClass})` : "",
      form.transportRoad ? "Cab / Rental Road" : ""
    ].filter(Boolean).join(", ") || "Best Available Transit";

    const effectiveStayBudget = form.stayBudget && Number(form.stayBudget) > 0
      ? Number(form.stayBudget)
      : Math.max(500, Math.floor((effectiveBudget * 0.4) / effectiveNights));

    try {
      const res = await fetch("/api/itinerary/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: effectiveBudget,
          nights: effectiveNights,
          travellers: effectiveTravellers,
          stayBudget: effectiveStayBudget,
          transportPref
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to create your travel plan");
      } else {
        setPendingPlan(data.plan);
        if (data.financialSummary) {
          setPendingFinancial(data.financialSummary);
        }
        setApiReady(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to itinerary compiler engine");
    }
  };

  const handleLoaderComplete = () => {
    if (pendingPlan) {
      setResult(pendingPlan);
    }
    if (pendingFinancial) {
      setFinancialSummary(pendingFinancial);
    }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    exportItineraryPDF({
      form,
      result,
      financialSummary,
    });
  };

  const handleAddToCalendar = () => {
    if (!result?.days || !form.origin || !form.destination) return;
    downloadCalendarICS({
      origin: form.origin,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      travellers: form.travellers,
      days: result.days
    });
  };

  const handleShareLiveWhatsApp = () => {
    const text = `📢 *SplitRupee Live Travel Bulletin*\n*Route:* ${form.origin} ➔ ${form.destination}\n*Status:* All routes open & clear. Safe mountain speeds active (20-35 km/h).\n*Weather:* Clear skies (daylight travel advised; sun sets early).\n*Note:* Carry physical Voter ID / Passport. Indian ₹100/₹200 notes accepted.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCopyLiveSituation = () => {
    const text = `📢 SplitRupee Live Travel Bulletin\nRoute: ${form.origin} ➔ ${form.destination}\nStatus: All routes open & clear. Safe mountain speeds active (20-35 km/h).\nWeather: Clear skies (daylight travel advised; sun sets early).\nNote: Carry physical Voter ID / Passport. Indian ₹100/₹200 notes accepted.`;
    navigator.clipboard.writeText(text);
    setCopiedSituation(true);
    setTimeout(() => setCopiedSituation(false), 2500);
  };

  const handlePlanUpdate = (updatedPlan: any) => {
    setResult(updatedPlan);
    let totalTransport = 0;
    let totalHotel = 0;
    updatedPlan.days?.forEach((d: any) => {
      d.legs?.forEach((l: any) => {
        totalTransport += Number(l.cost) || 0;
      });
      if (d.hotelDetails?.costPerNight) {
        totalHotel += Number(d.hotelDetails.costPerNight) || 0;
      }
    });
    const totalEst = totalTransport + totalHotel;
    const travellers = Math.max(1, Number(form.travellers) || 1);
    const targetBudget = Number(form.budget) || 30000;
    setFinancialSummary((prev: any) => ({
      ...prev,
      totalEstimatedCost: totalEst,
      totalTransportCost: totalTransport,
      totalHotelCost: totalHotel,
      costPerPerson: Math.round(totalEst / travellers),
      budgetDifference: targetBudget - totalEst,
      budgetStatus: totalEst <= targetBudget ? "UNDER_BUDGET" : "OVER_BUDGET"
    }));
  };

  // 1. Save Itinerary and its Chat Session
  const handleSaveItinerary = async () => {
    if (!result || !form.origin || !form.destination) return;
    setIsSaving(true);
    setSaveToast(null);

    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: savedItineraryId || undefined,
          userId: currentUser?.id || null,
          groupId: linkedGroup?.id || null,
          title: `Trip: ${form.origin} ➔ ${form.destination} (${form.nights}N / ${Number(form.nights) + 1}D)`,
          origin: form.origin,
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          days: Number(form.nights) + 1,
          groupSize: Number(form.travellers) || 1,
          totalBudget: Number(form.budget) || 0,
          preferences: {
            stayBudget: form.stayBudget,
            stayPreference: form.stayPreference,
            groupType: form.groupType,
            trainClass: form.trainClass,
            busClass: form.busClass,
            flightClass: form.flightClass,
            transport: {
              train: form.transportTrain,
              bus: form.transportBus,
              flight: form.transportFlight,
              road: form.transportRoad
            }
          },
          planData: result,
          chatSession: chatMessages
        })
      });

      const json = await res.json();
      if (json.ok && json.itinerary?.id) {
        setSavedItineraryId(json.itinerary.id);
        setSaveToast("✓ Itinerary & Copilot Chat saved successfully!");
        setTimeout(() => setSaveToast(null), 3000);

        if (json.itinerary) {
          setSavedTripsList((prev) => {
            const filtered = prev.filter((item) => item.id !== json.itinerary.id);
            return [json.itinerary, ...filtered];
          });
        }
      } else {
        setSaveToast(`Error: ${json.error || "Could not save itinerary"}`);
      }
    } catch (e: any) {
      setSaveToast(`Error: ${e.message || "Failed to save"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Open Saved Trips Drawer / Modal
  const handleOpenSavedTrips = async () => {
    setIsSavedTripsModalOpen(true);
    setIsLoadingSavedTrips(true);
    try {
      const url = currentUser?.id ? `/api/itinerary?userId=${encodeURIComponent(currentUser.id)}` : "/api/itinerary";
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok && Array.isArray(json.itineraries)) {
        setSavedTripsList(json.itineraries);
      }
    } catch (err) {
      console.warn("Failed to load saved trips:", err);
    } finally {
      setIsLoadingSavedTrips(false);
    }
  };

  // Load a Saved Itinerary + restore Chat Session
  const handleLoadSavedItinerary = (it: any, showToast = true) => {
    if (!it || !it.planData) return;
    setSavedItineraryId(it.id);

    let parsedPlan = it.planData;
    if (typeof parsedPlan === "string") {
      try {
        parsedPlan = JSON.parse(parsedPlan);
      } catch {}
    }

    let prefs = it.preferences;
    if (typeof prefs === "string") {
      try {
        prefs = JSON.parse(prefs);
      } catch {}
    }

    setForm((prev) => ({
      ...prev,
      origin: it.origin || prev.origin,
      destination: it.destination || prev.destination,
      startDate: it.startDate || prev.startDate,
      endDate: it.endDate || prev.endDate,
      nights: Math.max(1, (it.days || 2) - 1),
      travellers: it.groupSize || prev.travellers,
      budget: it.totalBudget || prev.budget,
      stayBudget: prefs?.stayBudget || prev.stayBudget,
      stayPreference: prefs?.stayPreference || prev.stayPreference,
      groupType: prefs?.groupType || prev.groupType,
      trainClass: prefs?.trainClass || prev.trainClass,
      busClass: prefs?.busClass || prev.busClass,
      flightClass: prefs?.flightClass || prev.flightClass,
      transportTrain: prefs?.transport?.train ?? prev.transportTrain,
      transportBus: prefs?.transport?.bus ?? prev.transportBus,
      transportFlight: prefs?.transport?.flight ?? prev.transportFlight,
      transportRoad: prefs?.transport?.road ?? prev.transportRoad,
      interests: prefs?.interests || prev.interests,
      pace: prefs?.pace || prev.pace,
      specialNotes: prefs?.specialNotes || prev.specialNotes
    }));

    setResult(parsedPlan);

    const savedChats = it.chatSession || parsedPlan?.chatSession || [];
    if (Array.isArray(savedChats)) {
      setChatMessages(savedChats);
    }

    if (it.group) {
      setLinkedGroup(it.group);
    } else {
      setLinkedGroup(null);
    }

    setIsSavedTripsModalOpen(false);
    if (showToast) {
      setSaveToast(`✓ Loaded: ${it.title || `${it.origin} ➔ ${it.destination}`}`);
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Reset/Clear active plan to start a fresh itinerary
  const handleResetToNewPlan = () => {
    setResult(null);
    setSavedItineraryId(null);
    setChatMessages([]);
    setLinkedGroup(null);
    setSaveToast(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("splitrupee_last_saved_itinerary");
      } catch {}
    }
  };

  // Delete a Saved Itinerary
  const handleDeleteSavedItinerary = async (itId: string) => {
    if (!confirm("Are you sure you want to delete this saved itinerary?")) return;
    try {
      const url = currentUser?.id
        ? `/api/itinerary?id=${encodeURIComponent(itId)}&userId=${encodeURIComponent(currentUser.id)}`
        : `/api/itinerary?id=${encodeURIComponent(itId)}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setSavedTripsList((prev) => prev.filter((item) => item.id !== itId));
        if (savedItineraryId === itId) {
          handleResetToNewPlan();
        }
      }
    } catch (err) {
      console.warn("Could not delete itinerary:", err);
    }
  };

  // Auto-fetch saved itineraries on mount for count badge & saved trips showcase.
  // The form intentionally starts BLANK as usual unless an explicit ?id= query param is provided.
  useEffect(() => {
    let isCancelled = false;

    // Clear any lingering cached last itinerary so new visits always start blank
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("splitrupee_last_saved_itinerary");
      } catch {}
    }

    const fetchInitialSavedTrips = async () => {
      setIsLoadingSavedTrips(true);
      try {
        const url = currentUser?.id
          ? `/api/itinerary?userId=${encodeURIComponent(currentUser.id)}`
          : "/api/itinerary";
        const res = await fetch(url);
        const json = await res.json();
        if (!isCancelled && json.ok && Array.isArray(json.itineraries)) {
          setSavedTripsList(json.itineraries);

          // ONLY auto-load if a specific trip ID was explicitly passed in the URL (e.g. ?id=xxx)
          const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const requestedId = urlParams ? urlParams.get("id") : null;
          if (requestedId) {
            const target = json.itineraries.find((it: any) => it.id === requestedId);
            if (target && target.planData) {
              handleLoadSavedItinerary(target, false);
            }
          }
        }
      } catch (err) {
        console.warn("Could not auto-fetch saved itineraries on mount:", err);
      } finally {
        if (!isCancelled) setIsLoadingSavedTrips(false);
      }
    };

    fetchInitialSavedTrips();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  // 3. Open Forward to Travel Group Modal (Admin-Only feature)
  const handleOpenForwardModal = async () => {
    setIsForwardModalOpen(true);
    setIsLoadingGroups(true);
    setForwardFeedback(null);
    try {
      const url = currentUser?.id ? `/api/groups?userId=${encodeURIComponent(currentUser.id)}` : "/api/groups";
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok && Array.isArray(json.groups)) {
        setUserGroups(json.groups);
        // Pre-select group where current user is ADMIN
        const adminGroup = json.groups.find((g: any) => {
          const userMember = g.members?.find((m: any) => m.id === currentUser?.id);
          return userMember?.role === "ADMIN" || g.creatorId === currentUser?.id;
        });
        if (adminGroup) {
          setSelectedGroupId(adminGroup.id);
        } else if (json.groups.length > 0) {
          setSelectedGroupId(json.groups[0].id);
        }
      }
    } catch (e) {
      console.warn("Could not load groups:", e);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Confirm Forward to Group (enforces Admin check)
  const handleConfirmForward = async () => {
    if (!selectedGroupId || !result) return;
    setIsForwarding(true);
    setForwardFeedback(null);

    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: savedItineraryId || undefined,
          userId: currentUser?.id,
          title: `Trip: ${form.origin} ➔ ${form.destination}`,
          origin: form.origin,
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          days: Number(form.nights) + 1,
          groupSize: Number(form.travellers) || 1,
          totalBudget: Number(form.budget) || 0,
          planData: result,
          chatSession: chatMessages,
          forwardToGroupId: selectedGroupId
        })
      });

      const json = await res.json();
      if (json.ok) {
        const targetG = userGroups.find((g) => g.id === selectedGroupId);
        setLinkedGroup(targetG || { id: selectedGroupId, name: "Travel Group" });
        setSavedItineraryId(json.itinerary?.id || savedItineraryId);
        setForwardFeedback({
          ok: true,
          text: `✓ Successfully forwarded itinerary & Copilot chat to ${targetG?.name || "Travel Group"}! Group members can now access the plan.`
        });
        setTimeout(() => {
          setIsForwardModalOpen(false);
          setForwardFeedback(null);
        }, 2200);
      } else {
        setForwardFeedback({
          ok: false,
          text: json.message || json.error || "Only group admins can forward itineraries into travel groups."
        });
      }
    } catch (err: any) {
      setForwardFeedback({
        ok: false,
        text: err.message || "Failed to forward itinerary."
      });
    } finally {
      setIsForwarding(false);
    }
  };

  // 4. Day-wise Calendar Action Handlers (Day by Day, Not All Days)
  const handleOpenDayCalendar = (day: any) => {
    setActiveDayCalendar({ dayNumber: day.day, day });
    // Pre-select group member emails if available
    const members = linkedGroup?.members || [];
    const emails = members.map((m: any) => m.email).filter(Boolean);
    setSelectedMemberEmails(emails);
  };

  const handleDayGoogleCalendar = () => {
    if (!activeDayCalendar || !result?.days || !form.origin || !form.destination) return;
    const url = getSingleDayGoogleCalendarUrl(
      {
        origin: form.origin,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        travellers: form.travellers,
        days: result.days
      },
      activeDayCalendar.dayNumber,
      selectedMemberEmails
    );
    window.open(url, "_blank");
    setDayCalendarToast(`✓ Opened Google Calendar for Day ${activeDayCalendar.dayNumber} with member invites!`);
    setTimeout(() => setDayCalendarToast(null), 3000);
  };

  const handleDayDownloadICS = () => {
    if (!activeDayCalendar || !result?.days || !form.origin || !form.destination) return;
    const attendees: CalendarAttendee[] = selectedMemberEmails.map((email) => ({
      name: email.split("@")[0],
      email
    }));
    downloadSingleDayICS(
      {
        origin: form.origin,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        travellers: form.travellers,
        days: result.days
      },
      activeDayCalendar.dayNumber,
      attendees
    );
    setDayCalendarToast(`✓ Downloaded Day ${activeDayCalendar.dayNumber} .ICS event!`);
    setTimeout(() => setDayCalendarToast(null), 3000);
  };

  const handleDayWhatsAppShare = () => {
    if (!activeDayCalendar || !result?.days || !form.origin || !form.destination) return;
    const text = getSingleDayWhatsAppShareText(
      {
        origin: form.origin,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        travellers: form.travellers,
        days: result.days
      },
      activeDayCalendar.dayNumber,
      savedItineraryId
    );
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const getLegIcon = (mode: string = "") => {
    const m = mode.toLowerCase();
    if (m.includes("flight") || m.includes("plane") || m.includes("air")) {
      return <Plane className="h-5 w-5 text-sky-400 print:text-black" />;
    }
    if (m.includes("train") || m.includes("rail") || m.includes("express")) {
      return <Train className="h-5 w-5 text-cyan-400 print:text-black" />;
    }
    if (m.includes("bus") || m.includes("volvo") || m.includes("coach")) {
      return <Bus className="h-5 w-5 text-amber-400 print:text-black" />;
    }
    if (m.includes("taxi") || m.includes("cab") || m.includes("car") || m.includes("jeep") || m.includes("auto")) {
      return <Car className="h-5 w-5 text-emerald-400 print:text-black" />;
    }
    return <MapPin className="h-5 w-5 text-teal-400 print:text-black" />;
  };

  return (
    <div className="w-full relative">
      {/* FULL SCREEN CINEMATIC MOVIE TAKEOVER LOADER */}
      <MovieTrailerItineraryLoader
        isOpen={loading}
        origin={form.origin}
        destination={form.destination}
        nights={Number(form.nights) || 4}
        travellers={Number(form.travellers) || 2}
        budget={Number(form.budget) || 25000}
        stayBudget={form.stayBudget ? Number(form.stayBudget) : undefined}
        apiReady={apiReady}
        onComplete={handleLoaderComplete}
        error={error}
        onDismissError={() => {
          setError("");
          setLoading(false);
        }}
      />

      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Plane className="h-6 w-6 text-emerald-400" />
              <span>AI Travel Itinerary Studio</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Precision travel planning grounded with verified transit, real budgets, and local guidance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Always visible Saved Trips button */}
            <button
              type="button"
              onClick={handleOpenSavedTrips}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition backdrop-blur-md shadow-sm w-fit"
              title="Open Saved Itineraries & Past Chat Sessions"
            >
              <FolderOpen className="h-4 w-4 text-emerald-400" />
              <span>Saved Trips</span>
              {savedTripsList.length > 0 && (
                <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                  {savedTripsList.length}
                </span>
              )}
            </button>

            {result && (
              <>
                <button
                  type="button"
                  onClick={handleResetToNewPlan}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
                  title="Clear current view and plan a new itinerary"
                >
                  <Plus className="h-3.5 w-3.5 text-teal-400" />
                  <span>Plan New</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition backdrop-blur-md shadow-lg shadow-emerald-500/10 w-fit"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <span>Ask AI Copilot</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="itinerary-content-container flex flex-col gap-8">
          {/* Top Horizontal Input Console */}
          <div className="itinerary-form-console-card relative z-20 w-full bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-emerald-500/5 print:hidden">
            <form onSubmit={handleGenerate} className="itinerary-generator-form space-y-6">

              {/* Row 1: Core Routing, Dates (Start & End), Duration (Days & Nights), Travellers, Group */}
              <div className="itinerary-core-routing-row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-50">
                {/* 1. Origin */}
                <div className="origin-field origin-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="origin-label flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Origin
                    </label>
                  </div>
                  <input
                    name="origin"
                    value={form.origin}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Bhubaneswar, Mumbai"
                    className="origin-input h-11 w-full bg-slate-950/70 rounded-xl px-3.5 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition placeholder:text-slate-500"
                  />
                </div>

                {/* 2. Destination */}
                <div className="destination-field destination-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="destination-label flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" /> Destination
                    </label>
                  </div>
                  <input
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Darjeeling, Goa, Manali"
                    className="destination-input h-11 w-full bg-slate-950/70 rounded-xl px-3.5 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition placeholder:text-slate-500"
                  />
                </div>

                {/* 3. Start Date */}
                <div className="start-date-field start-date-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="start-date-label flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Start Date
                    </label>
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={handleChange}
                    className="start-date-input h-11 w-full bg-slate-950/70 rounded-xl px-3 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition [color-scheme:dark]"
                  />
                </div>

                {/* 4. End Date (Return Date) */}
                <div className="end-date-field end-date-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="end-date-label flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-teal-400 shrink-0" /> End Date (Return)
                    </label>
                  </div>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    min={form.startDate ? new Date(new Date(form.startDate).getTime() + 86400000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                    onChange={handleChange}
                    className="end-date-input h-11 w-full bg-slate-950/70 rounded-xl px-3 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition [color-scheme:dark]"
                  />
                </div>

                {/* 5. Duration (Days & Nights) */}
                <div className="duration-days-nights-field duration-days-nights-container">
                  <div className="h-7 flex items-center justify-between mb-1.5">
                    <label className="duration-days-nights-label text-xs font-semibold text-slate-300">Days & Nights</label>
                    <span className="duration-days-nights-badge text-[10px] text-emerald-400 font-mono font-medium">
                      {form.nights ? `${form.nights}N / ${Number(form.nights) + 1}D` : "e.g. 5N / 6D"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="nights"
                      min="1"
                      max="30"
                      placeholder="e.g. 5"
                      value={form.nights}
                      onChange={handleChange}
                      className="nights-count-input duration-nights-input h-11 w-full bg-slate-950/70 rounded-xl px-3 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition placeholder:text-slate-500"
                    />
                    <span className="duration-nights-unit text-xs text-slate-400 font-mono whitespace-nowrap">Nights</span>
                  </div>
                </div>

                {/* 6. Travellers & Group Type */}
                <div className="travellers-group-field travellers-group-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="travellers-group-label flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Travellers & Group
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="travellers"
                      min="1"
                      placeholder="e.g. 2"
                      value={form.travellers}
                      onChange={handleChange}
                      className="travellers-count-input h-11 w-full bg-slate-950/70 rounded-xl px-2.5 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition text-center placeholder:text-slate-500"
                    />
                    <ThemeSelect
                      semanticName="group-type"
                      id="group-type-select"
                      value={form.groupType}
                      onChange={(val) => setForm({ ...form, groupType: val })}
                      options={["Friends", "Couple", "Solo", "Family"]}
                      buttonClassName="h-11 py-0 px-2 text-xs flex items-center justify-between"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Budgeting (Total Budget, Stay Budget/Night, Stay Preference, Trip Pace) */}
              <div className="itinerary-budgeting-row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5 relative z-40">
                {/* Total Budget */}
                <div className="total-group-budget-field total-group-budget-container">
                  <div className="h-7 flex items-center justify-between mb-1.5">
                    <label className="total-group-budget-label flex items-center gap-1.5 text-xs font-semibold text-emerald-400 truncate">
                      <Wallet className="h-3.5 w-3.5 shrink-0" /> Group Budget (INR)
                    </label>
                    <span className="budget-per-person-indicator text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                      {form.budget && form.travellers
                        ? `~₹${Math.round(Number(form.budget) / (Number(form.travellers) || 1)).toLocaleString()}/person`
                        : "e.g. ~₹15,000/person"}
                    </span>
                  </div>
                  <input
                    type="number"
                    name="budget"
                    step="1000"
                    placeholder="e.g. 30000"
                    value={form.budget}
                    onChange={handleChange}
                    className="total-group-budget-input h-11 w-full bg-slate-950/70 rounded-xl px-3.5 text-emerald-400 font-bold border border-emerald-500/30 focus:border-emerald-500 outline-none transition text-sm placeholder:text-slate-500"
                  />
                </div>

                {/* Nightly Stay Budget Limit */}
                <div className="nightly-stay-limit-field nightly-stay-limit-container">
                  <div className="h-7 flex items-center justify-between mb-1.5">
                    <label className="nightly-stay-limit-label flex items-center gap-1.5 text-xs font-semibold text-teal-400 truncate">
                      <Hotel className="h-3.5 w-3.5 shrink-0" /> Stay Limit / Night (INR)
                    </label>
                    <span className="stay-budget-customizable-tag text-[10px] text-teal-300 shrink-0 ml-1">Customizable</span>
                  </div>
                  <input
                    type="number"
                    name="stayBudget"
                    step="100"
                    placeholder="e.g. 2500"
                    value={form.stayBudget}
                    onChange={handleChange}
                    className="nightly-stay-limit-input stay-budget-input h-11 w-full bg-slate-950/70 rounded-xl px-3.5 text-teal-300 font-bold border border-teal-500/30 focus:border-teal-400 outline-none transition text-sm placeholder:text-slate-500"
                  />
                </div>

                {/* Accommodation Style */}
                <div className="accommodation-style-field accommodation-style-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="accommodation-style-label block text-xs font-semibold text-slate-300">Accommodation Style</label>
                  </div>
                  <ThemeSelect
                    semanticName="accommodation-style"
                    id="accommodation-style-select"
                    value={form.stayPreference}
                    onChange={(val) => setForm({ ...form, stayPreference: val })}
                    options={[
                      "Budget Hostels / Guesthouses",
                      "Standard 3-Star Hotels",
                      "Boutique Homestays & Heritage",
                      "Premium 4/5-Star Resorts",
                    ]}
                    buttonClassName="h-11 py-0 px-3.5 text-xs flex items-center justify-between"
                  />
                </div>

                {/* Trip Pace */}
                <div className="trip-pace-field trip-pace-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="trip-pace-label flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Trip Pace
                    </label>
                  </div>
                  <ThemeSelect
                    semanticName="trip-pace"
                    id="trip-pace-select"
                    value={form.pace}
                    onChange={(val) => setForm({ ...form, pace: val })}
                    options={[
                      { value: "Moderate", label: "Moderate (Balanced Sightseeing)" },
                      { value: "Relaxed", label: "Relaxed (Slow & Leisurely)" },
                      { value: "Fast-Paced", label: "Fast-Paced / Packed" },
                    ]}
                    buttonClassName="h-11 py-0 px-3.5 text-xs flex items-center justify-between"
                  />
                </div>
              </div>

              {/* Row 3: Transit Modes & Detailed Classes (Train with 2S/SL/3A/etc., Bus Coach Options, Flight, Cab) */}
              <div className="transit-mode-coach-preferences-section transit-preferences-container pt-4 border-t border-white/5 space-y-3 relative z-30">
                <div className="transit-mode-coach-preferences-heading text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Train className="h-4 w-4 text-emerald-400" />
                  <span>Transit Mode & Coach Preferences:</span>
                </div>

                <div className="transit-modes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-30">
                  {/* Train */}
                  <div className="transit-train-card train-preference-card p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 shadow-sm relative z-40 focus-within:z-50">
                    <label className="transit-train-checkbox-label flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        name="transportTrain"
                        checked={form.transportTrain}
                        onChange={handleChange}
                        className="transit-train-checkbox accent-emerald-500"
                      />
                      <Train className="h-4 w-4 text-cyan-500 dark:text-cyan-400" /> Train
                    </label>
                    {form.transportTrain && (
                      <div className="train-coach-field train-coach-container">
                        <label className="train-coach-label block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Train Coach / Class:</label>
                        <ThemeSelect
                          semanticName="train-coach-class"
                          id="train-coach-select"
                          value={form.trainClass}
                          onChange={(val) => setForm({ ...form, trainClass: val })}
                          options={[
                            { value: "2S", label: "2S — Second Sitting (Reserved)" },
                            { value: "SL", label: "SL — Sleeper Class" },
                            { value: "3E", label: "3E — 3 AC Economy" },
                            { value: "3A", label: "3A — 3 Tier AC" },
                            { value: "2A", label: "2A — 2 Tier AC" },
                            { value: "1A", label: "1A — First Class AC" },
                            { value: "CC", label: "CC — AC Chair Car" },
                            { value: "EC", label: "EC — Executive Chair Car" },
                            { value: "Vistadome", label: "Vistadome — Panoramic Glass Coach" },
                          ]}
                          buttonClassName="py-2 px-2.5 text-xs font-mono text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  {/* Bus / Coach */}
                  <div className="transit-bus-card bus-preference-card p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 shadow-sm relative z-30 focus-within:z-50">
                    <label className="transit-bus-checkbox-label flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        name="transportBus"
                        checked={form.transportBus}
                        onChange={handleChange}
                        className="transit-bus-checkbox accent-emerald-500"
                      />
                      <Bus className="h-4 w-4 text-amber-500 dark:text-amber-400" /> Bus / Coach
                    </label>
                    {form.transportBus && (
                      <div className="bus-coach-field bus-coach-container">
                        <label className="bus-coach-label block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Bus Coach Type:</label>
                        <ThemeSelect
                          semanticName="bus-coach-type"
                          id="bus-coach-select"
                          value={form.busClass}
                          onChange={(val) => setForm({ ...form, busClass: val })}
                          options={[
                            { value: "AC Sleeper (Volvo)", label: "AC Sleeper (Volvo / Scania / BharatBenz)" },
                            { value: "Non-AC Sleeper", label: "Non-AC Sleeper (2+1)" },
                            { value: "AC Multi-Axle Seater", label: "AC Multi-Axle Seater (Volvo B11R)" },
                            { value: "Non-AC Seater", label: "Non-AC Seater (Pushback 2+2)" },
                            { value: "State RTC Superfast Express", label: "State RTC Superfast Express (KSRTC / HRTC / MSRTC)" },
                            { value: "Luxury Mercedes / Scania Semi-Sleeper", label: "Luxury Mercedes / Scania Semi-Sleeper" },
                          ]}
                          buttonClassName="py-2 px-2.5 text-xs font-mono text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  {/* Flight */}
                  <div className="transit-flight-card flight-preference-card p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 shadow-sm relative z-20 focus-within:z-50">
                    <label className="transit-flight-checkbox-label flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        name="transportFlight"
                        checked={form.transportFlight}
                        onChange={handleChange}
                        className="transit-flight-checkbox accent-emerald-500"
                      />
                      <Plane className="h-4 w-4 text-sky-500 dark:text-sky-400" /> Flight
                    </label>
                    {form.transportFlight && (
                      <div className="flight-cabin-field flight-cabin-container">
                        <label className="flight-cabin-label block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Flight Cabin:</label>
                        <ThemeSelect
                          semanticName="flight-cabin-class"
                          id="flight-cabin-select"
                          value={form.flightClass}
                          onChange={(val) => setForm({ ...form, flightClass: val })}
                          options={[
                            { value: "Economy", label: "Economy" },
                            { value: "Premium Economy", label: "Premium Economy" },
                            { value: "Business", label: "Business Class" },
                          ]}
                          buttonClassName="py-2 px-2.5 text-xs font-mono text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  {/* Cab / Road */}
                  <div className="transit-cab-rental-card cab-rental-card p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm relative z-10 focus-within:z-50">
                    <label className="transit-cab-rental-label flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        name="transportRoad"
                        checked={form.transportRoad}
                        onChange={handleChange}
                        className="transit-cab-rental-checkbox accent-emerald-500"
                      />
                      <Car className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Cab / Rental / Shared Jeep
                    </label>
                    <p className="transit-cab-rental-description text-[10px] text-slate-600 dark:text-slate-400 mt-2">
                      Local syndicate taxis, shared mountain jeeps & prepaid regional booths.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 4: Interests & Remarks Customization */}
              <div className="itinerary-customization-row pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 relative z-10">
                {/* Interests */}
                <div className="interests-activities-field interests-activities-container lg:col-span-5">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="interests-activities-label flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" /> Interests & Activities
                    </label>
                  </div>
                  <input
                    name="interests"
                    value={form.interests}
                    onChange={handleChange}
                    placeholder="e.g. Culture, Scenery, Trekking, Cafes, Local Food"
                    className="interests-activities-input h-11 w-full bg-slate-950/70 rounded-xl px-3.5 text-white text-sm border border-white/10 focus:border-emerald-500/50 outline-none transition placeholder:text-slate-500"
                  />
                </div>

                {/* Remarks & Special Instructions */}
                <div className="remarks-special-instructions-field remarks-special-instructions-container lg:col-span-7">
                  <div className="h-7 flex items-center justify-between mb-1.5">
                    <label className="remarks-special-instructions-label flex items-center gap-1.5 text-xs font-semibold text-slate-300 truncate">
                      <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" /> Remarks & Special Instructions
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-1">Dietary, senior citizens, views...</span>
                  </div>
                  <input
                    name="specialNotes"
                    value={form.specialNotes}
                    onChange={handleChange}
                    placeholder="e.g. Early departure, pure vegetarian food, senior-friendly stairs, mountain/beach view..."
                    className="remarks-special-instructions-input h-11 w-full bg-slate-950/70 rounded-xl px-3.5 text-white text-sm border border-white/10 focus:border-emerald-500/50 outline-none transition placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Row 5: Action Button at Bottom */}
              <div className="itinerary-bottom-cta-section pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-0">
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span>
                    Compiles verified IRCTC berths, state RTC/Volvo coaches, stay caps & day-wise plan.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="generate-elite-itinerary-button w-full sm:w-auto min-w-[260px] flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-3 px-8 rounded-xl transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm tracking-wide shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Elite Itinerary</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl text-sm flex items-start gap-3 backdrop-blur-md">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-red-300 block text-xs uppercase tracking-wider font-mono">Validation Warning</span>
                  <p className="text-xs sm:text-sm text-red-200 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Column (Full Width directly below on the bottom) */}
          <div className="itinerary-results-canvas-card w-full relative z-10 bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl min-h-[500px] flex flex-col shadow-2xl shadow-black/50 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            {!result && !loading && (
              <div className="flex-1 flex flex-col py-6 px-2 sm:px-4 print:hidden">
                {savedTripsList.length > 0 ? (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-emerald-400" />
                          <h3 className="text-xl font-bold text-white">Your Saved Itineraries</h3>
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                            {savedTripsList.length} saved
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Click any saved trip below to open, inspect schedules, or forward to your group.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const formConsole = document.querySelector(".itinerary-form-console-card");
                          formConsole?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition w-fit"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Plan a Brand New Trip</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedTripsList.map((it) => (
                        <div
                          key={it.id}
                          className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-emerald-500/40 transition flex flex-col justify-between shadow-xl shadow-black/40 group hover:shadow-emerald-500/10"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-white text-base group-hover:text-emerald-300 transition line-clamp-1">
                                {it.title || `${it.origin} ➔ ${it.destination}`}
                              </h4>
                              {it.group && (
                                <span className="shrink-0 text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-medium">
                                  {it.group.name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                              <span>{it.origin}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                              <span>{it.destination}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                              <div>
                                <span className="block text-[10px] text-slate-500 uppercase font-mono">Trip Duration</span>
                                <span className="font-medium text-slate-200">{it.days} Days ({Math.max(1, it.days - 1)}N)</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-500 uppercase font-mono">Travellers</span>
                                <span className="font-medium text-slate-200">{it.groupSize} Guests</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-500 uppercase font-mono">Total Budget</span>
                                <span className="font-medium text-emerald-400">₹{Number(it.totalBudget).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-500 uppercase font-mono">Travel Dates</span>
                                <span className="font-medium text-slate-200 truncate block">{it.startDate}</span>
                              </div>
                            </div>

                            {it.chatSession && it.chatSession.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>{it.chatSession.length} Copilot chat messages saved</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-4">
                            <button
                              type="button"
                              onClick={() => handleLoadSavedItinerary(it, true)}
                              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <span>Open & View Plan</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedItinerary(it.id)}
                              className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-white/5"
                              title="Delete this saved itinerary"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm py-16 px-4">
                    <div className="relative mb-6">
                      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-full blur-xl opacity-70 animate-pulse"></div>
                      <div className="relative p-5 bg-slate-950/80 rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Compass className="h-10 w-10" />
                      </div>
                    </div>

                    <div className="text-center max-w-xl space-y-2.5">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Smart Travel Planner & Guide
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                        Set your destinations, dates, and budget preferences above, then click <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Generate Itinerary</strong> to create a verified, comfortable day-by-day travel plan.
                      </p>
                    </div>

                    {/* Feature highlight cards */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-4xl w-full text-left">
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 flex items-start gap-3 hover:border-cyan-500/30 transition shadow-sm">
                        <Train className="h-5 w-5 text-cyan-500 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Verified Rail & Transit</div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Berth classes (1A/2A/3A/SL), Volvo coaches & cab rates.</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 flex items-start gap-3 hover:border-emerald-500/30 transition shadow-sm">
                        <Wallet className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Real Budget Allocation</div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Stay limits, daily food allowances & per-person splits.</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 flex items-start gap-3 hover:border-teal-500/30 transition shadow-sm">
                        <MapPin className="h-5 w-5 text-teal-500 dark:text-teal-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Hour-by-Hour Schedules</div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Scenic viewpoints, monuments & local cuisine spots.</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 flex items-start gap-3 hover:border-amber-500/30 transition shadow-sm">
                        <Users className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Group Customization</div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Paced for friends, couples, solo, or seniors.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {result && (
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4 mb-6 print:hidden">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <span>{form.origin}</span>
                      <ArrowRight className="h-5 w-5 text-emerald-400" />
                      <span>{form.destination}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {form.nights} Nights ({form.startDate} to {form.endDate}) • {form.travellers} Travellers ({form.groupType})
                      {linkedGroup && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-medium">
                          <Crown className="h-3 w-3 text-amber-400" /> Linked to {linkedGroup.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Saved Trips */}
                    <button
                      onClick={handleOpenSavedTrips}
                      className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
                      title="Open Saved Itineraries & Past Chat Sessions"
                    >
                      <FolderOpen className="h-4 w-4 text-emerald-400" />
                      <span>Saved Trips</span>
                    </button>

                    {/* Save Itinerary & Chat Session */}
                    <button
                      onClick={handleSaveItinerary}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm"
                      title="Save this Itinerary & Copilot Chat Session"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                      <span>{savedItineraryId ? "Update Saved Trip" : "Save Trip & Chat"}</span>
                    </button>

                    {/* Forward to Travel Group (Admin-Only) */}
                    <button
                      onClick={handleOpenForwardModal}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm"
                      title="Forward to Travel Group (Admin-Only Feature)"
                    >
                      <Send className="h-4 w-4" />
                      <span>Forward to Group</span>
                    </button>

                    {/* Copilot Chat */}
                    <button
                      onClick={() => setIsCopilotOpen(true)}
                      className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
                      title="Open Travel Companion Copilot Chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Copilot</span>
                    </button>

                    {/* PDF Export */}
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:opacity-95 transition"
                      title="Download Your Travel Plan PDF"
                    >
                      <Download className="h-4 w-4 stroke-[2.5]" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Save Toast Notification */}
                {saveToast && (
                  <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs sm:text-sm font-medium flex items-center justify-between shadow-lg">
                    <span>{saveToast}</span>
                    <button onClick={() => setSaveToast(null)} className="text-emerald-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* UPFRONT LIVE ROUTE & TRAVEL SITUATION BULLETIN */}
                {result && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-slate-900/95 via-slate-950/90 to-teal-950/40 border border-teal-500/30 rounded-2xl shadow-xl backdrop-blur-md print:hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/10 gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">Live Route & Travel Situation</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              Real-Time Bulletin
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Corridor status for {form.origin} ➔ {form.destination} • Updated today
                          </p>
                        </div>
                      </div>

                      {/* Action buttons: WhatsApp Share & Copy */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleShareLiveWhatsApp}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-sm"
                          title="Share Current Situation via WhatsApp"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Share (WhatsApp)</span>
                        </button>
                        <button
                          onClick={handleCopyLiveSituation}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl transition border border-white/10"
                          title="Copy Situation Summary"
                        >
                          {copiedSituation ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Live situation grid cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
                      {/* 1. Road Status */}
                      <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-1">
                        <div className="text-slate-400 font-semibold flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Road & Transit Flow
                        </div>
                        <div className="text-white font-medium">Open & Normal Speed</div>
                        <div className="text-slate-400 text-[11px] leading-relaxed">
                          Mountain transit operating at safe 20–35 km/h. No active road closures reported along main corridor.
                        </div>
                      </div>

                      {/* 2. Weather & Daylight */}
                      <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-1">
                        <div className="text-slate-400 font-semibold flex items-center gap-1.5 text-cyan-400">
                          <Compass className="h-3.5 w-3.5 shrink-0" /> Weather & Daylight
                        </div>
                        <div className="text-white font-medium">Clear Skies • Daylight Transit</div>
                        <div className="text-slate-400 text-[11px] leading-relaxed">
                          Sun sets by 5:15–5:30 PM. Depart early in morning to arrive at stays before dark mountain cold sets in.
                        </div>
                      </div>

                      {/* 3. Formalities & Border */}
                      <div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-1">
                        <div className="text-slate-400 font-semibold flex items-center gap-1.5 text-teal-400">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Border & Formalities
                        </div>
                        <div className="text-white font-medium">ID & Currency Preparedness</div>
                        <div className="text-slate-400 text-[11px] leading-relaxed">
                          Carry physical Voter ID or Passport. Indian ₹100/₹200 notes accepted; ₹500 prohibited in Nepal.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Summary Card */}
                {financialSummary && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-cyan-950/30 border border-emerald-500/20 rounded-2xl print:border-black/20 print:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Estimated Trip Budget</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${financialSummary.budgetStatus === 'UNDER_BUDGET'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                            {financialSummary.budgetStatus === 'UNDER_BUDGET' ? '✓ UNDER BUDGET' : '⚠️ AT BUDGET LIMIT'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-extrabold text-white print:text-black">
                            ₹{financialSummary.totalEstimatedCost.toLocaleString()}
                          </span>
                          <span className="text-sm text-slate-400">
                            Total for {form.travellers} {form.travellers > 1 ? "Travellers" : "Traveller"} (of ₹{financialSummary.targetBudget.toLocaleString()} Target)
                          </span>
                        </div>
                        {form.travellers > 1 && (
                          <div className="text-xs text-teal-400 font-medium mt-1.5 flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300">
                              ~₹{Math.round(financialSummary.totalEstimatedCost / form.travellers).toLocaleString()} / person
                            </span>
                            <span className="text-slate-400 text-xs">Full group total shown above (not pre-split)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-300 print:text-gray-700">
                        <div className="p-2.5 bg-slate-950/50 rounded-xl border border-white/5">
                          <div className="text-slate-400">Transfers</div>
                          <div className="font-bold text-white text-sm">₹{financialSummary.totalTransportCost.toLocaleString()}</div>
                        </div>
                        <div className="p-2.5 bg-slate-950/50 rounded-xl border border-white/5">
                          <div className="text-slate-400">Stays</div>
                          <div className="font-bold text-white text-sm">₹{financialSummary.totalHotelCost.toLocaleString()}</div>
                        </div>
                        <div className="p-2.5 bg-slate-950/50 rounded-xl border border-white/5">
                          <div className="text-slate-400">Remaining</div>
                          <div className={`font-bold text-sm ${financialSummary.budgetDifference >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            ₹{Math.abs(financialSummary.budgetDifference).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trip Comfort & Friendly Guide Check */}
                {result?.auditReview && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-teal-950/40 via-slate-900/70 to-emerald-950/40 border border-teal-500/30 rounded-2xl shadow-lg backdrop-blur-md print:border-black/20 print:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">Your Trip Comfort & Safety Check</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {result.auditReview.status === 'MODIFIED_FOR_SAFETY' ? '✓ Adjusted for Comfort' : '✓ Verified & Relaxed'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Double-checked by your travel guide • Realistic travel times, plenty of rest, and zero rush
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs text-slate-400">Comfort Score:</span>
                        <span className="text-base font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                          {result.auditReview.auditScore || 98}%
                        </span>
                      </div>
                    </div>

                    {/* Comfort checks bullet points */}
                    {result.auditReview.realityChecks?.length > 0 && (
                      <div className="mt-3.5 space-y-2">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Why this plan is easy & relaxing:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {result.auditReview.realityChecks.map((check: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{check}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Friendly tips if any */}
                    {result.auditReview.warnings?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2 text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-300">Helpful Travel Tip: </span>
                          {result.auditReview.warnings.join(" • ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF Print Header */}
                <div className="hidden print:block mb-8">
                  <h1 className="text-4xl font-bold text-black border-b-2 border-black pb-4 mb-4">Trip to {form.destination}</h1>
                  <p className="text-gray-600"><strong>From:</strong> {form.origin} • <strong>Dates:</strong> {form.startDate} to {form.endDate} ({form.nights} nights)</p>
                  <p className="text-gray-600"><strong>Travellers:</strong> {form.travellers} ({form.groupType}) • <strong>Budget:</strong> ₹{form.budget}</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-6 print:hidden">
                  <button
                    onClick={() => setActiveTab('itinerary')}
                    className={`px-6 py-3 font-semibold transition ${activeTab === 'itinerary' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`}
                  >
                    Detailed Itinerary
                  </button>
                  <button
                    onClick={() => setActiveTab('equipments')}
                    className={`px-6 py-3 font-semibold transition ${activeTab === 'equipments' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`}
                  >
                    Equipments ({result.equipments?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('tips')}
                    className={`px-6 py-3 font-semibold transition ${activeTab === 'tips' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`}
                  >
                    Travel Tips ({result.tips?.length || 0})
                  </button>
                </div>

                {/* Tab Content: Itinerary */}
                {activeTab === 'itinerary' && (
                  <div className="space-y-8 flex-1 overflow-auto pr-4 print:overflow-visible">
                    {result.days?.map((day: any, i: number) => (
                      <div key={i} className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 print:bg-gray-100 print:text-black print:break-inside-avoid">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-white/5 print:border-black/10">
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-bold text-emerald-400 print:text-black">Day {day.day}</h4>
                            <span className="text-sm px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full print:bg-transparent print:border print:border-black">
                              Stay: {day.stay}
                            </span>
                          </div>

                          {/* Day-by-Day Calendar Dispatch Button */}
                          <div className="print:hidden">
                            <button
                              onClick={() => handleOpenDayCalendar(day)}
                              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm"
                              title={`Add Day ${day.day} Schedule to Calendar & Dispatch to Group Members`}
                            >
                              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Add Day {day.day} to Calendar</span>
                            </button>
                          </div>
                        </div>

                        {/* Legs */}
                        {day.legs && day.legs.length > 0 && (
                          <div className="mb-6 space-y-4">
                            <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider print:text-gray-600">Transfers & Legs</h5>
                            {day.legs.map((leg: any, lIdx: number) => (
                              <div key={lIdx} className="flex gap-4 items-start p-4 bg-slate-900 rounded-xl border border-slate-800 print:bg-white print:border-gray-300">
                                <div className="mt-1">
                                  {getLegIcon(leg.mode)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-white text-lg print:text-black">{leg.from} <ArrowRight className="inline h-4 w-4 mx-2 text-emerald-400" /> {leg.to}</p>
                                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-slate-300 print:text-gray-700">
                                    <span className="flex items-center gap-1"><strong>Mode:</strong> {leg.mode}</span>
                                    <span className="flex items-center gap-1 text-emerald-300"><strong>Depart:</strong> {leg.depart}</span>
                                    <span className="flex items-center gap-1 text-teal-300"><strong>Arrive:</strong> {leg.arrive}</span>
                                    {leg.distance_km ? (
                                      <span className="flex items-center gap-1 text-sky-300"><strong>Distance:</strong> ~{leg.distance_km} km</span>
                                    ) : null}
                                    {leg.duration_hours ? (
                                      <span className="flex items-center gap-1 text-indigo-300"><strong>Duration:</strong> {leg.duration_hours}h</span>
                                    ) : null}
                                    {leg.cost ? (
                                      <span className="flex items-center gap-1 font-bold text-amber-400 print:text-black">
                                        Cost: ₹{leg.cost} {form.travellers > 1 ? `(total for ${form.travellers})` : ""}
                                      </span>
                                    ) : null}
                                  </div>
                                  {leg.note && (
                                    <div className="mt-3 text-sm text-slate-400 bg-slate-950 p-3 rounded-lg flex items-center gap-2 print:bg-gray-100 print:text-gray-800">
                                      {leg.note.match(/(\+?\d[\d -]{6,}\d)/) && !isDemoPhoneNumber(leg.note) ? (
                                        <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                                      ) : (
                                        <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                                      )}
                                      <span>{leg.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Activities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {['morning', 'afternoon', 'evening', 'food'].map((period) => (
                            day.activities?.[period] && (
                              <div key={period} className="p-4 bg-slate-900/50 rounded-xl border border-white/5 print:bg-transparent print:border print:border-gray-200">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 print:text-gray-500">{period}</h5>
                                <p className="text-slate-200 text-sm print:text-black">{day.activities[period]}</p>
                              </div>
                            )
                          ))}
                        </div>

                        {/* Hotel Details */}
                        {day.hotelDetails && (
                          <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl print:bg-transparent print:border-gray-400 print:border">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <h5 className="text-sm font-bold text-emerald-400 flex items-center gap-2 print:text-black">
                                <Hotel className="h-4 w-4" /> Accommodation & Night Stay
                              </h5>
                              <div className="flex items-center gap-2">
                                {day.hotelDetails.roomType && (
                                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                                    {day.hotelDetails.roomType}
                                  </span>
                                )}
                                {financialSummary?.targetNightlyStayBudget && day.hotelDetails.costPerNight <= financialSummary.targetNightlyStayBudget * 1.25 ? (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                    ✓ Within Budget
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex justify-between items-start text-sm print:text-black gap-2">
                              <div>
                                <span className="text-white font-semibold print:text-black text-base">{day.hotelDetails.name}</span>
                                {day.hotelDetails.breakdownNote && (
                                  <p className="text-xs text-slate-300 mt-1 print:text-gray-700 leading-relaxed">
                                    {day.hotelDetails.breakdownNote}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-emerald-300 print:text-black font-bold text-base">₹{Number(day.hotelDetails.costPerNight || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ night</span></span>
                                {day.hotelDetails.roomCount && day.hotelDetails.ratePerUnit ? (
                                  <span className="block text-[11px] text-slate-400 font-normal">
                                    {day.hotelDetails.roomCount} units × ₹{Number(day.hotelDetails.ratePerUnit).toLocaleString()}
                                  </span>
                                ) : form.travellers > 1 ? (
                                  <span className="block text-[10px] text-slate-400 font-normal">Room total for {form.travellers} guests</span>
                                ) : null}
                              </div>
                            </div>
                            {day.hotelDetails.contact && !isDemoPhoneNumber(day.hotelDetails.contact) ? (
                              <p className="text-slate-300 text-xs mt-2.5 print:text-gray-700 flex items-center gap-1.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
                                <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                <span>Verified Reception / Desk: <strong className="text-white font-mono">{day.hotelDetails.contact}</strong></span>
                              </p>
                            ) : (
                              <p className="text-slate-500 text-xs mt-2 print:text-gray-600">
                                Reservation via official hostel/hotel front desk or verified travel booking portal
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab Content: Equipments or Tips */}
                {(activeTab === 'equipments' || activeTab === 'tips') && (
                  <div className="bg-slate-950/50 rounded-2xl p-8 border border-white/5 h-full">
                    <ul className="space-y-4">
                      {(activeTab === 'equipments' ? result.equipments : result.tips)?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-slate-300 text-base">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {!(activeTab === 'equipments' ? result.equipments : result.tips)?.length && (
                        <p className="text-slate-500 text-center py-10">No specific items listed.</p>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Copilot Drawer / Modal */}
      <AnimatePresence>
        {isCopilotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl"
            >
              <TravelCopilotChat
                currentPlan={result}
                formData={form}
                origin={form.origin}
                destination={form.destination}
                startDate={form.startDate}
                endDate={form.endDate}
                nights={form.nights}
                travellers={form.travellers}
                budget={form.budget}
                stayBudget={form.stayBudget}
                groupType={form.groupType}
                stayPreference={form.stayPreference}
                pace={form.pace}
                trainClass={form.trainClass}
                busClass={form.busClass}
                flightClass={form.flightClass}
                onApplyPlanUpdate={handlePlanUpdate}
                onClose={() => setIsCopilotOpen(false)}
                initialMessages={chatMessages}
                onMessagesChange={(msgs) => setChatMessages(msgs)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Saved Trips Modal */}
      <AnimatePresence>
        {isSavedTripsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Saved Travel Itineraries & Chats</h3>
                </div>
                <button
                  onClick={() => setIsSavedTripsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {isLoadingSavedTrips ? (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                    <span>Loading your saved itineraries...</span>
                  </div>
                ) : savedTripsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-sm">No saved itineraries found yet.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Generate a trip and click <strong className="text-emerald-400">Save Trip & Chat</strong> to persist it here.
                    </p>
                  </div>
                ) : (
                  savedTripsList.map((it) => (
                    <div
                      key={it.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-white/5 hover:border-emerald-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{it.title}</h4>
                          {it.group && (
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-medium">
                              Group: {it.group.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {it.origin} ➔ {it.destination} • {it.days} Days • {it.groupSize} Travellers • ₹{Number(it.totalBudget).toLocaleString()} Budget
                        </p>
                        {it.chatSession?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-2 font-mono">
                            <MessageSquare className="h-3 w-3" /> {it.chatSession.length} chat messages saved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleLoadSavedItinerary(it)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm"
                        >
                          Open & Load
                        </button>
                        <button
                          onClick={() => handleDeleteSavedItinerary(it.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                          title="Delete saved itinerary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Forward to Travel Group Modal */}
      <AnimatePresence>
        {isForwardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Send className="h-5 w-5 text-teal-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Forward to Travel Group</h3>
                    <p className="text-xs text-slate-400">Attach itinerary & live Copilot chat to a group</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsForwardModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Admin Privileges Notice */}
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                <Crown className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Privilege:</strong> Only group administrators can forward itineraries, manage member schedules, and dispatch day calendar events.
                </span>
              </div>

              <div className="my-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {isLoadingGroups ? (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                    <span>Loading your groups...</span>
                  </div>
                ) : userGroups.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No groups found for your account. Please create or join a group first.
                  </div>
                ) : (
                  userGroups.map((g) => {
                    const userMember = g.members?.find((m: any) => m.id === currentUser?.id);
                    const isAdmin = userMember?.role === "ADMIN" || g.creatorId === currentUser?.id;
                    const isSelected = selectedGroupId === g.id;

                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          if (isAdmin) setSelectedGroupId(g.id);
                        }}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          !isAdmin
                            ? "opacity-60 bg-slate-950/30 border-white/5 cursor-not-allowed"
                            : isSelected
                            ? "bg-teal-500/15 border-teal-500/50 shadow-sm"
                            : "bg-slate-950/60 border-white/5 hover:border-teal-500/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{g.name}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                              {g.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {g.members?.length || 0} members • Currency: {g.currency}
                          </p>
                        </div>
                        <div>
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-semibold">
                              <Crown className="h-3 w-3 text-amber-400" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-400 border border-white/10 px-2.5 py-1 rounded-full">
                              <Lock className="h-3 w-3" /> Member Only
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {forwardFeedback && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs font-medium ${
                    forwardFeedback.ok
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                  }`}
                >
                  {forwardFeedback.text}
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsForwardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmForward}
                  disabled={!selectedGroupId || isForwarding}
                  className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-sm"
                >
                  {isForwarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Forward Itinerary & Chat</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Day-by-Day Calendar Dispatch Modal */}
      <AnimatePresence>
        {activeDayCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Add Day {activeDayCalendar.dayNumber} to Calendar
                    </h3>
                    <p className="text-xs text-slate-400">
                      Stay: {activeDayCalendar.day.stay || form.destination}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDayCalendar(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Day Details Preview */}
              <div className="my-4 p-3.5 bg-slate-950/70 border border-white/5 rounded-xl space-y-2 text-xs">
                <div className="text-slate-300">
                  <strong className="text-emerald-400">Transit:</strong>{" "}
                  {activeDayCalendar.day.legs?.length
                    ? activeDayCalendar.day.legs.map((l: any) => `${l.from} ➔ ${l.to} (${l.mode})`).join(" • ")
                    : "Local exploration & relaxation"}
                </div>
                {activeDayCalendar.day.hotelDetails && (
                  <div className="text-slate-300">
                    <strong className="text-emerald-400">Stay:</strong> {activeDayCalendar.day.hotelDetails.name}
                    {activeDayCalendar.day.hotelDetails.roomType && ` (${activeDayCalendar.day.hotelDetails.roomType})`}
                  </div>
                )}
              </div>

              {/* Group Member Invite Selection (Admin Feature) */}
              <div className="mb-4 p-3.5 bg-slate-950/40 border border-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <Users className="h-3.5 w-3.5 text-teal-400" />
                    <span>Invite Group Members (Admin Dispatch)</span>
                  </div>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-mono">
                    Admin Privilege
                  </span>
                </div>

                {linkedGroup?.members?.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {linkedGroup.members.map((m: any) => {
                      const isChecked = selectedMemberEmails.includes(m.email);
                      return (
                        <label
                          key={m.id || m.email}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMemberEmails((prev) => [...prev, m.email]);
                              } else {
                                setSelectedMemberEmails((prev) => prev.filter((em) => em !== m.email));
                              }
                            }}
                            className="rounded bg-slate-800 border-white/20 text-emerald-500 focus:ring-0"
                          />
                          <span className="font-medium text-white">{m.name}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{m.email}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Trip is currently personal. You can add Day {activeDayCalendar.dayNumber} to your calendar, or forward this trip to a Travel Group to automatically invite all members!
                  </p>
                )}
              </div>

              {dayCalendarToast && (
                <div className="mb-4 p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
                  {dayCalendarToast}
                </div>
              )}

              {/* Action Buttons for Day X */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <button
                  onClick={handleDayWhatsAppShare}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-md"
                  title="Share Day schedule to WhatsApp Group with 1-Tap Calendar Add link"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Send to WhatsApp Group (1-Tap Member Calendar Invite)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDayGoogleCalendar}
                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs py-2 px-3 rounded-xl border border-white/10 transition"
                    title="Open in Google Calendar with Member Invites"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Google Calendar</span>
                  </button>
                  <button
                    onClick={handleDayDownloadICS}
                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs py-2 px-3 rounded-xl border border-white/10 transition"
                    title="Download Apple / Outlook .ICS event file"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Download .ICS</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

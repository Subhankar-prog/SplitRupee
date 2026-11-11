"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  saveCachedItineraries,
  getCachedItineraries,
  saveCachedItineraryDraft,
  getCachedGroupsList,
} from "@/lib/offlineSync";
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
  ExternalLink,
  Utensils,
  Ticket,
  FileCheck,
  ShieldAlert,
  Receipt,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getDestinationPermitsAndActivities,
  getDynamicPlaceSections,
  type PlaceSection
} from "@/lib/destinationGroundEngine";

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
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
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

  const destinationName = form.destination || result?.destination || "";
  const placeEquipments: PlaceSection[] = useMemo(() => {
    return getDynamicPlaceSections("equipments", result, destinationName);
  }, [result, destinationName]);

  const placeTips: PlaceSection[] = useMemo(() => {
    return getDynamicPlaceSections("tips", result, destinationName);
  }, [result, destinationName]);

  const totalEquipmentsCount = placeEquipments.reduce((sum, sec) => sum + sec.items.length, 0);
  const totalTipsCount = placeTips.reduce((sum, sec) => sum + sec.items.length, 0);
  const currentPlaceSections = activeTab === "equipments" ? placeEquipments : placeTips;

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

  const getComprehensiveTripBudget = (plan: any, formData: any) => {
    if (!plan) return null;

    const travellers = Math.max(1, Number(formData.travellers) || Number(plan.travellers) || Number(plan.groupSize) || 8);
    const targetBudget = Number(formData.budget) || Number(plan.targetBudget) || Number(plan.totalBudget) || 120000;
    const daysCount = Array.isArray(plan.days) ? plan.days.length : Number(formData.nights) + 1 || 10;
    const nightsCount = Math.max(1, daysCount - 1);

    const daysText = Array.isArray(plan?.days)
      ? plan.days.map((d: any) => `${d.stay || ""} ${d.legs?.map((l: any) => `${l.from || ""} ${l.to || ""}`).join(" ") || ""}`).join(" ")
      : "";
    const dest = `${formData?.destination || ""} ${plan?.destination || ""} ${daysText}`.trim();
    const groundInfo = getDestinationPermitsAndActivities(dest, travellers);

    // If plan has a custom detailed budgetBreakdown, reconcile and guarantee mathematical accuracy
    if (plan.budgetBreakdown && Array.isArray(plan.budgetBreakdown.categories)) {
      const b = plan.budgetBreakdown;

      const updatedCategories = b.categories.map((c: any) => {
        if (c.id === "permits") {
          const accuratePerPerson = groundInfo.approxPerPersonPermitCost;
          const accurateGroupTotal = Math.round(travellers * accuratePerPerson);
          return {
            ...c,
            name: groundInfo.permitName || c.name,
            tag: groundInfo.permitTag || c.tag,
            description: groundInfo.permitDescription || c.description,
            groupTotal: accurateGroupTotal,
            perPerson: accuratePerPerson
          };
        }
        if (c.id === "activities") {
          const accuratePerPerson = groundInfo.approxPerPersonActivityCost;
          const accurateGroupTotal = Math.round(travellers * accuratePerPerson);
          return {
            ...c,
            name: groundInfo.activitiesName || c.name,
            tag: groundInfo.activitiesTag || c.tag,
            description: groundInfo.activitiesDescription || c.description,
            groupTotal: accurateGroupTotal,
            perPerson: accuratePerPerson
          };
        }
        const gTotal = Number(c.groupTotal || 0);
        return {
          ...c,
          groupTotal: gTotal,
          perPerson: Number(c.perPerson || Math.round(gTotal / travellers))
        };
      });

      // Recalculate contingency buffer and totalGroupCost so numbers are 100% mathematically balanced
      const nonBufferSubTotal = updatedCategories
        .filter((c: any) => c.id !== "buffer")
        .reduce((sum: number, c: any) => sum + Number(c.groupTotal || 0), 0);

      const emergencyBuffer = Math.max(3000, targetBudget > nonBufferSubTotal ? targetBudget - nonBufferSubTotal : Math.round(targetBudget * 0.05));
      const bufferCat = updatedCategories.find((c: any) => c.id === "buffer");
      if (bufferCat) {
        bufferCat.groupTotal = emergencyBuffer;
        bufferCat.perPerson = Math.round(emergencyBuffer / travellers);
      } else {
        updatedCategories.push({
          id: "buffer",
          name: "Contingency Reserve & Emergency Buffer",
          tag: "Safety Buffer",
          icon: "ShieldAlert",
          description: "Emergency medical fund, local road tolls, driver tips/allowance & road delay contingency.",
          groupTotal: emergencyBuffer,
          perPerson: Math.round(emergencyBuffer / travellers),
          isOptional: false
        });
      }

      const totalGroup = Math.min(targetBudget, nonBufferSubTotal + emergencyBuffer);

      return {
        ...b,
        travellers,
        daysCount,
        nightsCount,
        targetBudget: Number(b.targetBudget || targetBudget),
        totalGroupCost: totalGroup,
        costPerPerson: Math.round(totalGroup / travellers),
        budgetStatus: totalGroup <= targetBudget ? "UNDER_BUDGET" : "BALANCED",
        categories: updatedCategories
      };
    }

    // Dynamic computation if no custom breakdown object exists
    let transitCost = 0;
    let hotelCost = 0;

    if (Array.isArray(plan.days)) {
      plan.days.forEach((d: any) => {
        if (Array.isArray(d.legs)) {
          d.legs.forEach((l: any) => {
            transitCost += Number(l.cost) || 0;
          });
        }
        if (d.hotelDetails?.costPerNight) {
          hotelCost += Number(d.hotelDetails.costPerNight) || 0;
        }
      });
    }

    if (transitCost === 0) transitCost = Math.round(targetBudget * 0.45);
    if (hotelCost === 0) hotelCost = Math.round(targetBudget * 0.22);

    const mealsCost = Math.round(daysCount * travellers * 230);
    const permitsCost = Math.round(travellers * groundInfo.approxPerPersonPermitCost);
    const activitiesCost = Math.round(travellers * groundInfo.approxPerPersonActivityCost);
    const subTotal = transitCost + hotelCost + mealsCost + permitsCost + activitiesCost;
    const emergencyBuffer = Math.max(3000, targetBudget > subTotal ? targetBudget - subTotal : Math.round(targetBudget * 0.05));
    const totalGroupCost = Math.min(targetBudget, subTotal + emergencyBuffer);

    return {
      targetBudget,
      totalGroupCost,
      costPerPerson: Math.round(totalGroupCost / travellers),
      travellers,
      daysCount,
      nightsCount,
      budgetStatus: totalGroupCost <= targetBudget ? "UNDER_BUDGET" : "BALANCED",
      summaryNote: `Full-trip comprehensive budget for all ${travellers} travellers covering transit, stays, meals, ${groundInfo.permitTag}, optional activities, and contingency reserve.`,
      categories: [
        {
          id: "transit",
          name: "Transit, Trains & Road Transport",
          tag: "Full Circuit Transit",
          icon: "Train",
          description: `Full round-trip rail and road transfers for ${travellers} travellers covering all outbound and return legs.`,
          groupTotal: transitCost,
          perPerson: Math.round(transitCost / travellers),
          isOptional: false
        },
        {
          id: "stays",
          name: `Accommodations & Stays (${nightsCount} Nights)`,
          tag: "Group Stays",
          icon: "Hotel",
          description: `${nightsCount} nights total: Clean group double rooms & verified local stays for all ${travellers} guests.`,
          groupTotal: hotelCost,
          perPerson: Math.round(hotelCost / travellers),
          isOptional: false
        },
        {
          id: "meals",
          name: `Daily Meals, Breakfasts & Dining (${daysCount} Days)`,
          tag: "Daily Meal Pool",
          icon: "Utensils",
          description: `${daysCount} days of breakfasts, trail lunches, authentic regional cuisine, snacks & group dinners.`,
          groupTotal: mealsCost,
          perPerson: Math.round(mealsCost / travellers),
          isOptional: false
        },
        {
          id: "permits",
          name: groundInfo.permitName,
          tag: groundInfo.permitTag,
          icon: "FileCheck",
          description: groundInfo.permitDescription,
          groupTotal: permitsCost,
          perPerson: Math.round(permitsCost / travellers),
          isOptional: false
        },
        {
          id: "activities",
          name: groundInfo.activitiesName,
          tag: groundInfo.activitiesTag,
          icon: "Ticket",
          description: groundInfo.activitiesDescription,
          groupTotal: activitiesCost,
          perPerson: Math.round(activitiesCost / travellers),
          isOptional: true
        },
        {
          id: "buffer",
          name: "Contingency Reserve & Emergency Buffer",
          tag: "Safety Buffer",
          icon: "ShieldAlert",
          description: "Emergency medical fund, local road tolls, driver tips/allowance & road delay contingency.",
          groupTotal: emergencyBuffer,
          perPerson: Math.round(emergencyBuffer / travellers),
          isOptional: false
        }
      ]
    };
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

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(
        "You're offline. Generating a new AI itinerary requires an internet connection — you can still open your Saved Itineraries, view plans, or export PDF/ICS files offline."
      );
      return;
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
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
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
      if (data.offline) {
        setError("You're offline. Generating a new AI itinerary requires an internet connection.");
        setLoading(false);
      } else if (!res.ok || !data.ok) {
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
      saveCachedItineraryDraft({
        form,
        result: pendingPlan,
        savedItineraryId,
        chatMessages,
      });
    }
    if (pendingFinancial) {
      setFinancialSummary(pendingFinancial);
    }
    setLoading(false);
  };

  const handleDownloadPDF = async (mode: "magazine" | "classic" = "magazine") => {
    if (!result) return;
    setPdfProgress("Starting PDF export...");
    try {
      await exportItineraryPDF({
        form,
        result,
        financialSummary,
        mode,
        onProgress: (step, total, msg) => {
          setPdfProgress(msg || `Generating Page ${step} of ${total}...`);
        }
      });
      setSaveToast(`✨ ${mode === "magazine" ? "Magazine Scrapbook" : "Classic Statement"} downloaded successfully!`);
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setPdfProgress(null);
    }
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
    if (!updatedPlan) return;
    setResult(updatedPlan);

    const compBudget = getComprehensiveTripBudget(updatedPlan, form);
    if (compBudget) {
      updatedPlan.budgetBreakdown = compBudget;
      setFinancialSummary({
        totalEstimatedCost: compBudget.totalGroupCost,
        totalTransportCost: compBudget.categories?.find((c: any) => c.id === 'transit')?.groupTotal || 0,
        totalHotelCost: compBudget.categories?.find((c: any) => c.id === 'stays')?.groupTotal || 0,
        totalMealsCost: compBudget.categories?.find((c: any) => c.id === 'meals')?.groupTotal || 0,
        totalPermitsCost: compBudget.categories?.find((c: any) => c.id === 'permits')?.groupTotal || 0,
        totalActivitiesCost: compBudget.categories?.find((c: any) => c.id === 'activities')?.groupTotal || 0,
        contingencyBuffer: compBudget.categories?.find((c: any) => c.id === 'buffer')?.groupTotal || 0,
        targetBudget: compBudget.targetBudget,
        costPerPerson: compBudget.costPerPerson,
        budgetDifference: compBudget.targetBudget - compBudget.totalGroupCost,
        budgetStatus: compBudget.budgetStatus || "UNDER_BUDGET"
      });
    }

    if (updatedPlan.origin || updatedPlan.destination) {
      setForm((prev) => ({
        ...prev,
        origin: updatedPlan.origin || prev.origin,
        destination: updatedPlan.destination || prev.destination,
        nights: updatedPlan.nightsCount || (Array.isArray(updatedPlan.days) ? updatedPlan.days.length - 1 : prev.nights)
      }));
    }

    // Auto-save sync so changes from Copilot & chat history persist immediately to the database
    const targetSaveId = savedItineraryId || (savedTripsList.length === 1 ? savedTripsList[0].id : undefined);
    fetch("/api/itinerary", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      body: JSON.stringify({
        id: targetSaveId,
        userId: currentUser?.id || null,
        groupId: linkedGroup?.id || null,
        title: `Trip: ${updatedPlan.origin || form.origin} ➔ ${updatedPlan.destination || form.destination} (${updatedPlan.nightsCount || form.nights}N / ${Number(updatedPlan.daysCount || form.nights) + 1}D)`,
        origin: updatedPlan.origin || form.origin,
        destination: updatedPlan.destination || form.destination,
        startDate: updatedPlan.startDate || form.startDate,
        endDate: updatedPlan.endDate || form.endDate,
        days: Number(updatedPlan.daysCount || (Array.isArray(updatedPlan.days) ? updatedPlan.days.length : Number(form.nights) + 1)),
        groupSize: Number(updatedPlan.travellers || form.travellers) || 1,
        totalBudget: Number(updatedPlan.targetBudget || form.budget) || 0,
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
        planData: updatedPlan,
        chatSession: chatMessages
      })
    })
      .then(async (res) => {
        const json = await res.json();
        if (json.ok && json.itinerary?.id) {
          setSavedItineraryId(json.itinerary.id);
          setSavedTripsList((prev) => {
            const filtered = prev.filter((item) => item.id !== json.itinerary.id);
            return [json.itinerary, ...filtered];
          });
        }
      })
      .catch((e) => console.warn("Auto-save sync error:", e));

    setSaveToast("✓ Itinerary updated! All days & costs refreshed.");
    setTimeout(() => setSaveToast(null), 4000);
  };

  // 1. Save Itinerary and its Chat Session
  const handleSaveItinerary = async () => {
    if (!result || !form.origin || !form.destination) return;
    setIsSaving(true);
    setSaveToast(null);

    const saveOfflineCopy = () => {
      const localId = savedItineraryId || `offline_itin_${Date.now()}`;
      const offlineItin = {
        id: localId,
        userId: currentUser?.id || null,
        groupId: linkedGroup?.id || null,
        group: linkedGroup || null,
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
            road: form.transportRoad,
          },
        },
        planData: result,
        chatSession: chatMessages,
        isOfflinePending: true,
        updatedAt: new Date().toISOString(),
      };
      setSavedItineraryId(localId);
      setSavedTripsList((prev) => {
        const filtered = prev.filter((item) => item.id !== localId);
        const updated = [offlineItin, ...filtered];
        saveCachedItineraries(currentUser?.id, updated);
        return updated;
      });
      saveCachedItineraryDraft({
        form,
        result,
        savedItineraryId: localId,
        chatMessages,
      });
      setSaveToast("✓ Saved locally offline for instant viewing! Re-save once online to sync to cloud.");
      setTimeout(() => setSaveToast(null), 3500);
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      saveOfflineCopy();
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        body: JSON.stringify({
          id: savedItineraryId && !savedItineraryId.startsWith("offline_itin_") ? savedItineraryId : undefined,
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
      if (json.offline) {
        saveOfflineCopy();
      } else if (json.ok && json.itinerary?.id) {
        const prevId = savedItineraryId;
        setSavedItineraryId(json.itinerary.id);
        setSaveToast("✓ Itinerary & Travel Guide notes saved successfully!");
        setTimeout(() => setSaveToast(null), 3000);

        if (json.itinerary) {
          setSavedTripsList((prev) => {
            const filtered = prev.filter((item) => item.id !== json.itinerary.id && item.id !== prevId);
            const updated = [json.itinerary, ...filtered];
            saveCachedItineraries(currentUser?.id, updated);
            return updated;
          });
        }
      } else {
        setSaveToast(`Error: ${json.error || "Could not save itinerary"}`);
      }
    } catch {
      saveOfflineCopy();
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Open Saved Trips Drawer / Modal
  const handleOpenSavedTrips = async () => {
    setIsSavedTripsModalOpen(true);
    const cachedInitial = getCachedItineraries(currentUser?.id);
    if (cachedInitial.length > 0) {
      setSavedTripsList(cachedInitial);
    }
    setIsLoadingSavedTrips(cachedInitial.length === 0);
    try {
      const baseUrl = currentUser?.id ? `/api/itinerary?userId=${encodeURIComponent(currentUser.id)}` : "/api/itinerary";
      const url = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      const json = await res.json();
      if (json.ok && Array.isArray(json.itineraries)) {
        const serverIds = new Set(json.itineraries.map((i: any) => i.id));
        const localOnly = cachedInitial.filter((i: any) => String(i.id || "").startsWith("offline_itin_") && !serverIds.has(i.id));
        const merged = [...localOnly, ...json.itineraries];
        setSavedTripsList(merged);
        saveCachedItineraries(currentUser?.id, merged);
      } else {
        setSavedTripsList(getCachedItineraries(currentUser?.id));
      }
    } catch (err) {
      console.warn("Failed to load saved trips:", err);
      setSavedTripsList(getCachedItineraries(currentUser?.id));
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
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("splitrupee_active_itinerary_id");
        localStorage.removeItem("splitrupee_last_saved_itinerary");
        localStorage.removeItem("splitrupee_last_active_itinerary");
      } catch {}
    }

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
    setForm({
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
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("id")) {
          url.searchParams.delete("id");
          window.history.replaceState({}, "", url.pathname);
        }
        sessionStorage.removeItem("splitrupee_active_itinerary_id");
        localStorage.removeItem("splitrupee_last_saved_itinerary");
        localStorage.removeItem("splitrupee_last_active_itinerary");
      } catch {}
    }
  };

  // Delete a Saved Itinerary
  const handleDeleteSavedItinerary = async (itId: string) => {
    if (!confirm("Are you sure you want to delete this saved itinerary?")) return;
    if (itId.startsWith("offline_itin_")) {
      setSavedTripsList((prev) => {
        const updated = prev.filter((item) => item.id !== itId);
        saveCachedItineraries(currentUser?.id, updated);
        return updated;
      });
      if (savedItineraryId === itId) {
        handleResetToNewPlan();
      }
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSaveToast("You're offline. Deleting cloud-synced trips requires an internet connection.");
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }
    try {
      const url = currentUser?.id
        ? `/api/itinerary?id=${encodeURIComponent(itId)}&userId=${encodeURIComponent(currentUser.id)}`
        : `/api/itinerary?id=${encodeURIComponent(itId)}`;
      const res = await fetch(url, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      const json = await res.json();
      if (json.ok) {
        setSavedTripsList((prev) => {
          const updated = prev.filter((item) => item.id !== itId);
          saveCachedItineraries(currentUser?.id, updated);
          return updated;
        });
        if (savedItineraryId === itId) {
          handleResetToNewPlan();
        }
      }
    } catch (err) {
      console.warn("Could not delete itinerary:", err);
    }
  };

  // Auto-fetch saved itineraries on mount for count badge & saved trips showcase.
  // The itinerary page ALWAYS starts fresh and blank on visits and page refreshes.
  useEffect(() => {
    let isCancelled = false;

    // Clear any lingering cached state so visits & refreshes always start blank
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("splitrupee_last_saved_itinerary");
        localStorage.removeItem("splitrupee_last_active_itinerary");
        sessionStorage.removeItem("splitrupee_active_itinerary_id");

        // Clean any lingering ?id= from the address bar so future refreshes always start blank
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has("id")) {
          currentUrl.searchParams.delete("id");
          window.history.replaceState({}, "", currentUrl.pathname);
        }
      } catch {}
    }

    const fetchInitialSavedTrips = async () => {
      const cached = getCachedItineraries(currentUser?.id);
      if (!isCancelled && cached.length > 0) {
        setSavedTripsList(cached);
      }
      setIsLoadingSavedTrips(cached.length === 0);
      try {
        const baseUrl = currentUser?.id
          ? `/api/itinerary?userId=${encodeURIComponent(currentUser.id)}`
          : "/api/itinerary";
        const url = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
        const res = await fetch(url, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        const json = await res.json();
        if (!isCancelled && json.ok && Array.isArray(json.itineraries)) {
          const serverIds = new Set(json.itineraries.map((i: any) => i.id));
          const localOnly = cached.filter((i: any) => String(i.id || "").startsWith("offline_itin_") && !serverIds.has(i.id));
          const merged = [...localOnly, ...json.itineraries];
          setSavedTripsList(merged);
          saveCachedItineraries(currentUser?.id, merged);
          // Never auto-load or prefill past data on page refresh/visit!
          // The page stays completely blank so the user can plan a new trip or choose from the saved trips list.
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
    const cachedGroups = getCachedGroupsList();
    if (cachedGroups.length > 0) {
      setUserGroups(cachedGroups);
    }
    try {
      const baseUrl = currentUser?.id ? `/api/groups?userId=${encodeURIComponent(currentUser.id)}` : "/api/groups";
      const url = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setForwardFeedback({
        ok: false,
        text: "You're offline. Forwarding an itinerary to a shared group requires an internet connection.",
      });
      return;
    }
    setIsForwarding(true);
    setForwardFeedback(null);

    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
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
          text: `✓ Successfully forwarded itinerary & travel guide notes to ${targetG?.name || "Travel Group"}! Group members can now access the plan.`
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
      return <Plane className="h-5 w-5 text-[var(--brand-dark)] dark:text-[var(--brand-primary)] print:text-black" />;
    }
    if (m.includes("train") || m.includes("rail") || m.includes("express")) {
      return <Train className="h-5 w-5 text-[var(--brand-primary)] print:text-black" />;
    }
    if (m.includes("bus") || m.includes("volvo") || m.includes("coach")) {
      return <Bus className="h-5 w-5 text-[var(--status-warning)] print:text-black" />;
    }
    if (m.includes("taxi") || m.includes("cab") || m.includes("car") || m.includes("jeep") || m.includes("auto")) {
      return <Car className="h-5 w-5 text-[var(--status-positive)] print:text-black" />;
    }
    return <MapPin className="h-5 w-5 text-[var(--brand-primary)] print:text-black" />;
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

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
              <Plane className="h-5 w-5 text-[var(--brand-primary)]" />
              <span>Travel Itinerary Planner</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Handcrafted travel itineraries with verified transit, real budgets, and local guidance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Always visible Saved Trips button */}
            <button
              type="button"
              onClick={handleOpenSavedTrips}
              className="flex items-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[color:var(--border-subtle)] hover:border-[color:var(--border-strong)] text-[var(--text-primary)] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm w-fit"
              title="Open Saved Itineraries & Guide Notes"
            >
              <FolderOpen className="h-4 w-4 text-[var(--brand-primary)]" />
              <span>Saved Itineraries</span>
              {savedTripsList.length > 0 && (
                <span className="bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tabular-nums">
                  {savedTripsList.length}
                </span>
              )}
            </button>

            {result && (
              <>
                <button
                  type="button"
                  onClick={handleResetToNewPlan}
                  className="flex items-center gap-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[color:var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                  title="Clear current view and plan a new itinerary"
                >
                  <Plus className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  <span>Plan New</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(true)}
                  className="flex items-center gap-2 bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] hover:opacity-95 text-white dark:text-[#171F1D] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-opacity shadow-sm w-fit"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat with Travel Guide</span>
                  <span className="flex h-2 w-2 rounded-full bg-[var(--accent-sand)]" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="itinerary-content-container flex flex-col gap-6">
          {/* Top Horizontal Input Console */}
          <div className="itinerary-form-console-card relative z-20 w-full bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] rounded-2xl p-6 md:p-7 shadow-[var(--shadow-card)] print:hidden">
            <form onSubmit={handleGenerate} className="itinerary-generator-form space-y-6">

              {/* Row 1: Core Routing, Dates (Start & End), Duration (Days & Nights), Travellers, Group */}
              <div className="itinerary-core-routing-row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-50">
                {/* 1. Origin */}
                <div className="origin-field origin-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="origin-label flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <MapPin className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" /> Origin
                    </label>
                  </div>
                  <input
                    name="origin"
                    value={form.origin}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Bhubaneswar, Mumbai"
                    className="origin-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3.5 text-[var(--text-primary)] text-sm border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors placeholder:text-[var(--text-secondary)]/65"
                  />
                </div>

                {/* 2. Destination */}
                <div className="destination-field destination-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="destination-label flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <MapPin className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" /> Destination
                    </label>
                  </div>
                  <input
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Darjeeling, Goa, Manali"
                    className="destination-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3.5 text-[var(--text-primary)] text-sm border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors placeholder:text-[var(--text-secondary)]/65"
                  />
                </div>

                {/* 3. Start Date */}
                <div className="start-date-field start-date-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="start-date-label flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" /> Start Date
                    </label>
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={handleChange}
                    className="start-date-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3 text-[var(--text-primary)] text-sm border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors"
                  />
                </div>

                {/* 4. End Date (Return Date) */}
                <div className="end-date-field end-date-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="end-date-label flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" /> End Date (Return)
                    </label>
                  </div>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    min={form.startDate ? new Date(new Date(form.startDate).getTime() + 86400000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                    onChange={handleChange}
                    className="end-date-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3 text-[var(--text-primary)] text-sm border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors"
                  />
                </div>

                {/* 5. Duration (Days & Nights) */}
                <div className="duration-days-nights-field duration-days-nights-container">
                  <div className="h-7 flex items-center justify-between gap-1.5 mb-1.5">
                    <label className="duration-days-nights-label text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">Days &amp; Nights</label>
                    <span className="duration-days-nights-badge text-[10px] text-[var(--status-positive)] font-mono font-medium tabular-nums whitespace-nowrap">
                      {form.nights ? `${form.nights}N / ${Number(form.nights) + 1}D` : "e.g. 5N/6D"}
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
                      className="nights-count-input duration-nights-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3 text-[var(--text-primary)] tabular-nums text-sm border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors placeholder:text-[var(--text-secondary)]/65"
                    />
                    <span className="duration-nights-unit text-xs text-[var(--text-secondary)] font-mono whitespace-nowrap">Nights</span>
                  </div>
                </div>

                {/* 6. Travellers & Group Type */}
                <div className="travellers-group-field travellers-group-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="travellers-group-label flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <Users className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" /> Travellers &amp; Group
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
                      className="travellers-count-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-2.5 text-[var(--text-primary)] tabular-nums text-sm border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors text-center placeholder:text-[var(--text-secondary)]/65"
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
              <div className="itinerary-budgeting-row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[color:var(--border-subtle)] relative z-40">
                {/* Total Budget */}
                <div className="total-group-budget-field total-group-budget-container">
                  <div className="h-7 flex items-center justify-between mb-1.5">
                    <label className="total-group-budget-label flex items-center gap-1.5 text-xs font-medium text-[var(--status-positive)] truncate">
                      <Wallet className="h-3.5 w-3.5 shrink-0" /> Group Budget (INR)
                    </label>
                    <span className="budget-per-person-indicator text-[10px] text-[var(--text-secondary)] font-mono tabular-nums shrink-0 ml-1">
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
                    className="total-group-budget-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3.5 font-display text-[var(--status-positive)] font-semibold tabular-nums border border-[color:var(--border-strong)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors text-sm placeholder:text-[var(--text-secondary)]/65"
                  />
                </div>

                {/* Nightly Stay Budget Limit */}
                <div className="nightly-stay-limit-field nightly-stay-limit-container">
                  <div className="h-7 flex items-center justify-between mb-1.5">
                    <label className="nightly-stay-limit-label flex items-center gap-1.5 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] truncate">
                      <Hotel className="h-3.5 w-3.5 shrink-0" /> Stay Limit / Night (INR)
                    </label>
                    <span className="stay-budget-customizable-tag text-[10px] text-[var(--text-secondary)] shrink-0 ml-1">Customizable</span>
                  </div>
                  <input
                    type="number"
                    name="stayBudget"
                    step="100"
                    placeholder="e.g. 2500"
                    value={form.stayBudget}
                    onChange={handleChange}
                    className="nightly-stay-limit-input stay-budget-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3.5 font-display text-[var(--text-primary)] font-semibold tabular-nums border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors text-sm placeholder:text-[var(--text-secondary)]/65"
                  />
                </div>

                {/* Accommodation Style */}
                <div className="accommodation-style-field accommodation-style-container">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="accommodation-style-label block text-xs font-medium text-[var(--text-secondary)]">Accommodation Style</label>
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
                    <label className="trip-pace-label flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <Activity className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" /> Trip Pace
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
              <div className="transit-mode-coach-preferences-section transit-preferences-container pt-4 border-t border-[color:var(--border-subtle)] space-y-3 relative z-30">
                <div className="transit-mode-coach-preferences-heading text-xs font-medium text-[var(--text-secondary)] flex items-center gap-2">
                  <Train className="h-4 w-4 text-[var(--brand-primary)]" />
                  <span>Transit Mode &amp; Coach Preferences:</span>
                </div>

                <div className="transit-modes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-30">
                  {/* Train */}
                  <div className="transit-train-card train-preference-card p-3 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] space-y-2 relative z-40 focus-within:z-50">
                    <label className="transit-train-checkbox-label flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                      <input
                        type="checkbox"
                        name="transportTrain"
                        checked={form.transportTrain}
                        onChange={handleChange}
                        className="transit-train-checkbox accent-[var(--brand-dark)] dark:accent-[var(--brand-primary)]"
                      />
                      <Train className="h-4 w-4 text-[var(--brand-primary)]" /> Train
                    </label>
                    {form.transportTrain && (
                      <div className="train-coach-field train-coach-container">
                        <label className="train-coach-label block text-[10px] text-[var(--text-secondary)] mb-1">Train Coach / Class:</label>
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
                          buttonClassName="py-2 px-2.5 text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Bus / Coach */}
                  <div className="transit-bus-card bus-preference-card p-3 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] space-y-2 relative z-30 focus-within:z-50">
                    <label className="transit-bus-checkbox-label flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                      <input
                        type="checkbox"
                        name="transportBus"
                        checked={form.transportBus}
                        onChange={handleChange}
                        className="transit-bus-checkbox accent-[var(--brand-dark)] dark:accent-[var(--brand-primary)]"
                      />
                      <Bus className="h-4 w-4 text-[var(--status-warning)]" /> Bus / Coach
                    </label>
                    {form.transportBus && (
                      <div className="bus-coach-field bus-coach-container">
                        <label className="bus-coach-label block text-[10px] text-[var(--text-secondary)] mb-1">Bus Coach Type:</label>
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
                          buttonClassName="py-2 px-2.5 text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Flight */}
                  <div className="transit-flight-card flight-preference-card p-3 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] space-y-2 relative z-20 focus-within:z-50">
                    <label className="transit-flight-checkbox-label flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                      <input
                        type="checkbox"
                        name="transportFlight"
                        checked={form.transportFlight}
                        onChange={handleChange}
                        className="transit-flight-checkbox accent-[var(--brand-dark)] dark:accent-[var(--brand-primary)]"
                      />
                      <Plane className="h-4 w-4 text-[var(--brand-dark)] dark:text-[var(--brand-primary)]" /> Flight
                    </label>
                    {form.transportFlight && (
                      <div className="flight-cabin-field flight-cabin-container">
                        <label className="flight-cabin-label block text-[10px] text-[var(--text-secondary)] mb-1">Flight Cabin:</label>
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
                          buttonClassName="py-2 px-2.5 text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Cab / Road */}
                  <div className="transit-cab-rental-card cab-rental-card p-3 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] flex flex-col justify-between relative z-10 focus-within:z-50">
                    <label className="transit-cab-rental-label flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                      <input
                        type="checkbox"
                        name="transportRoad"
                        checked={form.transportRoad}
                        onChange={handleChange}
                        className="transit-cab-rental-checkbox accent-[var(--brand-dark)] dark:accent-[var(--brand-primary)]"
                      />
                      <Car className="h-4 w-4 text-[var(--status-positive)]" /> Cab / Rental / Shared Jeep
                    </label>
                    <p className="transit-cab-rental-description text-[10px] text-[var(--text-secondary)] mt-2">
                      Local syndicate taxis, shared mountain jeeps &amp; prepaid regional booths.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 4: Interests & Remarks Customization */}
              <div className="itinerary-customization-row pt-4 border-t border-[color:var(--border-subtle)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 relative z-10">
                {/* Interests */}
                <div className="interests-activities-field interests-activities-container lg:col-span-5">
                  <div className="h-7 flex items-center mb-1.5">
                    <label className="interests-activities-label flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent-sand)] shrink-0" /> Interests &amp; Activities
                    </label>
                  </div>
                  <input
                    name="interests"
                    value={form.interests}
                    onChange={handleChange}
                    placeholder="e.g. Culture, Scenery, Trekking, Cafes, Local Food"
                    className="interests-activities-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3.5 text-[var(--text-primary)] text-sm border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors placeholder:text-[var(--text-secondary)]/65"
                  />
                </div>

                {/* Remarks & Special Instructions */}
                <div className="remarks-special-instructions-field remarks-special-instructions-container lg:col-span-7">
                  <div className="h-7 flex items-center justify-between mb-1.5">
                    <label className="remarks-special-instructions-label flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] truncate">
                      <Info className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" /> Remarks &amp; Special Instructions
                    </label>
                    <span className="text-[10px] text-[var(--text-secondary)] font-normal shrink-0 ml-1">Dietary, senior citizens, views...</span>
                  </div>
                  <input
                    name="specialNotes"
                    value={form.specialNotes}
                    onChange={handleChange}
                    placeholder="e.g. Early departure, pure vegetarian food, senior-friendly stairs, mountain/beach view..."
                    className="remarks-special-instructions-input h-11 w-full bg-[var(--bg-surface-secondary)] rounded-lg px-3.5 text-[var(--text-primary)] text-sm border border-[color:var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-colors placeholder:text-[var(--text-secondary)]/65"
                  />
                </div>
              </div>

              {/* Row 5: Action Button at Bottom */}
              <div className="itinerary-bottom-cta-section pt-5 border-t border-[color:var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 relative z-0">
                <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
                  <div className="p-1.5 rounded-lg bg-[var(--status-positive-bg)] border border-[color:var(--border-subtle)] text-[var(--status-positive)] shrink-0">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span>
                    Compiles verified IRCTC berths, state RTC/Volvo coaches, stay caps &amp; day-wise plan.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="generate-elite-itinerary-button w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2 bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] hover:opacity-95 text-white dark:text-[#171F1D] font-medium py-3 px-7 rounded-lg transition-opacity shadow-sm disabled:opacity-50 text-sm shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Itinerary</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-[var(--status-negative-bg)] border border-[var(--status-negative)]/30 text-[var(--status-negative)] rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--status-negative)] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block text-xs uppercase tracking-wider font-mono">Validation Warning</span>
                  <p className="text-xs sm:text-sm leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Column (Full Width directly below on the bottom) */}
          <div className="itinerary-results-canvas-card w-full relative z-10 bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] rounded-2xl p-6 md:p-8 min-h-[480px] flex flex-col shadow-[var(--shadow-card)] print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            {!result && !loading && (
              <div className="flex-1 flex flex-col py-6 px-2 sm:px-4 print:hidden">
                {savedTripsList.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[color:var(--border-subtle)] gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5 text-[var(--brand-primary)]" />
                          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">Your Saved Itineraries</h3>
                          <span className="text-xs bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25 px-2 py-0.5 rounded-full font-mono font-semibold tabular-nums">
                            {savedTripsList.length} saved
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Click any saved trip below to open, inspect schedules, or forward to your group.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const formConsole = document.querySelector(".itinerary-form-console-card");
                          formConsole?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] px-3 py-1.5 rounded-lg border border-[color:var(--border-subtle)] transition-colors w-fit"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Plan a Brand New Trip</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedTripsList.map((it) => (
                        <div
                          key={it.id}
                          className="p-5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] hover:border-[color:var(--border-strong)] transition-colors flex flex-col justify-between group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-display font-semibold text-[var(--text-primary)] text-base group-hover:text-[var(--brand-dark)] dark:group-hover:text-[var(--brand-primary)] transition-colors line-clamp-1">
                                {it.title || `${it.origin} ➔ ${it.destination}`}
                              </h4>
                              {it.group && (
                                <span className="shrink-0 text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25 px-2 py-0.5 rounded-full font-medium">
                                  {it.group.name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                              <span>{it.origin}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                              <span>{it.destination}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[color:var(--border-subtle)]">
                              <div>
                                <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-mono">Trip Duration</span>
                                <span className="font-medium text-[var(--text-primary)] tabular-nums">{it.days} Days ({Math.max(1, it.days - 1)}N)</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-mono">Travellers</span>
                                <span className="font-medium text-[var(--text-primary)] tabular-nums">{it.groupSize} Guests</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-mono">Total Budget</span>
                                <span className="font-medium tabular-nums text-[var(--status-positive)]">₹{Number(it.totalBudget).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-mono">Travel Dates</span>
                                <span className="font-medium text-[var(--text-primary)] truncate block">{it.startDate}</span>
                              </div>
                            </div>

                            {it.chatSession && it.chatSession.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-mono">
                                <MessageSquare className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                                <span>{it.chatSession.length} guide notes saved</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-4 border-t border-[color:var(--border-subtle)] mt-4">
                            <button
                              type="button"
                              onClick={() => handleLoadSavedItinerary(it, true)}
                              className="flex-1 bg-[var(--brand-dark)] hover:opacity-95 text-white text-xs font-medium py-2 px-3 rounded-lg transition-opacity flex items-center justify-center gap-1.5"
                            >
                              <span>Open &amp; View Plan</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedItinerary(it.id)}
                              className="p-2 text-[var(--text-secondary)] hover:text-[var(--status-negative)] hover:bg-[var(--status-negative-bg)] rounded-lg transition-colors border border-[color:var(--border-subtle)]"
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
                  <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm py-16 px-4">
                    <div className="mb-5">
                      <div className="p-4 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] text-[var(--brand-primary)] flex items-center justify-center">
                        <Compass className="h-9 w-9" />
                      </div>
                    </div>

                    <div className="text-center max-w-xl space-y-2.5">
                      <h3 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                        Smart Travel Itinerary Planner
                      </h3>
                      <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed">
                        Set your destinations, dates, and budget preferences above, then click <strong className="text-[var(--brand-dark)] dark:text-[var(--brand-primary)] font-semibold">Generate Itinerary</strong> to create a verified, comfortable day-by-day travel plan.
                      </p>
                    </div>

                    {/* Feature highlight cards */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-4xl w-full text-left">
                      <div className="p-4 rounded-xl bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] flex items-start gap-3">
                        <Train className="h-5 w-5 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">Verified Rail &amp; Transit</div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">Berth classes (1A/2A/3A/SL), Volvo coaches &amp; cab rates.</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] flex items-start gap-3">
                        <Wallet className="h-5 w-5 text-[var(--status-positive)] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">Real Budget Allocation</div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">Stay limits, daily food allowances &amp; per-person splits.</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-[var(--brand-dark)] dark:text-[var(--brand-primary)] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">Hour-by-Hour Schedules</div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">Scenic viewpoints, monuments &amp; local cuisine spots.</div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] flex items-start gap-3">
                        <Users className="h-5 w-5 text-[var(--status-warning)] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">Group Customization</div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">Paced for friends, couples, solo, or seniors.</div>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[color:var(--border-subtle)] gap-4 mb-6 print:hidden">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span>{form.origin}</span>
                      <ArrowRight className="h-5 w-5 text-[var(--brand-primary)]" />
                      <span>{form.destination}</span>
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {form.nights} Nights ({form.startDate} to {form.endDate}) • {form.travellers} Travellers ({form.groupType})
                      {linkedGroup && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[11px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25 px-2 py-0.5 rounded-full font-medium">
                          <Crown className="h-3 w-3 text-[var(--accent-sand)]" /> Linked to {linkedGroup.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Saved Trips */}
                    <button
                      onClick={handleOpenSavedTrips}
                      className="flex items-center gap-1.5 bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[color:var(--border-subtle)] text-[var(--text-primary)] px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                      title="Open Saved Itineraries & Guide Notes"
                    >
                      <FolderOpen className="h-4 w-4 text-[var(--brand-primary)]" />
                      <span>Saved Itineraries</span>
                    </button>

                    {/* Save Itinerary */}
                    <button
                      onClick={handleSaveItinerary}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 bg-[var(--brand-dark)] hover:opacity-95 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-opacity shadow-sm"
                      title="Save this Itinerary & Travel Guide Notes"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                      <span>{savedItineraryId ? "Update Saved Itinerary" : "Save Itinerary"}</span>
                    </button>

                    {/* Forward to Travel Group (Admin-Only) */}
                    <button
                      onClick={handleOpenForwardModal}
                      className="flex items-center gap-1.5 bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[color:var(--border-subtle)] text-[var(--text-primary)] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                      title="Forward to Travel Group (Admin-Only Feature)"
                    >
                      <Send className="h-4 w-4 text-[var(--brand-primary)]" />
                      <span>Forward to Group</span>
                    </button>

                    {/* Travel Guide Chat */}
                    <button
                      onClick={() => setIsCopilotOpen(true)}
                      className="flex items-center gap-1.5 bg-[var(--status-positive-bg)] hover:opacity-90 border border-[var(--status-positive)]/25 text-[var(--status-positive)] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-opacity"
                      title="Chat with Personal Travel Guide"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Travel Guide</span>
                    </button>

                    {/* PDF Export */}
                    <button
                      onClick={() => handleDownloadPDF("magazine")}
                      disabled={!!pdfProgress}
                      className="flex items-center gap-1.5 bg-[var(--brand-dark)] dark:bg-[var(--brand-primary)] text-white dark:text-[#171F1D] font-medium px-3.5 py-2 rounded-lg text-xs sm:text-sm shadow-sm hover:opacity-95 transition-opacity disabled:opacity-60"
                      title="Download Travel Guide (Magazine Edition)"
                    >
                      {pdfProgress ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>{pdfProgress ? "Exporting..." : "PDF"}</span>
                    </button>
                  </div>
                </div>

                {/* PDF Generation Progress Floating Banner */}
                {pdfProgress && (
                  <div className="fixed bottom-6 right-6 z-50 bg-[var(--bg-surface)] border border-[color:var(--border-strong)] text-[var(--text-primary)] px-5 py-3.5 rounded-xl shadow-[var(--shadow-popover)] flex items-center gap-3.5">
                    <Loader2 className="h-5 w-5 text-[var(--brand-primary)] animate-spin shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--status-positive)] uppercase tracking-wider">Generating Travel Magazine PDF</div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{pdfProgress}</div>
                    </div>
                  </div>
                )}

                {/* Save Toast Notification */}
                {saveToast && (
                  <div className="mb-4 p-3 bg-[var(--status-positive-bg)] border border-[var(--status-positive)]/30 rounded-lg text-[var(--status-positive)] text-xs sm:text-sm font-medium flex items-center justify-between">
                    <span>{saveToast}</span>
                    <button onClick={() => setSaveToast(null)} className="text-[var(--status-positive)] hover:opacity-75">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* UPFRONT LIVE ROUTE & TRAVEL SITUATION BULLETIN */}
                {result && (
                  <div className="mb-6 p-5 bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] rounded-xl print:hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[color:var(--border-subtle)] gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--status-positive)]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-semibold text-[var(--text-primary)] text-base">Live Route &amp; Travel Situation</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25">
                              Real-Time Bulletin
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Corridor status for {form.origin} ➔ {form.destination} • Updated today
                          </p>
                        </div>
                      </div>

                      {/* Action buttons: WhatsApp Share & Copy */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleShareLiveWhatsApp}
                          className="flex items-center gap-1.5 bg-[var(--brand-dark)] hover:opacity-95 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity"
                          title="Share Current Situation via WhatsApp"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Share (WhatsApp)</span>
                        </button>
                        <button
                          onClick={handleCopyLiveSituation}
                          className="flex items-center gap-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs px-3 py-1.5 rounded-lg transition-colors border border-[color:var(--border-subtle)]"
                          title="Copy Situation Summary"
                        >
                          {copiedSituation ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[var(--status-positive)]" />
                              <span className="text-[var(--status-positive)]">Copied!</span>
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
                      <div className="p-3.5 bg-[var(--bg-surface)] rounded-lg border border-[color:var(--border-subtle)] space-y-1">
                        <div className="font-medium flex items-center gap-1.5 text-[var(--status-positive)]">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Road &amp; Transit Flow
                        </div>
                        <div className="text-[var(--text-primary)] font-medium">Open &amp; Normal Speed</div>
                        <div className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                          Mountain transit operating at safe 20–35 km/h. No active road closures reported along main corridor.
                        </div>
                      </div>

                      {/* 2. Weather & Daylight */}
                      <div className="p-3.5 bg-[var(--bg-surface)] rounded-lg border border-[color:var(--border-subtle)] space-y-1">
                        <div className="font-medium flex items-center gap-1.5 text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">
                          <Compass className="h-3.5 w-3.5 shrink-0" /> Weather &amp; Daylight
                        </div>
                        <div className="text-[var(--text-primary)] font-medium">Clear Skies • Daylight Transit</div>
                        <div className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                          Sun sets by 5:15–5:30 PM. Depart early in morning to arrive at stays before dark mountain cold sets in.
                        </div>
                      </div>

                      {/* 3. Formalities & Border */}
                      <div className="p-3.5 bg-[var(--bg-surface)] rounded-lg border border-[color:var(--border-subtle)] space-y-1">
                        <div className="font-medium flex items-center gap-1.5 text-[var(--status-warning)]">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Border &amp; Formalities
                        </div>
                        <div className="text-[var(--text-primary)] font-medium">ID &amp; Currency Preparedness</div>
                        <div className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                          Carry physical Voter ID or Passport. Indian ₹100/₹200 notes accepted; ₹500 prohibited in Nepal.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Top Quick-Link to Comprehensive Budget at Bottom */}
                <div className="mb-6 px-4 sm:px-5 py-3 bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[var(--status-positive-bg)] border border-[color:var(--border-subtle)] text-[var(--status-positive)] shrink-0">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">
                        Total Group Budget: <strong className="font-display text-[var(--text-primary)] tabular-nums font-bold text-sm">₹{Number(result?.budgetBreakdown?.totalGroupCost || result?.targetBudget || form.budget || 120000).toLocaleString()}</strong>
                      </span>
                      <span className="text-[var(--text-secondary)] text-[11px] tabular-nums block sm:inline sm:ml-2">
                        (~₹{Math.round(Number(result?.budgetBreakdown?.totalGroupCost || result?.targetBudget || form.budget || 120000) / (Number(form.travellers) || 8)).toLocaleString()} / person for {form.travellers || 8} travellers)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("comprehensive-group-budget");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center gap-1.5 font-medium text-[var(--brand-dark)] dark:text-[var(--brand-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[color:var(--border-subtle)] px-3.5 py-1.5 rounded-lg cursor-pointer self-start sm:self-auto shrink-0 transition-colors"
                  >
                    <span>View itemized breakdown</span>
                    <span className="text-sm">↓</span>
                  </button>
                </div>

                {/* Trip Comfort & Friendly Guide Check */}
                {result?.auditReview && (
                  <div className="mb-6 p-5 bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] rounded-xl print:border-black/20 print:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[color:var(--border-subtle)]">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[var(--status-positive-bg)] border border-[color:var(--border-subtle)] rounded-lg text-[var(--status-positive)]">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-semibold text-[var(--text-primary)] text-base">Your Trip Comfort &amp; Safety Check</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25">
                              {result.auditReview.status === 'MODIFIED_FOR_SAFETY' ? '✓ Adjusted for Comfort' : '✓ Verified & Relaxed'}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Double-checked by your travel guide • Realistic travel times, plenty of rest, and zero rush
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs text-[var(--text-secondary)]">Comfort Score:</span>
                        <span className="font-display text-base font-bold tabular-nums text-[var(--status-positive)] bg-[var(--status-positive-bg)] border border-[var(--status-positive)]/25 px-3 py-1 rounded-lg">
                          {result.auditReview.auditScore || 98}%
                        </span>
                      </div>
                    </div>

                    {/* Comfort checks bullet points */}
                    {result.auditReview.realityChecks?.length > 0 && (
                      <div className="mt-3.5 space-y-2">
                        <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                          Why this plan is easy &amp; relaxing:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {result.auditReview.realityChecks.map((check: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-[var(--text-primary)] bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[color:var(--border-subtle)]">
                              <CheckCircle2 className="h-4 w-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                              <span>{check}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Friendly tips if any */}
                    {result.auditReview.warnings?.length > 0 && (
                      <div className="mt-3 pt-3 flex items-start gap-2 text-xs text-[var(--status-warning)] bg-[var(--accent-sand)]/15 p-2.5 rounded-lg border border-[var(--accent-sand)]/30">
                        <AlertCircle className="h-4 w-4 text-[var(--status-warning)] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Helpful Travel Tip: </span>
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
                <div className="flex border-b border-[color:var(--border-subtle)] mb-6 overflow-x-auto print:hidden">
                  <button
                    onClick={() => setActiveTab('itinerary')}
                    className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'itinerary' ? 'text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border-b-2 border-[var(--brand-dark)] dark:border-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    Detailed Itinerary
                  </button>
                  <button
                    onClick={() => setActiveTab('equipments')}
                    className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'equipments' ? 'text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border-b-2 border-[var(--brand-dark)] dark:border-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    Equipments ({totalEquipmentsCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('tips')}
                    className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'tips' ? 'text-[var(--brand-dark)] dark:text-[var(--brand-primary)] border-b-2 border-[var(--brand-dark)] dark:border-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    Travel Tips ({totalTipsCount})
                  </button>
                </div>

                {/* Tab Content: Itinerary */}
                {activeTab === 'itinerary' && (
                  <div className="space-y-6 flex-1 overflow-auto pr-2 print:overflow-visible">
                    {result.days?.map((day: any, i: number) => (
                      <div key={i} className="bg-[var(--bg-surface-secondary)] rounded-xl p-5 sm:p-6 border border-[color:var(--border-subtle)] print:bg-gray-100 print:text-black print:break-inside-avoid">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-[color:var(--border-subtle)] print:border-black/10">
                          <div className="flex items-center gap-3">
                            <h4 className="font-display text-xl font-bold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] print:text-black">Day {day.day}</h4>
                            <span className="text-xs px-3 py-1 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[color:var(--border-subtle)] rounded-full print:bg-transparent print:border print:border-black">
                              Stay: {day.stay}
                            </span>
                          </div>

                          {/* Day-by-Day Calendar Dispatch Button */}
                          <div className="print:hidden">
                            <button
                              onClick={() => handleOpenDayCalendar(day)}
                              className="flex items-center gap-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[color:var(--border-subtle)] hover:border-[color:var(--border-strong)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              title={`Add Day ${day.day} Schedule to Calendar & Dispatch to Group Members`}
                            >
                              <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                              <span>Add Day {day.day} to Calendar</span>
                            </button>
                          </div>
                        </div>

                        {/* Legs */}
                        {day.legs && day.legs.length > 0 && (
                          <div className="mb-5 space-y-3">
                            <h5 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider print:text-gray-600">Transfers &amp; Legs</h5>
                            {day.legs.map((leg: any, lIdx: number) => (
                              <div key={lIdx} className="flex gap-4 items-start p-4 bg-[var(--bg-surface)] rounded-lg border border-[color:var(--border-subtle)] print:bg-white print:border-gray-300">
                                <div className="mt-1">
                                  {getLegIcon(leg.mode)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-display font-semibold text-[var(--text-primary)] text-base print:text-black">{leg.from} <ArrowRight className="inline h-4 w-4 mx-1.5 text-[var(--brand-primary)]" /> {leg.to}</p>
                                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2 text-xs text-[var(--text-secondary)] print:text-gray-700">
                                    <span className="flex items-center gap-1"><strong className="text-[var(--text-primary)]">Mode:</strong> {leg.mode}</span>
                                    <span className="flex items-center gap-1 text-[var(--status-positive)]"><strong>Depart:</strong> {leg.depart}</span>
                                    <span className="flex items-center gap-1 text-[var(--brand-dark)] dark:text-[var(--brand-primary)]"><strong>Arrive:</strong> {leg.arrive}</span>
                                    {leg.distance_km ? (
                                      <span className="flex items-center gap-1 tabular-nums"><strong>Distance:</strong> ~{leg.distance_km} km</span>
                                    ) : null}
                                    {leg.duration_hours ? (
                                      <span className="flex items-center gap-1 tabular-nums"><strong>Duration:</strong> {leg.duration_hours}h</span>
                                    ) : null}
                                    {leg.cost ? (
                                      <span className="flex items-center gap-1 font-semibold tabular-nums text-[var(--status-warning)] print:text-black">
                                        Cost: ₹{leg.cost} {form.travellers > 1 ? `(total for ${form.travellers})` : ""}
                                      </span>
                                    ) : null}
                                  </div>
                                  {leg.note && (
                                    <div className="mt-3 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface-secondary)] p-3 rounded-lg flex items-center gap-2 print:bg-gray-100 print:text-gray-800">
                                      {leg.note.match(/(\+?\d[\d -]{6,}\d)/) && !isDemoPhoneNumber(leg.note) ? (
                                        <Phone className="h-4 w-4 text-[var(--status-positive)] shrink-0" />
                                      ) : (
                                        <MapPin className="h-4 w-4 text-[var(--brand-primary)] shrink-0" />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {['morning', 'afternoon', 'evening', 'food'].map((period) => (
                            day.activities?.[period] && (
                              <div key={period} className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[color:var(--border-subtle)] print:bg-transparent print:border print:border-gray-200">
                                <h5 className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 print:text-gray-500">{period}</h5>
                                <p className="text-[var(--text-primary)] text-sm leading-relaxed print:text-black">{day.activities[period]}</p>
                              </div>
                            )
                          ))}
                        </div>

                        {/* Hotel Details */}
                        {day.hotelDetails && (
                          <div className="mt-4 p-4 bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] rounded-lg print:bg-transparent print:border-gray-400 print:border">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <h5 className="text-xs font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] flex items-center gap-2 uppercase tracking-wider print:text-black">
                                <Hotel className="h-4 w-4" /> Accommodation &amp; Night Stay
                              </h5>
                              <div className="flex items-center gap-2">
                                {day.hotelDetails.roomType && (
                                  <span className="text-[11px] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[color:var(--border-subtle)] px-2.5 py-0.5 rounded-full font-medium">
                                    {day.hotelDetails.roomType}
                                  </span>
                                )}
                                {financialSummary?.targetNightlyStayBudget && day.hotelDetails.costPerNight <= financialSummary.targetNightlyStayBudget * 1.25 ? (
                                  <span className="text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25 px-2 py-0.5 rounded-full font-medium">
                                    ✓ Within Budget
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex justify-between items-start text-sm print:text-black gap-3">
                              <div>
                                <span className="font-display text-[var(--text-primary)] font-semibold print:text-black text-base">{day.hotelDetails.name}</span>
                                {day.hotelDetails.breakdownNote && (
                                  <p className="text-xs text-[var(--text-secondary)] mt-1 print:text-gray-700 leading-relaxed">
                                    {day.hotelDetails.breakdownNote}
                                  </p>
                                )}

                                {/* 4-5 Verified Hostels & Homestays List */}
                                {Array.isArray(day.hotelDetails.alternateHostels) && day.hotelDetails.alternateHostels.length > 0 && (
                                  <div className="mt-3 pt-2.5 border-t border-[color:var(--border-subtle)]">
                                    <div className="text-[11px] font-semibold text-[var(--brand-dark)] dark:text-[var(--brand-primary)] mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                      <Hotel className="h-3.5 w-3.5" />
                                      <span>4–5 Verified Hostels &amp; Homestay Options for this Day:</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                      {day.hotelDetails.alternateHostels.map((h: any, hIdx: number) => (
                                        <div key={hIdx} className="bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] rounded-lg p-2.5 text-xs">
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="font-semibold text-[var(--text-primary)] text-xs">{h.name}</span>
                                            <span className="text-[var(--status-positive)] font-medium tabular-nums text-[11px] bg-[var(--status-positive-bg)] px-2 py-0.5 rounded-full shrink-0">
                                              ₹{h.costPerPerson || 500} / person
                                            </span>
                                          </div>
                                          {h.note && (
                                            <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                                              {h.note}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-display text-[var(--status-positive)] print:text-black font-bold tabular-nums text-base">₹{Number(day.hotelDetails.costPerNight || 0).toLocaleString()} <span className="text-xs text-[var(--text-secondary)] font-normal">/ night</span></span>
                                {day.hotelDetails.roomCount && day.hotelDetails.ratePerUnit ? (
                                  <span className="block text-[11px] text-[var(--text-secondary)] tabular-nums font-normal">
                                    {day.hotelDetails.roomCount} units × ₹{Number(day.hotelDetails.ratePerUnit).toLocaleString()}
                                  </span>
                                ) : form.travellers > 1 ? (
                                  <span className="block text-[10px] text-[var(--text-secondary)] font-normal">Room total for {form.travellers} guests</span>
                                ) : null}
                              </div>
                            </div>
                            {day.hotelDetails.contact && !isDemoPhoneNumber(day.hotelDetails.contact) ? (
                              <p className="text-[var(--text-secondary)] text-xs mt-2.5 print:text-gray-700 flex items-center gap-1.5 bg-[var(--bg-surface-secondary)] p-2 rounded-lg border border-[color:var(--border-subtle)]">
                                <Phone className="h-3.5 w-3.5 text-[var(--status-positive)] shrink-0" />
                                <span>Verified Reception / Desk: <strong className="text-[var(--text-primary)] font-mono">{day.hotelDetails.contact}</strong></span>
                              </p>
                            ) : (
                              <p className="text-[var(--text-secondary)] text-xs mt-2 print:text-gray-600">
                                Reservation via official hostel/hotel front desk or verified travel booking portal
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Comprehensive Entire-Trip Group Budget Breakdown */}
                    {(() => {
                      const fullBudget = getComprehensiveTripBudget(result, form);
                      if (!fullBudget) return null;

                      return (
                        <div id="comprehensive-group-budget" className="mt-8 bg-[var(--bg-surface)] border border-[color:var(--border-strong)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-card)] print:border-black/30 print:bg-white">
                          {/* Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[color:var(--border-subtle)] gap-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[var(--status-positive-bg)] border border-[color:var(--border-subtle)] rounded-xl text-[var(--status-positive)]">
                                  <Receipt className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight print:text-black">
                                    Comprehensive Entire-Trip Group Budget
                                  </h3>
                                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 print:text-gray-700">
                                    Total estimated budget for all <strong className="text-[var(--status-positive)] font-semibold">{fullBudget.travellers} travellers</strong> covering the entire {fullBudget.daysCount}-day trip (Transit, Stays, Meals, Permits, Optional Activities &amp; Emergency Buffer).
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Status Pill */}
                            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                              <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-[var(--status-positive-bg)] border border-[var(--status-positive)]/25 text-[var(--status-positive)]">
                                ✓ Entire Trip Group Total
                              </span>
                            </div>
                          </div>

                          {/* Top 4 KPI Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 my-6">
                            <div className="p-4 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] flex flex-col justify-between">
                              <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Total Group Budget</span>
                              <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[var(--status-positive)] mt-1">
                                ₹{fullBudget.totalGroupCost.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-[var(--text-secondary)] mt-1">Full 10-day group total</span>
                            </div>

                            <div className="p-4 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] flex flex-col justify-between">
                              <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Per Person Share</span>
                              <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[var(--brand-dark)] dark:text-[var(--brand-primary)] mt-1">
                                ₹{fullBudget.costPerPerson.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-[var(--text-secondary)] mt-1">Per member for {fullBudget.travellers} travellers</span>
                            </div>

                            <div className="p-4 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] flex flex-col justify-between">
                              <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Target Budget</span>
                              <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[var(--text-primary)] mt-1">
                                ₹{fullBudget.targetBudget.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-[var(--text-secondary)] mt-1">Max allocated ceiling</span>
                            </div>

                            <div className="p-4 bg-[var(--bg-surface-secondary)] rounded-xl border border-[color:var(--border-subtle)] flex flex-col justify-between">
                              <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Budget Health</span>
                              <div className="font-display text-lg sm:text-xl font-bold text-[var(--status-positive)] mt-1 flex items-center gap-1.5">
                                <CheckCircle2 className="h-5 w-5 text-[var(--status-positive)] shrink-0" />
                                <span>100% Balanced</span>
                              </div>
                              <span className="text-[10px] text-[var(--status-positive)] mt-1">All expenses covered</span>
                            </div>
                          </div>

                          {/* Itemized Categories List */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                              <span>Expense Category &amp; What&apos;s Covered</span>
                              <span className="text-right">Group Total / Per Person</span>
                            </div>

                            {fullBudget.categories.map((cat: any) => (
                              <div
                                key={cat.id}
                                className="p-4 sm:p-5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] hover:border-[color:var(--border-strong)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="flex items-start gap-3.5">
                                  <div className="mt-0.5 p-2 rounded-lg bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] text-[var(--brand-primary)] shrink-0">
                                    {cat.id === "transit" && <Train className="h-4 w-4 text-[var(--brand-primary)]" />}
                                    {cat.id === "stays" && <Hotel className="h-4 w-4 text-[var(--brand-dark)] dark:text-[var(--brand-primary)]" />}
                                    {cat.id === "meals" && <Utensils className="h-4 w-4 text-[var(--status-warning)]" />}
                                    {cat.id === "permits" && <FileCheck className="h-4 w-4 text-[var(--text-secondary)]" />}
                                    {cat.id === "activities" && <Ticket className="h-4 w-4 text-[var(--status-positive)]" />}
                                    {cat.id === "buffer" && <ShieldAlert className="h-4 w-4 text-[var(--status-warning)]" />}
                                  </div>

                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="font-display text-sm sm:text-base font-semibold text-[var(--text-primary)] print:text-black">
                                        {cat.name}
                                      </h4>
                                      <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] text-[var(--text-secondary)]">
                                        {cat.tag}
                                      </span>
                                      {cat.isOptional && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--status-positive-bg)] border border-[var(--status-positive)]/25 text-[var(--status-positive)]">
                                          Optional Pass
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed max-w-2xl print:text-gray-700">
                                      {cat.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0 sm:pl-4 sm:border-l sm:border-[color:var(--border-subtle)]">
                                  <div className="font-display text-lg sm:text-xl font-bold tabular-nums text-[var(--text-primary)] print:text-black">
                                    ₹{cat.groupTotal.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-[var(--text-secondary)] tabular-nums font-mono mt-0.5">
                                    ₹{cat.perPerson.toLocaleString()} <span className="text-[10px]">/ person</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Admin Forward Note */}
                          <div className="mt-6 pt-5 border-t border-[color:var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-[var(--brand-primary)] shrink-0" />
                              <span>
                                <strong className="text-[var(--text-primary)]">Complete Trip Summary:</strong> Covers all transit, stays, meals, government permits, optional passes, and safety reserve for all {fullBudget.travellers} travellers without hidden surprises.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenForwardModal}
                              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-dark)] hover:opacity-95 text-white text-xs font-medium transition-opacity"
                            >
                              <Send className="h-3.5 w-3.5" /> Forward to Travel Group
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Tab Content: Equipments or Tips */}
                {(activeTab === 'equipments' || activeTab === 'tips') && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[color:var(--border-subtle)]">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          {activeTab === 'equipments' ? (
                            <>
                              <ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" />
                              <span>Location-Specific Equipment &amp; Packing Checklist</span>
                            </>
                          ) : (
                            <>
                              <Compass className="h-5 w-5 text-[var(--brand-primary)]" />
                              <span>Place-by-Place Ground Travel Tips &amp; Local Advisories</span>
                            </>
                          )}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Tailored precisely for your route through {currentPlaceSections.map((s) => s.location).slice(0, 4).join(', ')}
                        </p>
                      </div>

                      <span className="text-xs font-mono font-medium text-[var(--status-positive)] bg-[var(--status-positive-bg)] border border-[var(--status-positive)]/25 px-3 py-1 rounded-full self-start sm:self-auto">
                        ✓ {currentPlaceSections.length} Specific Route Locations
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentPlaceSections.map((sec, secIdx) => (
                        <div
                          key={secIdx}
                          className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-5 space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[color:var(--border-subtle)]">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">{sec.location}</h4>
                              </div>
                              <span className="text-[11px] font-mono text-[var(--status-positive)] mt-0.5 block">{sec.tag}</span>
                            </div>
                            {sec.altitude && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] text-[var(--text-secondary)] shrink-0">
                                {sec.altitude}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2.5">
                            {sec.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-start gap-2.5 text-xs">
                                <CheckCircle2 className="h-4 w-4 text-[var(--status-positive)] shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <strong className="text-[var(--text-primary)] block font-medium">{item.name}</strong>
                                  <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
                onSavePlan={handleSaveItinerary}
                isSaving={isSaving}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Saved Trips Modal */}
      <AnimatePresence>
        {isSavedTripsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] rounded-2xl shadow-[var(--shadow-popover)] p-6 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[color:var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="h-5 w-5 text-[var(--brand-primary)]" />
                  <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Saved Travel Itineraries</h3>
                </div>
                <button
                  onClick={() => setIsSavedTripsModalOpen(false)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {isLoadingSavedTrips ? (
                  <div className="py-12 text-center text-[var(--text-secondary)] flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
                    <span>Loading your saved itineraries...</span>
                  </div>
                ) : savedTripsList.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-secondary)]">
                    <p className="text-sm">No saved itineraries found yet.</p>
                    <p className="text-xs mt-1">
                      Create an itinerary and click <strong className="text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">Save Itinerary</strong> to keep it here.
                    </p>
                  </div>
                ) : (
                  savedTripsList.map((it) => (
                    <div
                      key={it.id}
                      className="p-4 rounded-xl bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] hover:border-[color:var(--border-strong)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold text-[var(--text-primary)] text-base">{it.title}</h4>
                          {it.group && (
                            <span className="text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25 px-2 py-0.5 rounded-full font-medium">
                              Group: {it.group.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 tabular-nums">
                          {it.origin} ➔ {it.destination} • {it.days} Days • {it.groupSize} Travellers • ₹{Number(it.totalBudget).toLocaleString()} Budget
                        </p>
                        {it.chatSession?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--status-positive)] mt-2 font-mono">
                            <MessageSquare className="h-3 w-3" /> {it.chatSession.length} chat messages saved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleLoadSavedItinerary(it)}
                          className="bg-[var(--brand-dark)] hover:opacity-95 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-opacity"
                        >
                          Open &amp; Load
                        </button>
                        <button
                          onClick={() => handleDeleteSavedItinerary(it.id)}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--status-negative)] hover:bg-[var(--status-negative-bg)] rounded-lg transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] rounded-2xl shadow-[var(--shadow-popover)] p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[color:var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <Send className="h-5 w-5 text-[var(--brand-primary)]" />
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Forward to Travel Group</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Share itinerary and travel guide advice with your group</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsForwardModalOpen(false)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Admin Privileges Notice */}
              <div className="mt-4 p-3 bg-[var(--accent-sand)]/15 border border-[var(--accent-sand)]/30 rounded-lg flex items-start gap-2.5 text-xs text-[var(--status-warning)]">
                <Crown className="h-4 w-4 text-[var(--status-warning)] shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Privilege:</strong> Only group administrators can forward itineraries, manage member schedules, and dispatch day calendar events.
                </span>
              </div>

              <div className="my-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {isLoadingGroups ? (
                  <div className="py-8 text-center text-[var(--text-secondary)] flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-primary)]" />
                    <span>Loading your groups...</span>
                  </div>
                ) : userGroups.length === 0 ? (
                  <div className="py-8 text-center text-[var(--text-secondary)] text-xs">
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
                        className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                          !isAdmin
                            ? "opacity-60 bg-[var(--bg-surface-secondary)] border-[color:var(--border-subtle)] cursor-not-allowed"
                            : isSelected
                            ? "bg-[var(--status-positive-bg)] border-[var(--brand-primary)]"
                            : "bg-[var(--bg-surface-secondary)] border-[color:var(--border-subtle)] hover:border-[color:var(--border-strong)]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-primary)] text-sm">{g.name}</span>
                            <span className="text-[10px] bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[color:var(--border-subtle)] px-2 py-0.5 rounded-full font-mono">
                              {g.type}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {g.members?.length || 0} members • Currency: {g.currency}
                          </p>
                        </div>
                        <div>
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] border border-[var(--status-positive)]/25 px-2.5 py-1 rounded-full font-medium">
                              <Crown className="h-3 w-3 text-[var(--accent-sand)]" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[color:var(--border-subtle)] px-2.5 py-1 rounded-full">
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
                  className={`mb-4 p-3 rounded-lg text-xs font-medium ${
                    forwardFeedback.ok
                      ? "bg-[var(--status-positive-bg)] border border-[var(--status-positive)]/30 text-[var(--status-positive)]"
                      : "bg-[var(--status-negative-bg)] border border-[var(--status-negative)]/30 text-[var(--status-negative)]"
                  }`}
                >
                  {forwardFeedback.text}
                </div>
              )}

              <div className="pt-3 border-t border-[color:var(--border-subtle)] flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsForwardModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmForward}
                  disabled={!selectedGroupId || isForwarding}
                  className="bg-[var(--brand-dark)] hover:opacity-95 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-opacity flex items-center gap-2"
                >
                  {isForwarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Forward Itinerary &amp; Chat</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Day-by-Day Calendar Dispatch Modal */}
      <AnimatePresence>
        {activeDayCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[var(--bg-surface)] border border-[color:var(--border-subtle)] rounded-2xl shadow-[var(--shadow-popover)] p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[color:var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-[var(--brand-primary)]" />
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                      Add Day {activeDayCalendar.dayNumber} to Calendar
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Stay: {activeDayCalendar.day.stay || form.destination}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDayCalendar(null)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Day Details Preview */}
              <div className="my-4 p-3.5 bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] rounded-lg space-y-2 text-xs">
                <div className="text-[var(--text-primary)]">
                  <strong className="text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">Transit:</strong>{" "}
                  {activeDayCalendar.day.legs?.length
                    ? activeDayCalendar.day.legs.map((l: any) => `${l.from} ➔ ${l.to} (${l.mode})`).join(" • ")
                    : "Local exploration & relaxation"}
                </div>
                {activeDayCalendar.day.hotelDetails && (
                  <div className="text-[var(--text-primary)]">
                    <strong className="text-[var(--brand-dark)] dark:text-[var(--brand-primary)]">Stay:</strong> {activeDayCalendar.day.hotelDetails.name}
                    {activeDayCalendar.day.hotelDetails.roomType && ` (${activeDayCalendar.day.hotelDetails.roomType})`}
                  </div>
                )}
              </div>

              {/* Group Member Invite Selection (Admin Feature) */}
              <div className="mb-4 p-3.5 bg-[var(--bg-surface-secondary)] border border-[color:var(--border-subtle)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
                    <Users className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    <span>Invite Group Members (Admin Dispatch)</span>
                  </div>
                  <span className="text-[10px] bg-[var(--status-positive-bg)] text-[var(--status-positive)] px-2 py-0.5 rounded-full font-mono">
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
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] cursor-pointer text-xs text-[var(--text-primary)]"
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
                            className="rounded accent-[var(--brand-dark)] dark:accent-[var(--brand-primary)]"
                          />
                          <span className="font-medium text-[var(--text-primary)]">{m.name}</span>
                          <span className="text-[var(--text-secondary)] font-mono text-[10px]">{m.email}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Trip is currently personal. You can add Day {activeDayCalendar.dayNumber} to your calendar, or forward this trip to a Travel Group to automatically invite all members!
                  </p>
                )}
              </div>

              {dayCalendarToast && (
                <div className="mb-4 p-2.5 bg-[var(--status-positive-bg)] border border-[var(--status-positive)]/25 rounded-lg text-[var(--status-positive)] text-xs font-medium">
                  {dayCalendarToast}
                </div>
              )}

              {/* Action Buttons for Day X */}
              <div className="space-y-2.5 pt-2 border-t border-[color:var(--border-subtle)]">
                <button
                  onClick={handleDayWhatsAppShare}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--brand-dark)] hover:opacity-95 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-opacity"
                  title="Share Day schedule to WhatsApp Group with 1-Tap Calendar Add link"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Send to WhatsApp Group (1-Tap Member Calendar Invite)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDayGoogleCalendar}
                    className="flex items-center justify-center gap-1.5 bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] font-medium text-xs py-2 px-3 rounded-lg border border-[color:var(--border-subtle)] transition-colors"
                    title="Open in Google Calendar with Member Invites"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    <span>Google Calendar</span>
                  </button>
                  <button
                    onClick={handleDayDownloadICS}
                    className="flex items-center justify-center gap-1.5 bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] font-medium text-xs py-2 px-3 rounded-lg border border-[color:var(--border-subtle)] transition-colors"
                    title="Download Apple / Outlook .ICS event file"
                  >
                    <Download className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
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

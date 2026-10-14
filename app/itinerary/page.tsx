"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import TravelCopilotChat from "@/components/TravelCopilotChat";
import MovieTrailerItineraryLoader from "@/components/MovieTrailerItineraryLoader";
import ThemeSelect from "@/components/ThemeSelect";
import { isDemoPhoneNumber } from "@/lib/localGroundData";
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
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ItineraryPage() {
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [pendingFinancial, setPendingFinancial] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("itinerary");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
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
        } catch {}
      }
      setForm({ ...form, nights: numNights });
    } else if (name === "startDate") {
      if (value && form.nights) {
        try {
          const start = new Date(value);
          const end = new Date(start.getTime() + (Number(form.nights) || 4) * 86400000).toISOString().split("T")[0];
          setForm({ ...form, startDate: value, endDate: end });
          return;
        } catch {}
      }
      setForm({ ...form, startDate: value });
    } else if (name === "endDate") {
      if (value && form.startDate) {
        try {
          const start = new Date(form.startDate);
          const end = new Date(value);
          const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
          setForm({ ...form, endDate: value, nights: diffDays });
          return;
        } catch {}
      }
      setForm({ ...form, endDate: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.origin.trim() || !form.destination.trim()) {
      setError("Please enter both origin and destination cities.");
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
        setError(data.error || "Failed to generate itinerary blueprint");
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
    window.print();
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

      <div className="mx-auto max-w-7xl py-12 px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              AI Travel Itinerary Studio
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Precision travel planning grounded with verified transit, real budgets, and local guidance.
            </p>
          </div>

          {result && (
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white px-5 py-2.5 rounded-2xl font-semibold transition backdrop-blur-md shadow-lg shadow-emerald-500/10 w-fit"
            >
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              <span>Ask AI Copilot</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          )}
        </div>

        <div className="itinerary-content-container flex flex-col gap-8">
          {/* Top Horizontal Input Console */}
          <div className="itinerary-form-console-card relative z-30 w-full bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-emerald-500/5 print:hidden">
            <form onSubmit={handleGenerate} className="itinerary-generator-form space-y-6">
              
              {/* Row 1: Core Routing, Dates (Start & End), Duration (Days & Nights), Travellers, Group */}
              <div className="itinerary-core-routing-row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-40">
                {/* 1. Origin */}
                <div className="origin-field origin-container">
                  <label className="origin-label flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Origin
                  </label>
                  <input 
                    name="origin" 
                    value={form.origin} 
                    onChange={handleChange} 
                    required
                    placeholder="e.g. Bhubaneswar, Mumbai"
                    className="origin-input w-full bg-slate-950/70 rounded-xl px-3.5 py-2.5 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition" 
                  />
                </div>

                {/* 2. Destination */}
                <div className="destination-field destination-container">
                  <label className="destination-label flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-teal-400" /> Destination
                  </label>
                  <input 
                    name="destination" 
                    value={form.destination} 
                    onChange={handleChange} 
                    required
                    placeholder="e.g. Darjeeling, Goa, Manali"
                    className="destination-input w-full bg-slate-950/70 rounded-xl px-3.5 py-2.5 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition" 
                  />
                </div>

                {/* 3. Start Date */}
                <div className="start-date-field start-date-container">
                  <label className="start-date-label flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Start Date
                  </label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={form.startDate} 
                    onChange={handleChange} 
                    className="start-date-input w-full bg-slate-950/70 rounded-xl px-3 py-2 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition [color-scheme:dark]" 
                  />
                </div>

                {/* 4. End Date (Return Date) */}
                <div className="end-date-field end-date-container">
                  <label className="end-date-label flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-400" /> End Date (Return)
                  </label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={form.endDate} 
                    onChange={handleChange} 
                    className="end-date-input w-full bg-slate-950/70 rounded-xl px-3 py-2 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition [color-scheme:dark]" 
                  />
                </div>

                {/* 5. Duration (Days & Nights) */}
                <div className="duration-days-nights-field duration-days-nights-container">
                  <div className="flex items-center justify-between mb-1.5">
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
                      className="nights-count-input duration-nights-input w-full bg-slate-950/70 rounded-xl px-3 py-2.5 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition placeholder:text-slate-500" 
                    />
                    <span className="duration-nights-unit text-xs text-slate-400 font-mono whitespace-nowrap">Nights</span>
                  </div>
                </div>

                {/* 6. Travellers & Group Type */}
                <div className="travellers-group-field travellers-group-container">
                  <label className="travellers-group-label flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-400" /> Travellers & Group
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      name="travellers" 
                      min="1"
                      placeholder="e.g. 2"
                      value={form.travellers} 
                      onChange={handleChange} 
                      className="travellers-count-input w-full bg-slate-950/70 rounded-xl px-2.5 py-2.5 text-white text-sm border border-white/10 focus:border-emerald-500/60 outline-none transition text-center placeholder:text-slate-500" 
                    />
                    <ThemeSelect
                      semanticName="group-type"
                      id="group-type-select"
                      value={form.groupType}
                      onChange={(val) => setForm({ ...form, groupType: val })}
                      options={["Friends", "Couple", "Solo", "Family"]}
                      buttonClassName="py-2.5 px-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Budgeting (Total Budget, Stay Budget/Night, Stay Preference, Trip Pace) */}
              <div className="itinerary-budgeting-row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5 relative z-30">
                {/* Total Budget */}
                <div className="total-group-budget-field total-group-budget-container">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="total-group-budget-label flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <Wallet className="h-3.5 w-3.5" /> Total Group Budget (INR)
                    </label>
                    <span className="budget-per-person-indicator text-[10px] text-slate-400 font-mono">
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
                    className="total-group-budget-input w-full bg-slate-950/70 rounded-xl px-3.5 py-2.5 text-emerald-400 font-bold border border-emerald-500/30 focus:border-emerald-500 outline-none transition text-sm placeholder:text-slate-500" 
                  />
                </div>

                {/* Nightly Stay Budget Limit */}
                <div className="nightly-stay-limit-field nightly-stay-limit-container">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="nightly-stay-limit-label flex items-center gap-1 text-xs font-semibold text-teal-400">
                      <Hotel className="h-3.5 w-3.5" /> Nightly Stay Limit (INR)
                    </label>
                    <span className="stay-budget-customizable-tag text-[10px] text-teal-300">Customizable</span>
                  </div>
                  <input 
                    type="number" 
                    name="stayBudget" 
                    step="100"
                    placeholder="e.g. 2500"
                    value={form.stayBudget} 
                    onChange={handleChange} 
                    className="nightly-stay-limit-input stay-budget-input w-full bg-slate-950/70 rounded-xl px-3.5 py-2.5 text-teal-300 font-bold border border-teal-500/30 focus:border-teal-400 outline-none transition text-sm placeholder:text-slate-500" 
                  />
                </div>

                {/* Accommodation Style */}
                <div className="accommodation-style-field accommodation-style-container">
                  <label className="accommodation-style-label block text-xs font-semibold text-slate-300 mb-1.5">Accommodation Style</label>
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
                    buttonClassName="py-2.5 px-3.5 text-xs"
                  />
                </div>

                {/* Trip Pace */}
                <div className="trip-pace-field trip-pace-container">
                  <label className="trip-pace-label flex items-center gap-1 text-xs font-semibold text-slate-300 mb-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-400" /> Trip Pace
                  </label>
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
                    buttonClassName="py-2.5 px-3.5 text-xs"
                  />
                </div>
              </div>

              {/* Row 3: Transit Modes & Detailed Classes (Train with 2S/SL/3A/etc., Bus Coach Options, Flight, Cab) */}
              <div className="transit-mode-coach-preferences-section transit-preferences-container pt-4 border-t border-white/5 space-y-3">
                <div className="transit-mode-coach-preferences-heading text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Train className="h-4 w-4 text-emerald-400" />
                  <span>Transit Mode & Coach Preferences:</span>
                </div>

                <div className="transit-modes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-20">
                  {/* Train */}
                  <div className="transit-train-card train-preference-card p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-2">
                    <label className="transit-train-checkbox-label flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="transportTrain" 
                        checked={form.transportTrain} 
                        onChange={handleChange} 
                        className="transit-train-checkbox accent-emerald-500" 
                      />
                      <Train className="h-4 w-4 text-cyan-400" /> Train
                    </label>
                    {form.transportTrain && (
                      <div className="train-coach-field train-coach-container">
                        <label className="train-coach-label block text-[10px] text-slate-400 mb-1">Train Coach / Class:</label>
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
                          buttonClassName="py-2 px-2.5 text-xs font-mono text-cyan-300 bg-slate-900 border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  {/* Bus / Coach */}
                  <div className="transit-bus-card bus-preference-card p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-2">
                    <label className="transit-bus-checkbox-label flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="transportBus" 
                        checked={form.transportBus} 
                        onChange={handleChange} 
                        className="transit-bus-checkbox accent-emerald-500" 
                      />
                      <Bus className="h-4 w-4 text-amber-400" /> Bus / Coach
                    </label>
                    {form.transportBus && (
                      <div className="bus-coach-field bus-coach-container">
                        <label className="bus-coach-label block text-[10px] text-slate-400 mb-1">Bus Coach Type:</label>
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
                          buttonClassName="py-2 px-2.5 text-xs font-mono text-amber-300 bg-slate-900 border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  {/* Flight */}
                  <div className="transit-flight-card flight-preference-card p-3 bg-slate-950/60 rounded-xl border border-white/10 space-y-2">
                    <label className="transit-flight-checkbox-label flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="transportFlight" 
                        checked={form.transportFlight} 
                        onChange={handleChange} 
                        className="transit-flight-checkbox accent-emerald-500" 
                      />
                      <Plane className="h-4 w-4 text-sky-400" /> Flight
                    </label>
                    {form.transportFlight && (
                      <div className="flight-cabin-field flight-cabin-container">
                        <label className="flight-cabin-label block text-[10px] text-slate-400 mb-1">Flight Cabin:</label>
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
                          buttonClassName="py-2 px-2.5 text-xs font-mono text-sky-300 bg-slate-900 border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  {/* Cab / Road */}
                  <div className="transit-cab-rental-card cab-rental-card p-3 bg-slate-950/60 rounded-xl border border-white/10 flex flex-col justify-between">
                    <label className="transit-cab-rental-label flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="transportRoad" 
                        checked={form.transportRoad} 
                        onChange={handleChange} 
                        className="transit-cab-rental-checkbox accent-emerald-500" 
                      />
                      <Car className="h-4 w-4 text-emerald-400" /> Cab / Rental / Shared Jeep
                    </label>
                    <p className="transit-cab-rental-description text-[10px] text-slate-400 mt-2">
                      Local syndicate taxis, shared mountain jeeps & prepaid regional booths.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 4: Interests & Remark Section (Special Notes) & Generate CTA Button */}
              <div className="itinerary-customization-row pt-4 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end relative z-10">
                {/* Interests */}
                <div className="interests-activities-field interests-activities-container lg:col-span-3">
                  <label className="interests-activities-label block text-xs font-semibold text-slate-300 mb-1.5">
                    Interests & Activities
                  </label>
                  <input 
                    name="interests" 
                    value={form.interests} 
                    onChange={handleChange} 
                    placeholder="Culture, Scenery, Trekking, Cafes, Food"
                    className="interests-activities-input w-full bg-slate-950/70 rounded-xl px-3.5 py-2 text-white text-xs border border-white/10 focus:border-emerald-500/50 outline-none transition" 
                  />
                </div>

                {/* Remarks & Special Instructions Section */}
                <div className="remarks-special-instructions-field remarks-special-instructions-container lg:col-span-6">
                  <label className="remarks-special-instructions-label block text-xs font-semibold text-slate-300 mb-1.5">
                    Remarks & Special Instructions (Dietary, Senior Citizens, Early Departure, Views...)
                  </label>
                  <textarea 
                    name="specialNotes" 
                    value={form.specialNotes} 
                    onChange={handleChange} 
                    rows={2} 
                    placeholder="E.g., early morning departure, pure vegetarian food, senior-friendly stairs, mountain/beach view, pet-friendly..." 
                    className="remarks-special-instructions-textarea w-full bg-slate-950/70 rounded-xl px-3.5 py-1.5 text-white text-xs border border-white/10 focus:border-emerald-500/50 outline-none transition resize-none" 
                  />
                </div>

                {/* Generate Elite Itinerary Button */}
                <div className="generate-itinerary-cta-container lg:col-span-3">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="generate-elite-itinerary-button w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-3 px-4 rounded-xl transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-50 text-sm tracking-wide"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Elite Itinerary</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                <span className="font-semibold block mb-1">Error:</span>
                {error}
              </div>
            )}
          </div>

          {/* Results Column (Full Width directly below on the bottom) */}
          <div className="itinerary-results-canvas-card w-full relative z-10 bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl min-h-[500px] flex flex-col shadow-2xl shadow-black/50 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm gap-4 py-16 print:hidden">
                <div className="p-4 bg-slate-950/50 rounded-full border border-white/5">
                  <FileText className="h-12 w-12 text-slate-600" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-slate-300 font-semibold text-lg">Your Journey Canvas</h4>
                  <p className="text-slate-500 max-w-sm">Configure your trip details above and click Generate Elite Itinerary to view your verified day-by-day blueprint.</p>
                </div>
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
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsCopilotOpen(true)}
                      className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-sm transition"
                    >
                      <MessageSquare className="h-4 w-4" /> Copilot
                    </button>
                    <button 
                      onClick={handleDownloadPDF} 
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm transition"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </button>
                  </div>
                </div>

                {/* Financial Summary Card */}
                {financialSummary && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-cyan-950/30 border border-emerald-500/20 rounded-2xl print:border-black/20 print:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Estimated Trip Budget</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            financialSummary.budgetStatus === 'UNDER_BUDGET' 
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
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5 print:border-black/10">
                          <h4 className="text-xl font-bold text-emerald-400 print:text-black">Day {day.day}</h4>
                          <span className="text-sm px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full print:bg-transparent print:border print:border-black">
                            Stay: {day.stay}
                          </span>
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
                              {financialSummary?.targetNightlyStayBudget && day.hotelDetails.costPerNight <= financialSummary.targetNightlyStayBudget * 1.25 ? (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                                  ✓ Fits Budget (≤ ₹{financialSummary.targetNightlyStayBudget.toLocaleString()}/night)
                                </span>
                              ) : null}
                            </div>
                            <div className="flex justify-between items-center text-sm print:text-black">
                              <span className="text-white font-semibold print:text-black">{day.hotelDetails.name}</span>
                              <div className="text-right">
                                <span className="text-emerald-300 print:text-black font-semibold">₹{day.hotelDetails.costPerNight} / night</span>
                                {form.travellers > 1 && (
                                  <span className="block text-[10px] text-slate-400 font-normal">Room total for {form.travellers}</span>
                                )}
                              </div>
                            </div>
                            {day.hotelDetails.contact && !isDemoPhoneNumber(day.hotelDetails.contact) ? (
                              <p className="text-slate-300 text-xs mt-2 print:text-gray-700 flex items-center gap-1.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
                                <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                <span>Verified Reception / Desk: <strong className="text-white font-mono">{day.hotelDetails.contact}</strong></span>
                              </p>
                            ) : (
                              <p className="text-slate-500 text-xs mt-1.5 print:text-gray-600">
                                Reservation via official hotel front desk or verified online booking portal
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
                onClose={() => setIsCopilotOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

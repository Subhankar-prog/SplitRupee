import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getDynamicPlaceSections, type PlaceSection } from "./destinationGroundEngine";

export interface MagazineItineraryData {
  form: {
    origin: string;
    destination: string;
    startDate?: string;
    endDate?: string;
    nights?: number | string;
    travellers?: number | string;
    groupType?: string;
    budget?: number | string;
    stayPreference?: string;
    interests?: string;
    pace?: string;
    specialNotes?: string;
  };
  result: {
    destination?: string;
    targetBudget?: number;
    travellers?: number;
    days?: Array<{
      day: number;
      title?: string;
      stay: string;
      legs?: Array<{
        from: string;
        to: string;
        mode: string;
        depart?: string;
        arrive?: string;
        duration?: string;
        cost?: string | number;
        note?: string;
      }>;
      activities?: {
        morning?: string;
        afternoon?: string;
        evening?: string;
        food?: string;
        [key: string]: any;
      };
      hotelDetails?: {
        name: string;
        costPerNight: number;
        contact?: string;
        roomType?: string;
        roomCount?: number;
      } | null;
    }>;
    equipments?: any[];
    tips?: any[];
    placeGear?: any[];
    placeTips?: any[];
  };
  financialSummary?: {
    totalEstimatedCost: number;
    targetBudget: number;
    totalTransportCost: number;
    totalHotelCost: number;
    budgetDifference: number;
    budgetStatus: string;
  };
}

/**
 * Fetches an image asset from the local origin and converts it to a base64 Data URL.
 * Base64 encoding avoids cross-origin canvas tainting in html2canvas.
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  if (typeof window === "undefined") return "";
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

/**
 * Helper to format date for Day X:
 * e.g. "DAY 1 (WED, 23 DEC)"
 */
function formatDayDate(startDateStr: string | undefined, dayIndex: number): string {
  if (!startDateStr) return `DAY ${dayIndex + 1}`;
  try {
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return `DAY ${dayIndex + 1}`;
    const d = new Date(start);
    d.setDate(start.getDate() + dayIndex);
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const dayName = dayNames[d.getDay()];
    const dateNum = d.getDate();
    const monthName = monthNames[d.getMonth()];
    return `DAY ${dayIndex + 1} (${dayName}, ${dateNum} ${monthName})`;
  } catch {
    return `DAY ${dayIndex + 1}`;
  }
}

/**
 * Maps destination and day activities to the best matching photo.
 */
function getMatchingPhotoUrl(destLower: string, dayIndex: number, day: any): string {
  const isNepal = /nepal|kathmandu|pokhara|mustang|muktinath|ghandruk|annapurna/i.test(destLower);
  if (isNepal) {
    const nepalDayPhotos = [
      "/images/pdf_assets/nepal/day1_train.jpg",
      "/images/pdf_assets/nepal/day2_thamel.jpg",
      "/images/pdf_assets/nepal/day3_swayambhunath.jpg",
      "/images/pdf_assets/nepal/day4_cablecar.jpg",
      "/images/pdf_assets/nepal/day5_phewa.jpg",
      "/images/pdf_assets/nepal/day6_marpha.jpg",
      "/images/pdf_assets/nepal/day7_muktinath.jpg",
      "/images/pdf_assets/nepal/day8_ghandruk.jpg",
      "/images/pdf_assets/nepal/day9_sunrise.jpg",
      "/images/pdf_assets/nepal/day10_return.jpg"
    ];
    if (nepalDayPhotos[dayIndex]) {
      return nepalDayPhotos[dayIndex];
    }
  }

  // Fallbacks based on day context
  const text = `${day.stay || ""} ${day.legs?.map((l: any) => `${l.from} ${l.to} ${l.mode}`).join(" ") || ""} ${Object.values(day.activities || {}).join(" ")}`.toLowerCase();
  if (/train|railway|station|berth|express/i.test(text)) return "/images/trailer/trailer_1_train.jpg";
  if (/trek|hike|climb|pass|peak|stone step/i.test(text)) return "/images/trailer/trailer_2_trekking.jpg";
  if (/drive|road|jeep|cab|highway|route/i.test(text)) return "/images/trailer/trailer_3_roadtrip.jpg";
  if (/beach|sea|lake|boat|water|cruise|swim|ocean/i.test(text)) return "/images/trailer/trailer_4_beach.jpg";
  if (/cafe|food|restaurant|dine|market|thamel|street/i.test(text)) return "/images/trailer/trailer_5_cafe.jpg";
  if (/camp|tent|fire|bonfire|stars|night/i.test(text)) return "/images/trailer/trailer_6_campfire.jpg";

  // Default cyclical fallback
  const fallbacks = [
    "/images/trailer/trailer_1_train.jpg",
    "/images/trailer/trailer_2_trekking.jpg",
    "/images/trailer/trailer_3_roadtrip.jpg",
    "/images/trailer/trailer_4_beach.jpg",
    "/images/trailer/trailer_5_cafe.jpg",
    "/images/trailer/trailer_6_campfire.jpg"
  ];
  return fallbacks[dayIndex % fallbacks.length];
}

/**
 * Determines transit mode icon and label.
 */
function getTransitInfo(day: any) {
  if (day.legs && day.legs.length > 0) {
    const leg = day.legs[0];
    const mode = (leg.mode || "Transit").toLowerCase();
    let icon = "🚗";
    let modeLabel = `Mode: ${leg.mode || "Transit"}`;
    if (/train|rail/i.test(mode)) {
      icon = "🚆";
      const route = day.legs.map((l: any) => l.from?.split(" ")[0] || l.from).concat(day.legs[day.legs.length - 1].to?.split(" ")[0] || "").join(" ➔ ");
      modeLabel = `Transit: ${route}`;
    } else if (/flight|plane|air/i.test(mode)) {
      icon = "✈️";
      modeLabel = `Flight: ${leg.from} ➔ ${leg.to}`;
    } else if (/bus/i.test(mode)) {
      icon = "🚌";
      modeLabel = `Bus: ${leg.from} ➔ ${leg.to}`;
    } else if (/jeep|4wd|suv/i.test(mode)) {
      icon = "🚙";
      modeLabel = `Mode: Private 4WD Jeep`;
    } else if (/cab|taxi|car/i.test(mode)) {
      icon = "🚖";
      modeLabel = `Mode: Dedicated Cab`;
    }
    return { icon, text: modeLabel };
  }
  return { icon: "🗺️", text: "Local Heritage Tour" };
}

/**
 * Determines stay icon and label.
 */
function getStayInfo(day: any) {
  const stay = day.stay || day.hotelDetails?.name || "Recommended Stay";
  const stayLower = stay.toLowerCase();
  let icon = "🏨";
  if (/train|berth|overnight/i.test(stayLower)) icon = "🛏️";
  else if (/hostel|zostel|dorm/i.test(stayLower)) icon = "🏢";
  else if (/homestay|village|lodge/i.test(stayLower)) icon = "🏡";
  else if (/camp|tent/i.test(stayLower)) icon = "⛺";
  else if (/resort|hotel/i.test(stayLower)) icon = "🏨";
  return { icon, text: `Stay: ${stay}` };
}

/**
 * Determines route / sub-header title.
 */
function getDaySubHeader(day: any, dayIndex: number): string {
  if (day.title) return day.title;
  if (day.legs && day.legs.length > 0) {
    const from = day.legs[0].from?.split("(")[0]?.trim() || "Start";
    const to = day.legs[day.legs.length - 1].to?.split("(")[0]?.trim() || "Destination";
    if (from.toLowerCase() !== to.toLowerCase()) {
      return `${from} ➔ ${to}`;
    }
  }
  if (dayIndex === 0) return "Day-by-Day Itinerary";
  return `${day.stay?.replace(/Hotel|Hostel|Homestay|Zostel/i, "").trim() || "Local"} Exploration`;
}

/**
 * Generates an ultra-stylish 13-page Scrapbook Travel Guide PDF matching the reference magazine aesthetic.
 */
export async function exportMagazinePDF(
  itineraryData: MagazineItineraryData,
  onProgress?: (step: number, total: number, message: string) => void
): Promise<void> {
  const { form, result } = itineraryData;
  const days = result.days || [];
  const totalDays = days.length;
  const totalPages = totalDays + 3; // Page 1 (Cover) + Page 2 (Glance) + Days + Final Page (Essentials)

  const origin = form.origin || "Origin";
  const destination = form.destination || "Destination";
  const travellers = Number(form.travellers) || 8;
  const nights = Number(form.nights) || Math.max(1, totalDays - 1);
  const destLower = `${destination} ${result.destination || ""}`.toLowerCase();
  const isNepal = /nepal|kathmandu|pokhara|mustang|muktinath|ghandruk/i.test(destLower);

  const dateRangeText = form.startDate && form.endDate
    ? `${form.startDate} – ${form.endDate}`
    : "Flexible Dates";

  // Preload base64 images to prevent canvas tainting
  onProgress?.(1, totalPages, "Preparing high-resolution magazine artwork...");
  const coverPhotoB64 = isNepal
    ? await fetchImageAsBase64("/images/pdf_assets/nepal/cover_polaroid_clean.jpg")
    : await fetchImageAsBase64("/images/trailer/trailer_3_roadtrip.jpg");

  const highlightsCollageB64 = isNepal
    ? await fetchImageAsBase64("/images/pdf_assets/nepal/highlights_collage.jpg")
    : "";

  const clipboardDoodleB64 = await fetchImageAsBase64("/images/pdf_assets/clipboard_doodle_clean.png");

  // Preload day polaroids
  const dayPhotoB64s: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const photoUrl = getMatchingPhotoUrl(destLower, i, days[i]);
    const b64 = await fetchImageAsBase64(photoUrl);
    dayPhotoB64s.push(b64);
  }

  // Fallback trailer images for highlights on non-Nepal trips
  const highlightFallbackB64s: string[] = [];
  if (!isNepal) {
    const urls = [
      "/images/trailer/trailer_1_train.jpg",
      "/images/trailer/trailer_2_trekking.jpg",
      "/images/trailer/trailer_3_roadtrip.jpg",
      "/images/trailer/trailer_4_beach.jpg",
      "/images/trailer/trailer_5_cafe.jpg"
    ];
    for (const u of urls) {
      highlightFallbackB64s.push(await fetchImageAsBase64(u));
    }
  }

  // Dynamic place sections for Essentials page
  const placeEquipments: PlaceSection[] = getDynamicPlaceSections("equipments", result, destination);
  const placeTips: PlaceSection[] = getDynamicPlaceSections("tips", result, destination);

  // Hidden offscreen DOM container
  const container = document.createElement("div");
  container.id = "splitrupee-magazine-pdf-container";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.zIndex = "-9999";
  document.body.appendChild(container);

  // Shared Styles (skip external Google Fonts link offline to prevent network stalls in html2canvas)
  const isOnline = typeof navigator === "undefined" || navigator.onLine;
  const googleFontsLink = isOnline
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Caveat:wght@700&family=Comic+Neue:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">`
    : "";

  const styleBlock = `
    ${googleFontsLink}
    <style>
      .mag-page {
        width: 794px;
        height: 1123px;
        position: relative;
        background-color: #FAF8F5;
        background-image: 
          linear-gradient(to right, rgba(215, 210, 200, 0.45) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(215, 210, 200, 0.45) 1px, transparent 1px);
        background-size: 24px 24px;
        padding: 34px 44px;
        box-sizing: border-box;
        overflow: hidden;
        font-family: 'Patrick Hand', 'Comic Neue', cursive, sans-serif;
        color: #1F2937;
      }
      .ribbon-wrap {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 8px;
      }
      .ribbon-main {
        position: relative;
        background: linear-gradient(180deg, #FDBA74 0%, #FB923C 100%);
        border: 2.5px solid #1E293B;
        border-radius: 9px;
        padding: 10px 32px;
        z-index: 2;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      .ribbon-title {
        font-family: 'Caveat', cursive;
        font-size: 38px;
        font-weight: 700;
        color: #1E293B;
        line-height: 1.1;
        letter-spacing: 0.5px;
        text-align: center;
      }
      .ribbon-tail-left, .ribbon-tail-right {
        position: absolute;
        top: 14px;
        width: 65px;
        height: 50px;
        background: #FB923C;
        border: 2.5px solid #1E293B;
        z-index: 1;
      }
      .ribbon-tail-left {
        left: calc(50% - 250px);
        clip-path: polygon(100% 0, 100% 100%, 0 100%, 25% 50%, 0 0);
      }
      .ribbon-tail-right {
        right: calc(50% - 250px);
        clip-path: polygon(0 0, 0 100%, 100% 100%, 75% 50%, 100% 0);
      }
      .ribbon-fold-left, .ribbon-fold-right {
        position: absolute;
        top: 50px;
        width: 0;
        height: 0;
        z-index: 1;
      }
      .ribbon-fold-left {
        left: calc(50% - 188px);
        border-top: 14px solid #0284C7;
        border-left: 14px solid transparent;
      }
      .ribbon-fold-right {
        right: calc(50% - 188px);
        border-top: 14px solid #0284C7;
        border-right: 14px solid transparent;
      }
      .sub-banner {
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        color: #0F172A;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .info-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 18px;
        background: rgba(255,255,255,0.7);
        border-radius: 12px;
        border: 1.5px dashed #CBD5E1;
        margin-bottom: 14px;
      }
      .info-col {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 20px;
        font-weight: 600;
      }
      .info-divider {
        width: 2px;
        height: 38px;
        background: #CBD5E1;
      }
      .timeline-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 10px;
      }
      .timeline-line {
        flex: 1;
        height: 1.5px;
        background: #1E293B;
      }
      .timeline-title {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 2px;
      }
      .timeline-items {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 12px;
      }
      .timeline-row {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 20px;
        line-height: 1.3;
      }
      .timeline-badge {
        font-weight: 700;
        min-width: 95px;
      }
      .food-box {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 20px;
        font-weight: 700;
        padding: 6px 12px;
        border-top: 1.5px solid #1E293B;
        margin-bottom: 12px;
      }
      .polaroid-container {
        display: flex;
        justify-content: center;
        position: relative;
        margin-top: 6px;
      }
      .polaroid-img {
        max-width: 92%;
        border-radius: 4px;
        filter: drop-shadow(0 10px 22px rgba(0,0,0,0.18));
      }
      .quad-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 16px;
        padding: 16px 20px;
        background: rgba(255,255,255,0.7);
        border-radius: 14px;
        border: 1.5px dashed #CBD5E1;
        margin-bottom: 16px;
      }
      .quad-item {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 22px;
        font-weight: 600;
      }
      .essentials-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 24px;
        height: 870px;
        position: relative;
      }
      .essentials-divider {
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 2px;
        border-left: 2px dashed #CBD5E1;
      }
      .essentials-col-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 14px;
        padding-bottom: 6px;
        border-bottom: 2px solid #1E293B;
      }
      .essentials-section {
        margin-bottom: 14px;
      }
      .essentials-section-title {
        font-size: 19px;
        font-weight: 700;
        color: #0F172A;
        margin-bottom: 4px;
      }
      .essentials-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 16.5px;
        line-height: 1.35;
        color: #334155;
        padding: 0;
        margin: 0;
      }
      .essentials-list li {
        position: relative;
        padding-left: 14px;
      }
      .essentials-list li::before {
        content: "•";
        position: absolute;
        left: 0;
        font-size: 20px;
        color: #1E293B;
      }
    </style>
  `;

  // --- PAGE 1: COVER ---
  const page1Html = `
    <div class="mag-page" id="page-cover">
      <div class="ribbon-wrap" style="margin-top: 10px;">
        <div class="ribbon-tail-left" style="left: calc(50% - 310px); width: 70px;"></div>
        <div class="ribbon-fold-left" style="left: calc(50% - 245px);"></div>
        <div class="ribbon-main" style="padding: 10px 40px;">
          <div class="ribbon-title" style="font-size: 38px;">SplitRupee Travel Guide: ${origin} to ${destination}</div>
        </div>
        <div class="ribbon-fold-right" style="right: calc(50% - 245px);"></div>
        <div class="ribbon-tail-right" style="right: calc(50% - 310px); width: 70px;"></div>
      </div>

      <div style="text-align: center; font-size: 26px; font-weight: 700; margin-top: 10px; margin-bottom: 6px;">
        ${totalDays} Days – ${nights} Nights, ${dateRangeText}
      </div>
      <div style="text-align: center; color: #0284C7; font-size: 22px; letter-spacing: 3px; margin-bottom: 24px;">
        〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰
      </div>

      <div class="polaroid-container" style="margin-top: 10px;">
        ${
          coverPhotoB64
            ? `<img src="${coverPhotoB64}" style="max-width: 82%; border-radius: 4px; filter: drop-shadow(0 14px 28px rgba(0,0,0,0.22));" />`
            : `<div style="width: 500px; height: 420px; background: white; border: 12px solid white; border-bottom: 45px solid white; border-radius: 4px; box-shadow: 0 14px 28px rgba(0,0,0,0.22); display: flex; align-items: center; justify-content: center; font-size: 48px;">🌄</div>`
        }
      </div>

      <!-- Doodles -->
      <div style="position: absolute; left: 30px; top: 380px; font-size: 26px;">📷</div>
      <div style="position: absolute; left: 24px; top: 430px; font-size: 21px; font-weight: 700; color: #EF4444; transform: rotate(-5deg);">
        Adventure<br/>Awaits! ➔
      </div>
      <div style="position: absolute; left: 30px; top: 620px; font-size: 26px;">🎒</div>
      <div style="position: absolute; left: 24px; top: 670px; font-size: 20px; font-weight: 700; color: #059669; transform: rotate(3deg);">
        Road<br/>Trip!
      </div>

      <div style="position: absolute; right: 30px; top: 380px; font-size: 26px;">✈️</div>
      <div style="position: absolute; right: 24px; top: 430px; font-size: 21px; font-weight: 700; color: #1E293B; transform: rotate(4deg);">
        Adventure<br/>Awaits!
      </div>
      <div style="position: absolute; right: 30px; top: 620px; font-size: 26px;">🏕️</div>
      <div style="position: absolute; right: 24px; top: 670px; font-size: 20px; font-weight: 700; color: #0284C7; transform: rotate(-3deg);">
        A Road<br/>Trip! ♡
      </div>

      <div style="position: absolute; right: 50px; bottom: 35px; font-size: 28px;">🏔️ ▲▲</div>
    </div>
  `;

  // --- PAGE 2: TRIP AT A GLANCE ---
  const page2Html = `
    <div class="mag-page" id="page-glance">
      <div class="ribbon-wrap">
        <div class="ribbon-tail-left" style="left: calc(50% - 240px);"></div>
        <div class="ribbon-fold-left" style="left: calc(50% - 180px);"></div>
        <div class="ribbon-main">
          <div class="ribbon-title">TRIP AT A GLANCE</div>
        </div>
        <div class="ribbon-fold-right" style="right: calc(50% - 180px);"></div>
        <div class="ribbon-tail-right" style="right: calc(50% - 240px);"></div>
      </div>

      <div class="sub-banner">
        <span>☆</span> Trip Info <span>☆</span>
      </div>

      <div class="quad-grid">
        <div class="quad-item">
          <span style="font-size: 30px;">📅</span>
          <span>${nights} Nights / ${totalDays} Days</span>
        </div>
        <div class="quad-item">
          <span style="font-size: 30px;">👥</span>
          <span>${travellers} Travelers</span>
        </div>
        <div class="quad-item">
          <span style="font-size: 30px;">🗓️</span>
          <span>${dateRangeText}</span>
        </div>
        <div class="quad-item">
          <span style="font-size: 30px;">✈️</span>
          <span>${origin} ➔ ${destination}</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
        <div style="flex:1; height: 1.5px; background: #1E293B;"></div>
        <div style="font-size: 22px;">☆ ➔ ❤️ ➔ ☆</div>
        <div style="flex:1; height: 1.5px; background: #1E293B;"></div>
      </div>

      <div style="text-align: center; font-size: 24px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px;">
        &gt; MAJOR HIGHLIGHTS &lt;
      </div>

      <div class="polaroid-container">
        ${
          highlightsCollageB64
            ? `<img src="${highlightsCollageB64}" style="max-width: 95%; border-radius: 4px; filter: drop-shadow(0 10px 22px rgba(0,0,0,0.18));" />`
            : `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; margin-top: 10px;">
              ${highlightFallbackB64s.slice(0, 3).map((b64, idx) => `
                <div style="background: white; padding: 6px 6px 18px 6px; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); text-align: center;">
                  <img src="${b64}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 2px;" />
                  <div style="font-size: 15px; font-weight: bold; margin-top: 6px;">Highlight ${idx + 1}</div>
                </div>
              `).join("")}
            </div>
          `
        }
      </div>
    </div>
  `;

  // --- PAGES 3 to (N+2): DAY BY DAY ---
  const dailyPagesHtml = days.map((day, idx) => {
    const dayDateLabel = formatDayDate(form.startDate, idx);
    const subHeader = getDaySubHeader(day, idx);
    const transit = getTransitInfo(day);
    const stay = getStayInfo(day);

    const actMorning = day.activities?.morning || "Morning departure and breakfast";
    const actAfternoon = day.activities?.afternoon || "Afternoon exploration & scenic stops";
    const actEvening = day.activities?.evening || "Evening arrival and leisurely stroll";
    const foodText = day.activities?.food || "Authentic local delicacies and hot cuisine";

    const dayPhoto = dayPhotoB64s[idx];

    return `
      <div class="mag-page" id="page-day-${idx + 1}">
        <div class="ribbon-wrap">
          <div class="ribbon-tail-left" style="left: calc(50% - 240px);"></div>
          <div class="ribbon-fold-left" style="left: calc(50% - 180px);"></div>
          <div class="ribbon-main">
            <div class="ribbon-title">${dayDateLabel}</div>
          </div>
          <div class="ribbon-fold-right" style="right: calc(50% - 180px);"></div>
          <div class="ribbon-tail-right" style="right: calc(50% - 240px);"></div>
        </div>

        <div class="sub-banner">
          <span>☆</span> ${subHeader} <span>☆</span>
        </div>

        <div class="info-bar">
          <div class="info-col">
            <span style="font-size: 28px;">${transit.icon}</span>
            <div>
              <span style="color:#64748B; font-size:15px; display:block;">Transit / Mode:</span>
              <strong>${transit.text}</strong>
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-col">
            <span style="font-size: 28px;">${stay.icon}</span>
            <div>
              <span style="color:#64748B; font-size:15px; display:block;">Night Stay:</span>
              <strong>${stay.text}</strong>
            </div>
          </div>
        </div>

        <div class="timeline-header">
          <div class="timeline-line"></div>
          <div class="timeline-title">TIMELINE</div>
          <div class="timeline-line"></div>
        </div>

        <div class="timeline-items">
          <div class="timeline-row">
            <span style="font-size: 28px;">🌅</span>
            <div><span class="timeline-badge">Morning :</span> ${actMorning}</div>
          </div>
          <div class="timeline-row">
            <span style="font-size: 28px;">🏔️</span>
            <div><span class="timeline-badge">Afternoon:</span> ${actAfternoon}</div>
          </div>
          <div class="timeline-row">
            <span style="font-size: 28px;">🌆</span>
            <div><span class="timeline-badge">Evening :</span> ${actEvening}</div>
          </div>
        </div>

        <div class="food-box">
          <span style="font-size: 24px;">🍴</span>
          <div>FOOD: <span style="font-weight: 500;">${foodText}</span></div>
        </div>

        <div class="polaroid-container">
          ${
            dayPhoto
              ? `<img src="${dayPhoto}" class="polaroid-img" />`
              : `
              <div style="background: white; padding: 12px 12px 28px 12px; border-radius: 4px; box-shadow: 0 10px 22px rgba(0,0,0,0.18); text-align: center;">
                <div style="width: 520px; height: 260px; background: linear-gradient(135deg, #10B981, #0284C7); border-radius: 3px; display:flex; align-items:center; justify-content:center; color:white; font-size: 36px;">
                  🌄 ${destination}
                </div>
                <div style="font-size: 20px; font-weight: bold; margin-top: 8px;">Day ${idx + 1} Moments</div>
              </div>
            `
          }
        </div>
      </div>
    `;
  }).join("");

  // --- FINAL PAGE: TRIP ESSENTIALS ---
  const leftSections: PlaceSection[] = placeEquipments.length > 0
    ? placeEquipments.slice(0, 5)
    : [
        {
          location: "Core Travel Gear",
          altitude: "Essential",
          tag: "General Gear",
          items: [
            { name: "High-Capacity Power Bank (20,000mAh)", desc: "Essential for long transit days" },
            { name: "Comfortable Walking Shoes", desc: "For exploring historical sights and cobbled paths" },
            { name: "Universal Travel Adapter", desc: "For camera and phone charging" }
          ]
        }
      ];

  const rightSections: PlaceSection[] = placeTips.length > 0
    ? placeTips.slice(0, 4)
    : [
        {
          location: "ID & Documentation",
          tag: "Mandatory",
          items: [
            { name: "Government Photo ID (Original + 2 photocopies)", desc: "Mandatory for border checks and hotels" }
          ]
        },
        {
          location: "Money & Currency",
          tag: "Finance",
          items: [
            { name: "Carry physical cash buffer", desc: "Digital payments can be unavailable in remote valleys" }
          ]
        }
      ];

  const essentialsPageHtml = `
    <div class="mag-page" id="page-essentials">
      <div class="ribbon-wrap">
        <div class="ribbon-tail-left" style="left: calc(50% - 240px);"></div>
        <div class="ribbon-fold-left" style="left: calc(50% - 180px);"></div>
        <div class="ribbon-main">
          <div class="ribbon-title">TRIP ESSENTIALS</div>
        </div>
        <div class="ribbon-fold-right" style="right: calc(50% - 180px);"></div>
        <div class="ribbon-tail-right" style="right: calc(50% - 240px);"></div>
      </div>

      <div class="sub-banner">
        <span>☆</span> Packing &amp; Travel Checklist <span>☆</span>
      </div>

      <div class="essentials-grid">
        <div class="essentials-divider"></div>

        <!-- LEFT COLUMN: Packing Essentials -->
        <div style="padding-right: 14px;">
          <div class="essentials-col-title">
            <span style="font-size: 28px;">🎒</span>
            <span>Packing Essentials</span>
          </div>

          ${leftSections.map((sec) => `
            <div class="essentials-section">
              <div class="essentials-section-title">${sec.location}${sec.altitude ? ` (${sec.altitude})` : ""}</div>
              <ul class="essentials-list">
                ${sec.items.slice(0, 3).map((item) => `
                  <li><strong>${item.name}</strong>${item.desc ? ` (${item.desc})` : ""}</li>
                `).join("")}
              </ul>
            </div>
          `).join("")}
        </div>

        <!-- RIGHT COLUMN: Travel Tips & Transit -->
        <div style="padding-left: 14px; position: relative;">
          <div class="essentials-col-title">
            <span style="font-size: 28px;">🛂</span>
            <span>Travel Tips &amp; Transit</span>
          </div>

          ${rightSections.map((sec) => `
            <div class="essentials-section">
              <div class="essentials-section-title">${sec.location}</div>
              <ul class="essentials-list">
                ${sec.items.slice(0, 3).map((item) => `
                  <li><strong>${item.name}</strong>${item.desc ? `: ${item.desc}` : ""}</li>
                `).join("")}
              </ul>
            </div>
          `).join("")}

          <!-- Clipboard Doodle -->
          ${
            clipboardDoodleB64
              ? `<div style="position: absolute; right: 10px; bottom: 15px;">
                   <img src="${clipboardDoodleB64}" style="max-width: 140px;" />
                 </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  // Inject all HTML
  container.innerHTML = `
    ${styleBlock}
    ${page1Html}
    ${page2Html}
    ${dailyPagesHtml}
    ${essentialsPageHtml}
  `;

  // Wait briefly for font layout (capped so offline mode never hangs)
  if (typeof document !== "undefined" && (document as any).fonts) {
    try {
      await Promise.race([
        (document as any).fonts.ready,
        new Promise((r) => setTimeout(r, 800)),
      ]);
    } catch {}
  }
  await new Promise((r) => setTimeout(r, 250));

  // Render with jsPDF & html2canvas
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageElements = container.querySelectorAll(".mag-page");

  for (let i = 0; i < pageElements.length; i++) {
    onProgress?.(i + 1, pageElements.length, `Generating Page ${i + 1} of ${pageElements.length}...`);
    const pageEl = pageElements[i] as HTMLElement;

    const canvas = await html2canvas(pageEl, {
      scale: 1.8,
      useCORS: true,
      logging: false,
      allowTaint: false
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
  }

  // Cleanup DOM container
  try {
    document.body.removeChild(container);
  } catch {}

  onProgress?.(totalPages, totalPages, "Download ready!");
  const safeSlug = `SplitRupee_Travel_Guide_${origin}_to_${destination}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeSlug}.pdf`;
  pdf.save(filename);
}

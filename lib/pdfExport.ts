import { jsPDF } from "jspdf";
import type { MemberDTO, ExpenseDTO, PaymentDTO } from "./types";
import type { Transfer } from "./debt";
import { roundFigure } from "./money";
import { getDynamicPlaceSections, type PlaceSection } from "./destinationGroundEngine";
import { exportMagazinePDF, type MagazineItineraryData } from "./magazinePdfExport";

export { exportMagazinePDF };

/**
 * Cleans string of Unicode characters that break in standard jsPDF WinAnsi fonts.
 * Converts arrows, bullets, rupee signs, and non-ASCII chars to clean, safe equivalents.
 */
function cleanPdfText(str: any): string {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s
    .replace(/[➔→➜➤]/g, " -> ")
    .replace(/[•●·]/g, " - ")
    .replace(/₹/g, "INR ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ItineraryPdfOptions {
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
      activities?: any;
      hotelDetails?: {
        name: string;
        costPerNight: number;
        contact?: string;
        roomType?: string;
        roomCount?: number;
        ratePerUnit?: number;
        breakdownNote?: string;
      } | null;
    }>;
    equipments?: any[];
    tips?: any[];
    placeGear?: any[];
    placeTips?: any[];
    auditReview?: {
      status?: string;
      auditScore?: number;
      realityChecks?: string[];
      warnings?: string[];
    };
  };
  financialSummary?: {
    totalEstimatedCost: number;
    targetBudget: number;
    totalTransportCost: number;
    totalHotelCost: number;
    budgetDifference: number;
    budgetStatus: string;
    targetNightlyStayBudget?: number;
  };
  mode?: "magazine" | "classic";
  onProgress?: (step: number, total: number, message: string) => void;
}

/**
 * Main PDF export function. Defaults to the rich, dynamic Magazine Scrapbook edition
 * matching the SplitRupee Travel Guide aesthetic with fallback to classic layout.
 */
export function exportItineraryPDF(itineraryData: ItineraryPdfOptions) {
  const { mode = "magazine", onProgress } = itineraryData;

  // In browser runtime with magazine mode, launch the magazine scrapbook engine
  if (typeof window !== "undefined" && mode === "magazine") {
    exportMagazinePDF(itineraryData as MagazineItineraryData, onProgress).catch((err) => {
      console.warn("Magazine PDF generation encountered error, smoothly falling back to classic engine:", err);
      exportClassicItineraryPDF(itineraryData);
    });
    return;
  }

  exportClassicItineraryPDF(itineraryData);
}

/**
 * Generates an elegant, theme-based printable PDF for travel itineraries (Classic Edition).
 */
export function exportClassicItineraryPDF(itineraryData: ItineraryPdfOptions) {
  const { form, result, financialSummary } = itineraryData;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = margin;

  function checkPageBreak(spaceNeeded: number) {
    if (y + spaceNeeded > pageHeight - 18) {
      doc.addPage();
      y = 16;
      drawRunningHeader();
    }
  }

  function drawRunningHeader() {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const cleanOrigin = cleanPdfText(form.origin).toUpperCase();
    const cleanDest = cleanPdfText(form.destination).toUpperCase();
    doc.text(`SPLITRUPEE ITINERARY | ${cleanOrigin} -> ${cleanDest}`, margin + 3, y + 5.5);
    doc.setTextColor(16, 185, 129);
    doc.text("SMART TRAVEL GUIDE", pageWidth - margin - 3, y + 5.5, { align: "right" });
    y += 12;
  }

  // 1. HERO COVER HEADER
  doc.setFillColor(15, 23, 42); // Deep slate
  doc.roundedRect(margin, y, contentWidth, 36, 3, 3, "F");

  // Logo Badge
  doc.setFillColor(16, 185, 129); // Emerald
  doc.roundedRect(margin + 4, y + 4, 10, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("INR", margin + 4.8, y + 10.5);

  // App Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("SplitRupee Travel Guide", margin + 17, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Personalized itinerary with relaxed travel times, verified stays, and complete cost breakdown", margin + 17, y + 15);

  // Trip Route Header (Bhubaneswar -> Goa with clean ASCII arrow)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(52, 211, 153); // emerald-400
  const routeText = `${cleanPdfText(form.origin)}   ->   ${cleanPdfText(form.destination)}`;
  doc.text(routeText, margin + 5, y + 26);

  // Meta Pill line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  const nightsText = form.nights ? `${form.nights} Nights` : "Multi-day";
  const paxText = form.travellers ? `${form.travellers} Travelers (${form.groupType || "Trip"})` : "Travel Group";
  const datesText = form.startDate && form.endDate ? `${form.startDate} to ${form.endDate}` : "Flexible Dates";
  doc.text(`${nightsText}   |   ${paxText}   |   ${datesText}`, margin + 5, y + 31.5);

  y += 41;

  // 2. FINANCIAL & BUDGET SUMMARY BOX
  if (financialSummary) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 23, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const budgetBadge = financialSummary.budgetStatus === "UNDER_BUDGET" ? "[ UNDER BUDGET ]" : "[ AT BUDGET LIMIT ]";
    doc.text(`ESTIMATED TRIP BUDGET   ${budgetBadge}`, margin + 4, y + 6);

    const colW = contentWidth / 4;

    // Total Cost
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`INR ${financialSummary.totalEstimatedCost.toLocaleString()}`, margin + 4, y + 14);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Total for group", margin + 4, y + 18);

    // Stays Cost
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${financialSummary.totalHotelCost.toLocaleString()}`, margin + colW + 4, y + 14);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Stays / Lodging", margin + colW + 4, y + 18);

    // Transfers Cost
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${financialSummary.totalTransportCost.toLocaleString()}`, margin + colW * 2 + 4, y + 14);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Transfers & Transit", margin + colW * 2 + 4, y + 18);

    // Per Person
    const numTravellers = Number(form.travellers) || 1;
    const perPerson = Math.round(financialSummary.totalEstimatedCost / numTravellers);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text(`INR ${perPerson.toLocaleString()}`, margin + colW * 3 + 4, y + 14);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Per traveler share", margin + colW * 3 + 4, y + 18);

    y += 27;
  }

  // 3. DAY BY DAY ITINERARY
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("DAY-BY-DAY CURATED SCHEDULE", margin, y + 2);
  y += 6;

  const days = result.days || [];
  days.forEach((d) => {
    checkPageBreak(30);

    // Day Header Strip
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(52, 211, 153);
    doc.text(`DAY ${d.day}`, margin + 4, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(241, 245, 249);
    const stayLabel = cleanPdfText(d.stay || d.hotelDetails?.name || "Recommended Hotel");
    doc.text(`Stay: ${stayLabel}`, pageWidth - margin - 4, y + 5.5, { align: "right" });
    y += 11;

    // Legs / Transit
    if (d.legs && d.legs.length > 0) {
      d.legs.forEach((leg) => {
        const cleanFrom = cleanPdfText(leg.from);
        const cleanTo = cleanPdfText(leg.to);
        const legDetails = [
          leg.mode ? `Mode: ${cleanPdfText(leg.mode)}` : "",
          leg.depart ? `Depart: ${cleanPdfText(leg.depart)}` : "",
          leg.arrive ? `Arrive: ${cleanPdfText(leg.arrive)}` : "",
          (leg as any).distance_km ? `Dist: ~${cleanPdfText((leg as any).distance_km)} km` : "",
          (leg as any).duration_hours ? `Duration: ${cleanPdfText((leg as any).duration_hours)}h` : leg.duration ? `Duration: ${cleanPdfText(leg.duration)}` : "",
          leg.cost ? `Cost: INR ${cleanPdfText(leg.cost)}` : "",
        ]
          .filter(Boolean)
          .join("  |  ");

        // Check if there is an exact train name, helpline or transit note
        const noteText = leg.note ? cleanPdfText(leg.note) : "";
        const noteLines = noteText ? doc.splitTextToSize(`Info / Note: ${noteText}`, contentWidth - 8) : [];
        const legHeight = 11 + (noteLines.length > 0 ? noteLines.length * 3.6 + 4 : 0);

        checkPageBreak(legHeight + 2);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, legHeight, 1, 1, "FD");

        // Blue accent left bar for Transit
        doc.setFillColor(14, 165, 233); // sky-500
        doc.rect(margin, y, 1.5, legHeight, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`Transit: ${cleanFrom}   ->   ${cleanTo}`, margin + 4, y + 4.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(legDetails, margin + 4, y + 8.5);

        // Render Train Name & Helpline if present
        if (noteLines.length > 0) {
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(margin + 3, y + 10.5, contentWidth - 6, noteLines.length * 3.6 + 2, 0.8, 0.8, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(30, 41, 59);
          doc.text(noteLines, margin + 5, y + 13.5);
        }

        y += legHeight + 2.5;
      });
    }

    // Daily Activities (Morning, Afternoon, Evening, Food)
    if (d.activities) {
      if (typeof d.activities === "object" && !Array.isArray(d.activities)) {
        // Structured periods: morning, afternoon, evening, food
        const periods: Array<{ key: string; label: string; color: [number, number, number] }> = [
          { key: "morning", label: "MORNING", color: [16, 185, 129] }, // emerald
          { key: "afternoon", label: "AFTERNOON", color: [20, 184, 166] }, // teal
          { key: "evening", label: "EVENING", color: [99, 102, 241] }, // indigo
          { key: "food", label: "FOOD & DINING", color: [245, 158, 11] }, // amber
        ];

        periods.forEach(({ key, label, color }) => {
          const text = (d.activities as any)[key];
          if (text && typeof text === "string" && text.trim().length > 0) {
            const cleanText = cleanPdfText(text);
            const textLines = doc.splitTextToSize(cleanText, contentWidth - 32);
            const actHeight = Math.max(8, textLines.length * 3.6 + 3.5);

            checkPageBreak(actHeight + 2);

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(241, 245, 249);
            doc.roundedRect(margin, y, contentWidth, actHeight, 1, 1, "FD");

            // Left period color strip
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(margin, y, 1.5, actHeight, "F");

            // Period badge text
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(label, margin + 4, y + 4.5);

            // Period description
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(51, 65, 85);
            doc.text(textLines, margin + 28, y + 4.5);

            y += actHeight + 1.5;
          }
        });
      } else if (Array.isArray(d.activities) && d.activities.length > 0) {
        // Array of activity objects
        d.activities.forEach((act: any) => {
          const actTitle = cleanPdfText(act.activity || act.time || "Activity");
          const actDesc = cleanPdfText(act.description || "");
          const descLines = doc.splitTextToSize(actDesc, contentWidth - 32);
          const cardHeight = Math.max(10, 6 + descLines.length * 3.5);

          checkPageBreak(cardHeight + 2);

          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, y, contentWidth, cardHeight, 1, 1, "FD");

          doc.setFillColor(16, 185, 129);
          doc.rect(margin, y, 1.5, cardHeight, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(13, 148, 136);
          doc.text(cleanPdfText(act.time || "Activity"), margin + 4, y + 4.5);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(actTitle, margin + 28, y + 4.5);

          if (act.cost) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(5, 150, 105);
            doc.text(`INR ${cleanPdfText(act.cost)}`, pageWidth - margin - 3, y + 4.5, { align: "right" });
          }

          if (descLines.length > 0) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105);
            doc.text(descLines, margin + 28, y + 8.5);
          }

          y += cardHeight + 2;
        });
      }
    }

    // Accommodation & Night Stay Card
    if (d.hotelDetails && d.hotelDetails.name) {
      const hotelName = cleanPdfText(d.hotelDetails.name);
      const contactText = d.hotelDetails.contact ? cleanPdfText(d.hotelDetails.contact) : "";
      const roomTypeText = d.hotelDetails.roomType ? ` (${cleanPdfText(d.hotelDetails.roomType)})` : "";
      const priceText = d.hotelDetails.costPerNight ? `INR ${Number(d.hotelDetails.costPerNight).toLocaleString()} / night` : "";
      const breakdownText = d.hotelDetails.breakdownNote ? cleanPdfText(d.hotelDetails.breakdownNote) : "";

      const cardHeight = breakdownText ? 16 : 12;
      checkPageBreak(cardHeight + 2);

      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.roundedRect(margin, y, contentWidth, cardHeight, 1, 1, "FD");

      doc.setFillColor(16, 185, 129);
      doc.rect(margin, y, 1.5, cardHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text("HOTEL & NIGHT STAY:", margin + 4, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${hotelName}${roomTypeText}`, margin + 38, y + 4.5);

      if (priceText) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(5, 150, 105);
        doc.text(priceText, pageWidth - margin - 4, y + 4.5, { align: "right" });
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const deskLine = contactText
        ? `Verified Reception / Front Desk: ${contactText}`
        : "Reservation via official hostel/hotel front desk or verified online booking portal";
      doc.text(deskLine, margin + 4, y + 8.5);

      if (breakdownText) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        const splitBreakdown = doc.splitTextToSize(breakdownText, contentWidth - 8);
        doc.text(splitBreakdown[0] || "", margin + 4, y + 12.5);
      }

      y += cardHeight + 2;
    }

    y += 3;
  });

  // 4. EQUIPMENTS & PACKING GEAR CHECKLIST (100% UNWRAPPED & READABLE)
  const placeEquipments: PlaceSection[] = getDynamicPlaceSections("equipments", result, form.destination);
  const rawEquipments = Array.isArray(result.equipments) ? result.equipments : [];

  if (placeEquipments.length > 0 || rawEquipments.length > 0) {
    checkPageBreak(30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("EQUIPMENTS & PACKING CHECKLIST", margin, y + 3);
    y += 6;

    if (placeEquipments.length > 0) {
      placeEquipments.forEach((sec) => {
        checkPageBreak(25);

        // Location Section Header Banner
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "FD");

        // Left emerald indicator
        doc.setFillColor(16, 185, 129);
        doc.rect(margin, y, 2, 6, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(cleanPdfText(sec.location), margin + 4, y + 4.2);

        const subTag = cleanPdfText(`${sec.altitude ? sec.altitude + " • " : ""}${sec.tag || ""}`);
        if (subTag) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(subTag, pageWidth - margin - 3, y + 4.2, { align: "right" });
        }

        y += 7.5;

        // Render each item with complete, multi-line text (ZERO TRUNCATION)
        sec.items.forEach((item) => {
          const itemName = cleanPdfText(item.name);
          const itemDesc = cleanPdfText(item.desc);
          const fullText = itemDesc ? `${itemName} - ${itemDesc}` : itemName;

          const lines = doc.splitTextToSize(fullText, contentWidth - 12);
          const itemBoxH = Math.max(7, lines.length * 3.3 + 3.5);
          checkPageBreak(itemBoxH + 1.5);

          // Card Background
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, y, contentWidth, itemBoxH, 1, 1, "FD");

          // Checkbox square
          doc.setDrawColor(16, 185, 129);
          doc.rect(margin + 2.5, y + 2, 3.2, 3.2);

          // Complete text content
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          doc.text(lines, margin + 7.5, y + 4);

          y += itemBoxH + 1.5;
        });

        y += 2;
      });
    } else {
      rawEquipments.forEach((itemData: any) => {
        let text = "";
        if (typeof itemData === "string") {
          text = cleanPdfText(itemData);
        } else if (itemData && typeof itemData === "object") {
          text = cleanPdfText(itemData.item || itemData.name || "");
          if (itemData.category) {
            text += ` (${cleanPdfText(itemData.category)})`;
          }
        }
        if (!text) return;

        const lines = doc.splitTextToSize(text, contentWidth - 12);
        const itemBoxH = Math.max(7, lines.length * 3.3 + 3.5);
        checkPageBreak(itemBoxH + 1.5);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, itemBoxH, 1, 1, "FD");

        doc.setDrawColor(16, 185, 129);
        doc.rect(margin + 2.5, y + 2, 3.2, 3.2);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(lines, margin + 7.5, y + 4);

        y += itemBoxH + 1.5;
      });
    }

    y += 4;
  }

  // 5. SMART TRAVEL TIPS & ADVICE (100% UNWRAPPED & READABLE)
  const placeTips: PlaceSection[] = getDynamicPlaceSections("tips", result, form.destination);
  const rawTips = Array.isArray(result.tips) ? result.tips : [];

  if (placeTips.length > 0 || rawTips.length > 0) {
    checkPageBreak(30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("SMART TRAVEL TIPS & ADVICE", margin, y + 3);
    y += 6;

    if (placeTips.length > 0) {
      placeTips.forEach((sec) => {
        checkPageBreak(25);

        // Location Section Header Banner
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "FD");

        // Left amber indicator
        doc.setFillColor(245, 158, 11);
        doc.rect(margin, y, 2, 6, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(cleanPdfText(sec.location), margin + 4, y + 4.2);

        const subTag = cleanPdfText(`${sec.altitude ? sec.altitude + " • " : ""}${sec.tag || ""}`);
        if (subTag) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(subTag, pageWidth - margin - 3, y + 4.2, { align: "right" });
        }

        y += 7.5;

        sec.items.forEach((item) => {
          const tipTitle = cleanPdfText(item.name);
          const tipDesc = cleanPdfText(item.desc);
          const fullTip = tipDesc ? `${tipTitle}: ${tipDesc}` : tipTitle;

          const lines = doc.splitTextToSize(fullTip, contentWidth - 12);
          const boxH = Math.max(7, lines.length * 3.4 + 3.5);
          checkPageBreak(boxH + 1.5);

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, y, contentWidth, boxH, 1, 1, "FD");

          // Left amber bar
          doc.setFillColor(245, 158, 11);
          doc.rect(margin, y, 1.5, boxH, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          doc.text(lines, margin + 6, y + 4);

          y += boxH + 1.5;
        });

        y += 2;
      });
    } else {
      rawTips.forEach((tip) => {
        let formattedTip = "";
        if (typeof tip === "string") {
          formattedTip = cleanPdfText(tip);
        } else if (tip && typeof tip === "object") {
          const title = cleanPdfText(tip.title || "");
          const desc = cleanPdfText(tip.description || tip.text || "");
          formattedTip = title && desc ? `${title}: ${desc}` : title || desc;
        }

        if (!formattedTip) return;

        const tipLines = doc.splitTextToSize(formattedTip, contentWidth - 12);
        const boxH = Math.max(7, tipLines.length * 3.4 + 3.5);
        checkPageBreak(boxH + 1.5);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, boxH, 1, 1, "FD");

        doc.setFillColor(245, 158, 11);
        doc.rect(margin, y, 1.5, boxH, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(tipLines, margin + 6, y + 4);

        y += boxH + 1.5;
      });
    }

    y += 4;
  }

  // FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated with SplitRupee - splitrupee.vercel.app", margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  // Save PDF
  const safeFilename = `${cleanPdfText(form.destination).toLowerCase().replace(/[^a-z0-9]/g, "_")}_trip_itinerary.pdf`;
  if (typeof window !== "undefined") {
    doc.save(safeFilename);
  }
  return doc;
}

/**
 * Generates an official, print-ready Group Financial Statement & Expense Ledger PDF.
 */
export function exportGroupLedgerPDF(
  group: { name: string; type: string; currency?: string },
  members: MemberDTO[],
  expenses: ExpenseDTO[],
  payments: PaymentDTO[],
  balances: Record<string, number>,
  transfers: Transfer[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const names: Record<string, string> = {};
  members.forEach((m) => (names[m.id] = m.name));
  const nm = (id: string) => names[id] ?? "Unknown";

  const totalSpend = expenses.reduce((acc, e) => acc + e.totalAmount, 0);
  const totalReconciled = payments.reduce((acc, p) => acc + p.amount, 0);

  function checkPageBreak(spaceNeeded: number) {
    if (y + spaceNeeded > pageHeight - 18) {
      doc.addPage();
      y = 16;
      drawRunningHeader();
    }
  }

  function drawRunningHeader() {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`SPLITRUPEE FINANCIAL LEDGER • ${group.name.toUpperCase()}`, margin + 3, y + 4.8);
    doc.setTextColor(16, 185, 129);
    doc.text("OFFICIAL EXPENSE STATEMENT", pageWidth - margin - 3, y + 4.8, { align: "right" });
    y += 11;
  }

  // 1. HEADER BANNER
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 32, 2.5, 2.5, "F");

  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin + 4, y + 4, 9, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("INR", margin + 4.8, y + 10.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(group.name, margin + 16, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(`Category: ${group.type}  •  ${members.length} Members  •  Exported on ${today}`, margin + 16, y + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(52, 211, 153);
  doc.text(`SplitRupee Mathematical Debt Minimization Engine`, margin + 4, y + 26);

  y += 36;

  // 2. FINANCIAL STATS CARDS
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");

  const statW = contentWidth / 3;

  // Total Spend
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${roundFigure(totalSpend)}`, margin + 4, y + 8);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total Group Expenses (${expenses.length})`, margin + 4, y + 13);

  // Total Reconciled
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(`INR ${roundFigure(totalReconciled)}`, margin + statW + 4, y + 8);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Direct Settlements Paid (${payments.length})`, margin + statW + 4, y + 13);

  // Health
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(13, 148, 136);
  doc.text(transfers.length === 0 ? "All Square (0 Owings)" : `${transfers.length} Transfers Required`, margin + statW * 2 + 4, y + 8);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Ledger Health Status", margin + statW * 2 + 4, y + 13);

  y += 22;

  // 3. MEMBER BALANCES TABLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("MEMBER BALANCES & FAIR SHARE", margin, y + 2);
  y += 5;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Traveler / Member", margin + 3, y + 4.8);
  doc.text("Total Paid", margin + 65, y + 4.8);
  doc.text("Fair Share", margin + 105, y + 4.8);
  doc.text("Net Balance", margin + 145, y + 4.8);
  doc.text("Status", pageWidth - margin - 3, y + 4.8, { align: "right" });
  y += 7;

  // Compute individual shares
  const memberPaid: Record<string, number> = {};
  const memberShare: Record<string, number> = {};
  members.forEach((m) => {
    memberPaid[m.id] = 0;
    memberShare[m.id] = 0;
  });
  expenses.forEach((e) => {
    memberPaid[e.paidById] = (memberPaid[e.paidById] || 0) + e.totalAmount;
    e.splits.forEach((s) => {
      memberShare[s.userId] = (memberShare[s.userId] || 0) + s.amount;
    });
  });

  members.forEach((m, idx) => {
    checkPageBreak(7);
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

    const netPaise = balances[m.id] || 0;
    const netINR = netPaise / 100;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.name, margin + 3, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`INR ${roundFigure(memberPaid[m.id] || 0)}`, margin + 65, y + 4.5);
    doc.text(`INR ${roundFigure(memberShare[m.id] || 0)}`, margin + 105, y + 4.5);

    doc.setFont("helvetica", "bold");
    if (netINR > 0) {
      doc.setTextColor(5, 150, 105);
      doc.text(`+INR ${roundFigure(netINR)}`, margin + 145, y + 4.5);
      doc.text("Gets Back", pageWidth - margin - 3, y + 4.5, { align: "right" });
    } else if (netINR < 0) {
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text(`-INR ${roundFigure(Math.abs(netINR))}`, margin + 145, y + 4.5);
      doc.text("Owes", pageWidth - margin - 3, y + 4.5, { align: "right" });
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text("INR 0", margin + 145, y + 4.5);
      doc.text("Settled", pageWidth - margin - 3, y + 4.5, { align: "right" });
    }

    y += 6.5;
  });

  y += 5;

  // 4. DEBT MINIMIZATION TRANSFERS (WHO PAYS WHOM)
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("OPTIMIZED SETTLEMENT TRANSFERS (WHO PAYS WHOM)", margin, y + 2);
  y += 5;

  if (transfers.length === 0) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text("All Square! Everyone has settled their balances.", margin + 4, y + 6);
    y += 14;
  } else {
    transfers.forEach((t) => {
      checkPageBreak(9);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${nm(t.from)}`, margin + 4, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("pays", margin + 50, y + 5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${nm(t.to)}`, margin + 65, y + 5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105);
      doc.text(`INR ${roundFigure(t.amountPaise / 100)}`, margin + 130, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("via 1-Tap UPI / Cash", pageWidth - margin - 3, y + 5, { align: "right" });

      y += 9.5;
    });
    y += 4;
  }

  // 5. ITEMIZED EXPENSES REGISTER
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`ITEMIZED EXPENSES REGISTER (${expenses.length})`, margin, y + 2);
  y += 5;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Date", margin + 3, y + 4.8);
  doc.text("Expense Title", margin + 28, y + 4.8);
  doc.text("Category", margin + 85, y + 4.8);
  doc.text("Paid By", margin + 115, y + 4.8);
  doc.text("Amount (INR)", pageWidth - margin - 3, y + 4.8, { align: "right" });
  y += 7;

  expenses.forEach((e, idx) => {
    checkPageBreak(7);
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

    const dStr = new Date(e.date || e.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(dStr, margin + 3, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const title = e.title.length > 32 ? e.title.slice(0, 30) + "..." : e.title;
    doc.text(title, margin + 28, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(e.category, margin + 85, y + 4.5);
    doc.text(nm(e.paidById), margin + 115, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${roundFigure(e.totalAmount)}`, pageWidth - margin - 3, y + 4.5, { align: "right" });

    y += 6.5;
  });

  // FOOTER ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Official Group Statement • SplitRupee (splitrupee.vercel.app)", margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const filename = `${group.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_statement.pdf`;
  doc.save(filename);
}

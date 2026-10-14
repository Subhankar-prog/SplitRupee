import { jsPDF } from "jspdf";
import type { MemberDTO, ExpenseDTO, PaymentDTO } from "./types";
import type { Transfer } from "./debt";

/**
 * Generates an elegant, theme-based printable PDF for travel itineraries.
 */
export function exportItineraryPDF(itineraryData: {
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
    days?: Array<{
      day: number;
      stay: string;
      legs?: Array<{
        from: string;
        to: string;
        mode: string;
        depart?: string;
        duration?: string;
        cost?: string;
      }>;
      activities?: Array<{
        time?: string;
        activity: string;
        description?: string;
        cost?: string | number;
        tips?: string;
      }>;
    }>;
    equipments?: Array<{
      item: string;
      category?: string;
      importance?: string;
    }>;
    tips?: Array<{
      title: string;
      description?: string;
    }>;
  };
  financialSummary?: {
    totalEstimatedCost: number;
    targetBudget: number;
    totalTransportCost: number;
    totalHotelCost: number;
    budgetDifference: number;
    budgetStatus: string;
  };
}) {
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
    doc.text(`SPLITRUPEE ITINERARY • ${form.origin.toUpperCase()} ➔ ${form.destination.toUpperCase()}`, margin + 3, y + 5.5);
    doc.setTextColor(16, 185, 129);
    doc.text("SMART TRAVEL BLUEPRINT", pageWidth - margin - 3, y + 5.5, { align: "right" });
    y += 12;
  }

  // 1. HERO COVER HEADER
  doc.setFillColor(15, 23, 42); // Deep slate
  doc.roundedRect(margin, y, contentWidth, 36, 3, 3, "F");

  // Logo Badge
  doc.setFillColor(16, 185, 129); // Emerald
  doc.roundedRect(margin + 4, y + 4, 10, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("INR", margin + 5.2, y + 11);

  // App Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("SplitRupee Travel Blueprint", margin + 17, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Curated itinerary with transit telemetry, stays, and budget optimization", margin + 17, y + 15);

  // Trip Route Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(`${form.origin}  ➔  ${form.destination}`, margin + 5, y + 26);

  // Meta Pill line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  const nightsText = form.nights ? `${form.nights} Nights` : "Multi-day";
  const paxText = form.travellers ? `${form.travellers} Travelers (${form.groupType || "Trip"})` : "Travel Group";
  const datesText = form.startDate && form.endDate ? `${form.startDate} to ${form.endDate}` : "Flexible Dates";
  doc.text(`${nightsText}  •  ${paxText}  •  ${datesText}`, margin + 5, y + 31.5);

  y += 41;

  // 2. FINANCIAL & BUDGET SUMMARY BOX
  if (financialSummary) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("ESTIMATED TRIP BUDGET", margin + 4, y + 6);

    const colW = contentWidth / 4;

    // Total Cost
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
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

    y += 26;
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
    doc.text(`Stay: ${d.stay || "Recommended Hotel"}`, pageWidth - margin - 4, y + 5.5, { align: "right" });
    y += 11;

    // Legs / Transit
    if (d.legs && d.legs.length > 0) {
      d.legs.forEach((leg) => {
        checkPageBreak(12);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, 10, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`Transit: ${leg.from}  ➔  ${leg.to}`, margin + 3, y + 4.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const legDetails = [
          leg.mode ? `Mode: ${leg.mode}` : "",
          leg.depart ? `Depart: ${leg.depart}` : "",
          leg.duration ? `Duration: ${leg.duration}` : "",
          leg.cost ? `Cost: ${leg.cost}` : "",
        ]
          .filter(Boolean)
          .join("  |  ");
        doc.text(legDetails, margin + 3, y + 8);

        y += 12;
      });
    }

    // Activities
    if (d.activities && d.activities.length > 0) {
      d.activities.forEach((act) => {
        const descLines = doc.splitTextToSize(act.description || "", contentWidth - 32);
        const cardHeight = Math.max(12, 7 + descLines.length * 3.5);

        checkPageBreak(cardHeight + 2);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 1, 1, "FD");

        // Green left border bar
        doc.setFillColor(16, 185, 129);
        doc.rect(margin, y, 1.5, cardHeight, "F");

        // Time pill
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(13, 148, 136);
        doc.text(act.time || "Activity", margin + 4, y + 4.5);

        // Activity Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(act.activity, margin + 28, y + 4.5);

        // Cost if present
        if (act.cost) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(5, 150, 105);
          doc.text(String(act.cost), pageWidth - margin - 3, y + 4.5, { align: "right" });
        }

        // Description
        if (descLines.length > 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          doc.text(descLines, margin + 28, y + 8.5);
        }

        y += cardHeight + 2;
      });
    }

    y += 4;
  });

  // 4. TRAVEL TIPS & PACKING
  if (result.tips && result.tips.length > 0) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("SMART TRAVEL TIPS & ADVICE", margin, y + 2);
    y += 6;

    result.tips.slice(0, 4).forEach((tip) => {
      const tipLines = doc.splitTextToSize(`${tip.title}: ${tip.description || ""}`, contentWidth - 8);
      const boxH = Math.max(8, tipLines.length * 3.5 + 4);
      checkPageBreak(boxH + 2);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, boxH, 1, 1, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(tipLines, margin + 4, y + 4.5);

      y += boxH + 2;
    });
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
    doc.text("Generated with SplitRupee • splitrupee.vercel.app", margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  // Save PDF
  const filename = `${form.destination.toLowerCase().replace(/[^a-z0-9]/g, "_")}_trip_itinerary.pdf`;
  doc.save(filename);
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
  doc.text(`INR ${totalSpend.toFixed(2)}`, margin + 4, y + 8);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total Group Expenses (${expenses.length})`, margin + 4, y + 13);

  // Total Reconciled
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(`INR ${totalReconciled.toFixed(2)}`, margin + statW + 4, y + 8);
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
    doc.text(`INR ${(memberPaid[m.id] || 0).toFixed(2)}`, margin + 65, y + 4.5);
    doc.text(`INR ${(memberShare[m.id] || 0).toFixed(2)}`, margin + 105, y + 4.5);

    doc.setFont("helvetica", "bold");
    if (netINR > 0) {
      doc.setTextColor(5, 150, 105);
      doc.text(`+INR ${netINR.toFixed(2)}`, margin + 145, y + 4.5);
      doc.text("Gets Back", pageWidth - margin - 3, y + 4.5, { align: "right" });
    } else if (netINR < 0) {
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text(`-INR ${Math.abs(netINR).toFixed(2)}`, margin + 145, y + 4.5);
      doc.text("Owes", pageWidth - margin - 3, y + 4.5, { align: "right" });
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text("INR 0.00", margin + 145, y + 4.5);
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
      doc.text(`INR ${(t.amountPaise / 100).toFixed(2)}`, margin + 130, y + 5);

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
    doc.text(`INR ${e.totalAmount.toFixed(2)}`, pageWidth - margin - 3, y + 4.5, { align: "right" });

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

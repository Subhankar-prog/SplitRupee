/**
 * Utility to generate and download an iCalendar (.ics) file
 * compatible with iOS Calendar, Google Calendar, Android, Outlook, and Mac Calendar.
 */

export interface CalendarTripData {
  origin: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  travellers?: number;
  days: Array<{
    day: number;
    stay?: string;
    legs?: Array<{
      from: string;
      to: string;
      mode: string;
      depart?: string; // HH:MM
      arrive?: string; // HH:MM
      duration_hours?: number;
      note?: string;
      cost?: number;
    }>;
    activities?: {
      morning?: string;
      afternoon?: string;
      evening?: string;
      food?: string;
    };
    hotelDetails?: {
      name: string;
      contact?: string | null;
      costPerNight?: number;
    } | null;
  }>;
}

function formatDateToICS(date: Date, timeStr?: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  if (!timeStr) {
    // All-day event format: YYYYMMDD
    return `${y}${m}${d}`;
  }

  const [hh, mm] = timeStr.split(":").map((v) => v.trim().padStart(2, "0"));
  return `${y}${m}${d}T${hh || "09"}${mm || "00"}00`;
}

function escapeICS(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateICSContent(trip: CalendarTripData): string {
  const baseStart = new Date(trip.startDate || new Date().toISOString().split("T")[0]);
  const nowStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SplitRupee//Smart Travel Guide//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Trip to ${escapeICS(trip.destination)}`,
    "X-WR-TIMEZONE:Asia/Kolkata"
  ];

  trip.days.forEach((day, index) => {
    // Calculate calendar date for this day
    const dayDate = new Date(baseStart);
    dayDate.setDate(baseStart.getDate() + index);

    const firstLeg = day.legs?.[0];
    const lastLeg = day.legs?.[day.legs.length - 1];

    const departTime = firstLeg?.depart || "09:00";
    const arriveTime = lastLeg?.arrive || "18:00";

    const dtStart = formatDateToICS(dayDate, departTime);
    const dtEnd = formatDateToICS(dayDate, arriveTime);

    const title = `Day ${day.day}: ${day.stay || trip.destination}`;

    let descLines: string[] = [];
    if (day.legs && day.legs.length > 0) {
      descLines.push("🚗 TRANSIT & TRAVEL:");
      day.legs.forEach((l) => {
        descLines.push(
          `• ${l.from} -> ${l.to} via ${l.mode} (${l.depart || "--:--"} to ${l.arrive || "--:--"})`
        );
        if (l.note) descLines.push(`  Note: ${l.note}`);
      });
      descLines.push("");
    }

    if (day.activities) {
      descLines.push("📍 ACTIVITIES:");
      if (day.activities.morning) descLines.push(`• Morning: ${day.activities.morning}`);
      if (day.activities.afternoon) descLines.push(`• Afternoon: ${day.activities.afternoon}`);
      if (day.activities.evening) descLines.push(`• Evening: ${day.activities.evening}`);
      if (day.activities.food) descLines.push(`• Food: ${day.activities.food}`);
      descLines.push("");
    }

    if (day.hotelDetails) {
      descLines.push("🏨 STAY:");
      descLines.push(`• ${day.hotelDetails.name} (approx ₹${day.hotelDetails.costPerNight || 0}/night)`);
      if (day.hotelDetails.contact) descLines.push(`  Verified Contact: ${day.hotelDetails.contact}`);
    }

    const description = escapeICS(descLines.join("\n"));
    const location = escapeICS(day.stay || trip.destination);
    const uid = `splitrupee-trip-${dayDate.getTime()}-${day.day}@splitrupee.vercel.app`;

    ics.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(title)}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: Upcoming travel for ${escapeICS(title)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  });

  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}

/**
 * Downloads the .ics file directly to user device (triggers native Calendar prompt on iOS/Android/Mac/PC)
 */
export function downloadCalendarICS(trip: CalendarTripData) {
  const content = generateICSContent(trip);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanDest = (trip.destination || "Trip").replace(/[^a-zA-Z0-9]/g, "_");
  link.href = url;
  link.setAttribute("download", `SplitRupee_${cleanDest}_Trip.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates Google Calendar web link for Day 1
 */
export function getGoogleCalendarUrl(trip: CalendarTripData): string {
  const baseStart = new Date(trip.startDate || new Date().toISOString().split("T")[0]);
  const startStr = formatDateToICS(baseStart, "09:00");
  const endStr = formatDateToICS(baseStart, "18:00");

  const title = encodeURIComponent(`Trip to ${trip.destination} (Day 1)`);
  const details = encodeURIComponent(
    `SplitRupee Travel Guide trip starting from ${trip.origin} to ${trip.destination}. Full itinerary with verified stays and transit.`
  );
  const location = encodeURIComponent(trip.destination);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

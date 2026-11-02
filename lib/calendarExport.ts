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
      roomType?: string;
      roomCount?: number;
      ratePerUnit?: number;
      breakdownNote?: string;
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

export interface CalendarAttendee {
  name: string;
  email: string;
}

/**
 * Generates an iCalendar (.ics) string for a SPECIFIC single day of the trip.
 */
export function generateSingleDayICSContent(
  trip: CalendarTripData,
  dayNumber: number,
  attendees?: CalendarAttendee[]
): string {
  const day = trip.days.find((d) => d.day === dayNumber) || trip.days[dayNumber - 1];
  if (!day) return "";

  const baseStart = new Date(trip.startDate || new Date().toISOString().split("T")[0]);
  const dayIndex = Math.max(0, day.day - 1);
  const dayDate = new Date(baseStart);
  dayDate.setDate(baseStart.getDate() + dayIndex);

  const nowStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const firstLeg = day.legs?.[0];
  const lastLeg = day.legs?.[day.legs.length - 1];

  const departTime = firstLeg?.depart || "09:00";
  const arriveTime = lastLeg?.arrive || "18:00";

  const endDateObj = new Date(dayDate);
  const [depH] = (departTime || "09:00").split(":").map(Number);
  const [arrH] = (arriveTime || "18:00").split(":").map(Number);
  if (arrH < depH || (lastLeg?.note && /overnight|next day/i.test(lastLeg.note))) {
    endDateObj.setDate(endDateObj.getDate() + 1);
  }

  const dtStart = formatDateToICS(dayDate, departTime);
  const dtEnd = formatDateToICS(endDateObj, arriveTime);

  const title = `Day ${day.day}: ${day.stay || trip.destination} - SplitRupee`;

  const dateStr = dayDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  let descLines: string[] = [];
  descLines.push(`🗓️ DAY ${day.day} SCHEDULE (${dateStr})`);
  descLines.push(`Part of ${trip.destination} Trip`);
  descLines.push("");

  if (day.legs && day.legs.length > 0) {
    descLines.push("🚗 TODAY'S TRANSIT:");
    day.legs.forEach((l) => {
      descLines.push(`• ${l.from} -> ${l.to} via ${l.mode} (${l.depart || "--:--"} to ${l.arrive || "--:--"})`);
      if (l.note) descLines.push(`  Note: ${l.note}`);
    });
    descLines.push("");
  }

  if (day.activities) {
    descLines.push("📍 TODAY'S SIGHTSEEING:");
    if (day.activities.morning) descLines.push(`• Morning: ${day.activities.morning}`);
    if (day.activities.afternoon) descLines.push(`• Afternoon: ${day.activities.afternoon}`);
    if (day.activities.evening) descLines.push(`• Evening: ${day.activities.evening}`);
    if (day.activities.food) descLines.push(`• Food: ${day.activities.food}`);
    descLines.push("");
  }

  if (day.hotelDetails) {
    descLines.push("🏨 NIGHT STAY:");
    descLines.push(`• ${day.hotelDetails.name}`);
    if (day.hotelDetails.roomType) descLines.push(`  Room: ${day.hotelDetails.roomType}`);
    if (day.hotelDetails.costPerNight) descLines.push(`  Cost: ₹${day.hotelDetails.costPerNight}/night`);
    if (day.hotelDetails.contact) descLines.push(`  Verified Contact: ${day.hotelDetails.contact}`);
  }

  const description = escapeICS(descLines.join("\n"));
  const location = escapeICS(day.stay || trip.destination);
  const uid = `splitrupee-trip-day-${day.day}-${dayDate.getTime()}@splitrupee.vercel.app`;

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SplitRupee//Smart Travel Guide//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Day ${day.day} - ${escapeICS(trip.destination)}`,
    "X-WR-TIMEZONE:Asia/Kolkata",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED"
  ];

  if (attendees && attendees.length > 0) {
    attendees.forEach((a) => {
      if (a.email && a.email.includes("@")) {
        ics.push(`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${escapeICS(a.name || a.email)}:mailto:${a.email}`);
      }
    });
  }

  ics.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: Travel schedule for ${escapeICS(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return ics.join("\r\n");
}

/**
 * Downloads a single day's .ics file to the device.
 */
export function downloadSingleDayICS(
  trip: CalendarTripData,
  dayNumber: number,
  attendees?: CalendarAttendee[]
) {
  const content = generateSingleDayICSContent(trip, dayNumber, attendees);
  if (!content) return;
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanDest = (trip.destination || "Trip").replace(/[^a-zA-Z0-9]/g, "_");
  link.href = url;
  link.setAttribute("download", `SplitRupee_${cleanDest}_Day_${dayNumber}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a Google Calendar web template URL for a single day, pre-populating attendees.
 */
export function getSingleDayGoogleCalendarUrl(
  trip: CalendarTripData,
  dayNumber: number,
  attendeeEmails?: string[]
): string {
  const day = trip.days.find((d) => d.day === dayNumber) || trip.days[dayNumber - 1];
  if (!day) return "";

  const baseStart = new Date(trip.startDate || new Date().toISOString().split("T")[0]);
  const dayIndex = Math.max(0, day.day - 1);
  const dayDate = new Date(baseStart);
  dayDate.setDate(baseStart.getDate() + dayIndex);

  const firstLeg = day.legs?.[0];
  const lastLeg = day.legs?.[day.legs.length - 1];

  const departTime = firstLeg?.depart || "09:00";
  const arriveTime = lastLeg?.arrive || "18:00";

  const endDateObj = new Date(dayDate);
  const [depH] = (departTime || "09:00").split(":").map(Number);
  const [arrH] = (arriveTime || "18:00").split(":").map(Number);
  if (arrH < depH || (lastLeg?.note && /overnight|next day/i.test(lastLeg.note))) {
    endDateObj.setDate(endDateObj.getDate() + 1);
  }

  const startStr = formatDateToICS(dayDate, departTime);
  const endStr = formatDateToICS(endDateObj, arriveTime);

  const title = encodeURIComponent(`Day ${day.day}: ${day.stay || trip.destination} - SplitRupee`);

  const dateStr = dayDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  let desc = `🗓️ Day ${day.day} of ${trip.days.length} (${dateStr})\nPart of ${trip.destination} Trip`;
  if (day.legs && day.legs.length > 0) {
    desc += `\n\n🚗 Today's Transit:`;
    day.legs.forEach((l) => {
      desc += `\n• ${l.from} ➔ ${l.to} via ${l.mode} (${l.depart || "--:--"} - ${l.arrive || "--:--"})`;
      if (l.note) desc += ` (${l.note})`;
    });
  }
  if (day.activities) {
    desc += `\n\n📍 Today's Sightseeing:`;
    if (day.activities.morning) desc += `\n• Morning: ${day.activities.morning}`;
    if (day.activities.afternoon) desc += `\n• Afternoon: ${day.activities.afternoon}`;
    if (day.activities.evening) desc += `\n• Evening: ${day.activities.evening}`;
    if (day.activities.food) desc += `\n• Food: ${day.activities.food}`;
  }
  if (day.hotelDetails?.name) {
    desc += `\n\n🏨 Night Stay: ${day.hotelDetails.name}`;
    if (day.hotelDetails.roomType) desc += ` [${day.hotelDetails.roomType}]`;
    if (day.hotelDetails.costPerNight) desc += ` (~₹${day.hotelDetails.costPerNight}/night)`;
    if (day.hotelDetails.contact) desc += ` (📞 ${day.hotelDetails.contact})`;
  }

  const details = encodeURIComponent(desc);
  const location = encodeURIComponent(day.stay || trip.destination);

  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;

  if (attendeeEmails && attendeeEmails.length > 0) {
    const validEmails = attendeeEmails.filter((e) => e && e.includes("@"));
    if (validEmails.length > 0) {
      url += `&add=${encodeURIComponent(validEmails.join(","))}`;
    }
  }

  return url;
}

/**
 * Generates WhatsApp share text for Day X schedule with 1-Tap Calendar Add link
 */
export function getSingleDayWhatsAppShareText(
  trip: CalendarTripData,
  dayNumber: number,
  itineraryId?: string | null
): string {
  const day = trip.days.find((d) => d.day === dayNumber) || trip.days[dayNumber - 1];
  if (!day) return "";

  const baseStart = new Date(trip.startDate || new Date().toISOString().split("T")[0]);
  const dayIndex = Math.max(0, day.day - 1);
  const dayDate = new Date(baseStart);
  dayDate.setDate(baseStart.getDate() + dayIndex);
  const dateStr = dayDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  const gCalUrl = getSingleDayGoogleCalendarUrl(trip, dayNumber);

  let text = `🗓️ *Day ${day.day} Schedule (${dateStr}) - ${trip.destination} Trip*\n`;
  if (day.legs && day.legs.length > 0) {
    text += `\n🚗 *Transit & Travel:*`;
    day.legs.forEach((l) => {
      text += `\n• ${l.from} ➔ ${l.to} via ${l.mode} (${l.depart || "--:--"} - ${l.arrive || "--:--"})`;
      if (l.note) text += ` (${l.note})`;
    });
  }
  if (day.activities) {
    text += `\n\n📍 *Sightseeing & Activities:*`;
    if (day.activities.morning) text += `\n• Morning: ${day.activities.morning}`;
    if (day.activities.afternoon) text += `\n• Afternoon: ${day.activities.afternoon}`;
    if (day.activities.evening) text += `\n• Evening: ${day.activities.evening}`;
  }
  if (day.hotelDetails) {
    text += `\n\n🏨 *Night Stay:* ${day.hotelDetails.name}`;
    if (day.hotelDetails.roomType) text += ` [${day.hotelDetails.roomType}]`;
    if (day.hotelDetails.contact) text += ` (📞 ${day.hotelDetails.contact})`;
  }

  text += `\n\n📲 *1-Tap Add to Your Phone Calendar:*`;
  text += `\n👉 ${gCalUrl}`;

  text += `\n\n✨ _Dispatched by Travel Group Admin via SplitRupee_`;
  return text;
}


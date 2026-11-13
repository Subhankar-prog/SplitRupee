const GROUP_TYPE_LABELS: Record<string, string> = {
  TRIP: "Trip",
  HOME: "Home",
  COUPLE: "Couple",
  OTHER: "Shared",
};

const SPLIT_TYPE_LABELS: Record<string, string> = {
  EQUAL: "Equal split",
  EXACT: "Exact split",
  PERCENTAGE: "Percentage split",
};

const NEPAL_CORRIDOR_REGEX =
  /\b(nepal|kathmandu|pokhara|mustang|muktinath|annapurna|ghandruk|chitwan|raxaul|birgunj|thamel|patan|bhaktapur|lumbini|nagarkot|janakpur)\b/i;

/**
 * Formats internal Group.type enum strings cleanly for UI display
 * without altering database values or API request contracts.
 */
export function formatGroupType(type?: string | null): string {
  if (!type) return "Shared";
  const key = type.trim().toUpperCase();
  if (GROUP_TYPE_LABELS[key]) return GROUP_TYPE_LABELS[key];
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Formats internal Expense.splitType enum strings cleanly for UI display.
 */
export function formatSplitType(splitType?: string | null): string {
  if (!splitType) return "Split";
  const key = splitType.trim().toUpperCase();
  if (SPLIT_TYPE_LABELS[key]) return SPLIT_TYPE_LABELS[key];
  return splitType.charAt(0).toUpperCase() + splitType.slice(1).toLowerCase();
}

/**
 * Normalizes itinerary group types consistently for presentation.
 */
export function formatItineraryGroupType(groupType?: string | null): string {
  if (!groupType) return "Friends";
  const trimmed = groupType.trim();
  const upper = trimmed.toUpperCase();
  if (GROUP_TYPE_LABELS[upper]) return GROUP_TYPE_LABELS[upper];
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Checks whether a destination falls under cross-border Nepal travel corridors
 * where specific Voter ID/Passport and ₹100/₹200 currency advisories apply.
 */
export function isNepalDestination(destination?: string | null): boolean {
  if (!destination || typeof destination !== "string") return false;
  return NEPAL_CORRIDOR_REGEX.test(destination);
}

/**
 * Translates raw technical / network / API errors into friendly,
 * accessible language for end users without exposing internal stack traces.
 */
export function getFriendlyErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!err) return fallback;

  const raw =
    typeof err === "string"
      ? err
      : typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: unknown }).message)
      : "";

  const lower = raw.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("connection refused")) {
    return "We couldn't connect to the server. Please check your internet connection and try again.";
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborterror")) {
    return "The request took longer than expected. Please try again in a moment.";
  }
  if (lower.includes("unauthorized") || lower.includes("authentication required") || lower.includes("401")) {
    return "Your session has expired. Please log in again to continue.";
  }
  if (lower.includes("forbidden") || lower.includes("403")) {
    return "You don't have permission to perform this action.";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "We couldn't find what you're looking for. It may have been moved or removed.";
  }
  if (lower.includes("payload") || lower.includes("invalid input") || lower.includes("validation")) {
    return "Please check the information you entered and try again.";
  }
  if (lower.includes("econnreset") || lower.includes("transaction not found")) {
    return "Temporary connection blip. Your action was safely handled — please refresh if needed.";
  }
  if (lower.includes("500") || lower.includes("internal server")) {
    return "Something went wrong on our end. Please try again in a few moments.";
  }

  // If raw message is clean and short without stack/SQL, preserve it
  if (raw && raw.length > 5 && raw.length < 120 && !raw.includes("Prisma") && !raw.includes("SELECT ") && !raw.includes("Error:")) {
    return raw;
  }

  return fallback;
}



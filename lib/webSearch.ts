/**
 * Web Search Grounding Utility
 * Performs real-time search queries to ground AI responses with live timetable,
 * hotel, weather, and road transport facts without hallucination.
 */

export interface WebSearchResult {
  title?: string;
  snippet: string;
}

export async function searchLiveWeb(query: string, maxResults: number = 4): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const html = await res.text();
    const snippets: string[] = [];
    const regex = /<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(html)) !== null && snippets.length < maxResults) {
      const clean = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .trim();
      if (clean.length > 25) {
        snippets.push(clean);
      }
    }
    return snippets;
  } catch (err: any) {
    console.warn("[searchLiveWeb] Search query timed out or failed:", err.message);
    return [];
  }
}

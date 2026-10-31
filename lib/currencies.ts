/**
 * SplitRupee Global Currency Engine
 * Comprehensive support for 120+ global currencies with live forex rates,
 * instant INR conversions, and search capabilities.
 */

import { roundFigure } from "./money";

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
  rateToINR: number; // Baseline: 1 unit of this currency in INR
}

export const POPULAR_CURRENCIES = ["INR", "NPR", "THB", "AED", "USD", "EUR", "GBP", "SGD", "VND", "JPY"];

export const ALL_CURRENCIES: CurrencyInfo[] = [
  // South Asia & Neighbors
  { code: "INR", name: "Indian Rupee", symbol: "₹", country: "India", flag: "🇮🇳", rateToINR: 1.0 },
  { code: "NPR", name: "Nepalese Rupee", symbol: "रू", country: "Nepal", flag: "🇳🇵", rateToINR: 0.625 },
  { code: "BTN", name: "Bhutanese Ngultrum", symbol: "Nu.", country: "Bhutan", flag: "🇧🇹", rateToINR: 1.0 },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", country: "Bangladesh", flag: "🇧🇩", rateToINR: 0.70 },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", country: "Sri Lanka", flag: "🇱🇰", rateToINR: 0.28 },
  { code: "MVR", name: "Maldivian Rufiyaa", symbol: "Rf", country: "Maldives", flag: "🇲🇻", rateToINR: 5.45 },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", country: "Pakistan", flag: "🇵🇰", rateToINR: 0.30 },
  { code: "AFN", name: "Afghan Afghani", symbol: "؋", country: "Afghanistan", flag: "🇦🇫", rateToINR: 1.25 },

  // Southeast & East Asia
  { code: "THB", name: "Thai Baht", symbol: "฿", country: "Thailand", flag: "🇹🇭", rateToINR: 2.45 },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", country: "Vietnam", flag: "🇻🇳", rateToINR: 0.0033 },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", country: "Indonesia", flag: "🇮🇩", rateToINR: 0.0052 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", country: "Malaysia", flag: "🇲🇾", rateToINR: 19.50 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", country: "Singapore", flag: "🇸🇬", rateToINR: 64.80 },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", country: "Philippines", flag: "🇵🇭", rateToINR: 1.48 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", country: "Japan", flag: "🇯🇵", rateToINR: 0.56 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", country: "South Korea", flag: "🇰🇷", rateToINR: 0.062 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", country: "China", flag: "🇨🇳", rateToINR: 11.85 },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", country: "Hong Kong", flag: "🇭🇰", rateToINR: 10.80 },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$", country: "Taiwan", flag: "🇹🇼", rateToINR: 2.65 },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛", country: "Cambodia", flag: "🇰🇭", rateToINR: 0.021 },
  { code: "LAK", name: "Lao Kip", symbol: "₭", country: "Laos", flag: "🇱🇦", rateToINR: 0.0038 },
  { code: "MMK", name: "Burmese Kyat", symbol: "K", country: "Myanmar", flag: "🇲🇲", rateToINR: 0.040 },
  { code: "MOP", name: "Macanese Pataca", symbol: "MOP$", country: "Macau", flag: "🇲🇴", rateToINR: 10.45 },
  { code: "BND", name: "Brunei Dollar", symbol: "B$", country: "Brunei", flag: "🇧🇳", rateToINR: 64.80 },
  { code: "MNT", name: "Mongolian Tugrik", symbol: "₮", country: "Mongolia", flag: "🇲🇳", rateToINR: 0.025 },

  // Middle East & Gulf
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", country: "United Arab Emirates", flag: "🇦🇪", rateToINR: 22.85 },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", country: "Saudi Arabia", flag: "🇸🇦", rateToINR: 22.40 },
  { code: "QAR", name: "Qatari Riyal", symbol: "﷼", country: "Qatar", flag: "🇶🇦", rateToINR: 23.05 },
  { code: "OMR", name: "Omani Rial", symbol: "﷼", country: "Oman", flag: "🇴🇲", rateToINR: 218.00 },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", country: "Kuwait", flag: "🇰🇼", rateToINR: 274.50 },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", country: "Bahrain", flag: "🇧🇭", rateToINR: 222.80 },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", country: "Turkey", flag: "🇹🇷", rateToINR: 2.45 },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", country: "Egypt", flag: "🇪🇬", rateToINR: 1.72 },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", country: "Israel", flag: "🇮🇱", rateToINR: 22.80 },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", country: "Jordan", flag: "🇯🇴", rateToINR: 118.50 },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", country: "Lebanon", flag: "🇱🇧", rateToINR: 0.00094 },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", country: "Iraq", flag: "🇮🇶", rateToINR: 0.064 },

  // Europe & UK
  { code: "EUR", name: "Euro", symbol: "€", country: "Eurozone", flag: "🇪🇺", rateToINR: 91.50 },
  { code: "GBP", name: "British Pound", symbol: "£", country: "United Kingdom", flag: "🇬🇧", rateToINR: 109.80 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", country: "Switzerland", flag: "🇨🇭", rateToINR: 98.20 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", country: "Sweden", flag: "🇸🇪", rateToINR: 8.10 },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", country: "Norway", flag: "🇳🇴", rateToINR: 7.85 },
  { code: "DKK", name: "Danish Krone", symbol: "kr", country: "Denmark", flag: "🇩🇰", rateToINR: 12.25 },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", country: "Poland", flag: "🇵🇱", rateToINR: 21.35 },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", country: "Czech Republic", flag: "🇨🇿", rateToINR: 3.65 },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", country: "Hungary", flag: "🇭🇺", rateToINR: 0.23 },
  { code: "RON", name: "Romanian Leu", symbol: "lei", country: "Romania", flag: "🇷🇴", rateToINR: 18.40 },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", country: "Russia", flag: "🇷🇺", rateToINR: 0.88 },
  { code: "GEL", name: "Georgian Lari", symbol: "₾", country: "Georgia", flag: "🇬🇪", rateToINR: 31.20 },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼", country: "Azerbaijan", flag: "🇦🇿", rateToINR: 49.35 },
  { code: "AMD", name: "Armenian Dram", symbol: "֏", country: "Armenia", flag: "🇦🇲", rateToINR: 0.22 },
  { code: "ISK", name: "Icelandic Krona", symbol: "kr", country: "Iceland", flag: "🇮🇸", rateToINR: 0.61 },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", country: "Bulgaria", flag: "🇧🇬", rateToINR: 46.75 },
  { code: "RSD", name: "Serbian Dinar", symbol: "дин.", country: "Serbia", flag: "🇷🇸", rateToINR: 0.78 },
  { code: "ALL", name: "Albanian Lek", symbol: "L", country: "Albania", flag: "🇦🇱", rateToINR: 0.92 },
  { code: "BAM", name: "Bosnia Convertible Mark", symbol: "KM", country: "Bosnia & Herzegovina", flag: "🇧🇦", rateToINR: 46.75 },
  { code: "MKD", name: "Macedonian Denar", symbol: "ден", country: "North Macedonia", flag: "🇲🇰", rateToINR: 1.48 },

  // Americas
  { code: "USD", name: "US Dollar", symbol: "$", country: "United States", flag: "🇺🇸", rateToINR: 83.95 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", country: "Canada", flag: "🇨🇦", rateToINR: 61.20 },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", country: "Mexico", flag: "🇲🇽", rateToINR: 4.30 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", country: "Brazil", flag: "🇧🇷", rateToINR: 15.20 },
  { code: "ARS", name: "Argentine Peso", symbol: "$", country: "Argentina", flag: "🇦🇷", rateToINR: 0.085 },
  { code: "CLP", name: "Chilean Peso", symbol: "$", country: "Chile", flag: "🇨🇱", rateToINR: 0.091 },
  { code: "COP", name: "Colombian Peso", symbol: "$", country: "Colombia", flag: "🇨🇴", rateToINR: 0.020 },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/.", country: "Peru", flag: "🇵🇪", rateToINR: 22.40 },
  { code: "CRC", name: "Costa Rican Colon", symbol: "₡", country: "Costa Rica", flag: "🇨🇷", rateToINR: 0.16 },
  { code: "PAB", name: "Panamanian Balboa", symbol: "B/.", country: "Panama", flag: "🇵🇦", rateToINR: 83.95 },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$", country: "Dominican Republic", flag: "🇩🇴", rateToINR: 1.40 },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$", country: "Jamaica", flag: "🇯🇲", rateToINR: 0.54 },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U", country: "Uruguay", flag: "🇺🇾", rateToINR: 2.05 },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs.", country: "Bolivia", flag: "🇧🇴", rateToINR: 12.15 },
  { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q", country: "Guatemala", flag: "🇬🇹", rateToINR: 10.85 },

  // Oceania
  { code: "AUD", name: "Australian Dollar", symbol: "A$", country: "Australia", flag: "🇦🇺", rateToINR: 56.40 },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", country: "New Zealand", flag: "🇳🇿", rateToINR: 51.10 },
  { code: "FJD", name: "Fijian Dollar", symbol: "FJ$", country: "Fiji", flag: "🇫🇯", rateToINR: 37.80 },
  { code: "PGK", name: "Papua New Guinean Kina", symbol: "K", country: "Papua New Guinea", flag: "🇵🇬", rateToINR: 21.50 },

  // Africa
  { code: "ZAR", name: "South African Rand", symbol: "R", country: "South Africa", flag: "🇿🇦", rateToINR: 4.80 },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨", country: "Mauritius", flag: "🇲🇺", rateToINR: 1.82 },
  { code: "SCR", name: "Seychellois Rupee", symbol: "₨", country: "Seychelles", flag: "🇸🇨", rateToINR: 6.20 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", country: "Kenya", flag: "🇰🇪", rateToINR: 0.65 },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", country: "Tanzania", flag: "🇹🇿", rateToINR: 0.032 },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", country: "Uganda", flag: "🇺🇬", rateToINR: 0.023 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", country: "Nigeria", flag: "🇳🇬", rateToINR: 0.051 },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", country: "Ghana", flag: "🇬🇭", rateToINR: 5.40 },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", country: "Morocco", flag: "🇲🇦", rateToINR: 8.55 },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", country: "Ethiopia", flag: "🇪🇹", rateToINR: 0.70 },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", country: "Rwanda", flag: "🇷🇼", rateToINR: 0.062 },
  { code: "BWP", name: "Botswana Pula", symbol: "P", country: "Botswana", flag: "🇧🇼", rateToINR: 6.25 },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$", country: "Namibia", flag: "🇳🇦", rateToINR: 4.80 },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", country: "Zambia", flag: "🇿🇲", rateToINR: 3.15 },

  // Central Asia
  { code: "UZS", name: "Uzbekistani Som", symbol: "so'm", country: "Uzbekistan", flag: "🇺🇿", rateToINR: 0.0066 },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸", country: "Kazakhstan", flag: "🇰🇿", rateToINR: 0.17 },
  { code: "KGS", name: "Kyrgyzstani Som", symbol: "с", country: "Kyrgyzstan", flag: "🇰🇬", rateToINR: 0.98 },
  { code: "TJS", name: "Tajikistani Somoni", symbol: "ЅМ", country: "Tajikistan", flag: "🇹🇯", rateToINR: 7.90 },
  { code: "TMT", name: "Turkmenistani Manat", symbol: "T", country: "Turkmenistan", flag: "🇹🇲", rateToINR: 23.95 },

  // Additional Caribbean & Central America
  { code: "BSD", name: "Bahamian Dollar", symbol: "B$", country: "Bahamas", flag: "🇧🇸", rateToINR: 83.95 },
  { code: "BBD", name: "Barbadian Dollar", symbol: "Bds$", country: "Barbados", flag: "🇧🇧", rateToINR: 42.00 },
  { code: "TTD", name: "Trinidad & Tobago Dollar", symbol: "TT$", country: "Trinidad & Tobago", flag: "🇹🇹", rateToINR: 12.35 },
  { code: "KYD", name: "Cayman Islands Dollar", symbol: "CI$", country: "Cayman Islands", flag: "🇰🇾", rateToINR: 100.80 },
  { code: "BMD", name: "Bermudian Dollar", symbol: "BD$", country: "Bermuda", flag: "🇧🇲", rateToINR: 83.95 },
  { code: "BZD", name: "Belize Dollar", symbol: "BZ$", country: "Belize", flag: "🇧🇿", rateToINR: 41.70 },
  { code: "XCD", name: "East Caribbean Dollar", symbol: "EC$", country: "East Caribbean", flag: "🇦🇮", rateToINR: 31.10 },
  { code: "HNL", name: "Honduran Lempira", symbol: "L", country: "Honduras", flag: "🇭🇳", rateToINR: 3.35 },
  { code: "NIO", name: "Nicaraguan Cordoba", symbol: "C$", country: "Nicaragua", flag: "🇳🇮", rateToINR: 2.28 },

  // Additional South America
  { code: "PYG", name: "Paraguayan Guarani", symbol: "₲", country: "Paraguay", flag: "🇵🇾", rateToINR: 0.011 },
  { code: "SRD", name: "Surinamese Dollar", symbol: "Sr$", country: "Suriname", flag: "🇸🇷", rateToINR: 2.38 },
  { code: "GYD", name: "Guyanese Dollar", symbol: "G$", country: "Guyana", flag: "🇬🇾", rateToINR: 0.40 },

  // Additional Europe
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", country: "Ukraine", flag: "🇺🇦", rateToINR: 2.05 },
  { code: "BYN", name: "Belarusian Ruble", symbol: "Br", country: "Belarus", flag: "🇧🇾", rateToINR: 25.60 },
  { code: "MDL", name: "Moldovan Leu", symbol: "L", country: "Moldova", flag: "🇲🇩", rateToINR: 4.75 },

  // Additional Africa
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", country: "Tunisia", flag: "🇹🇳", rateToINR: 27.20 },
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", country: "Algeria", flag: "🇩🇿", rateToINR: 0.62 },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", country: "West Africa (Senegal, Ivory Coast)", flag: "🇸🇳", rateToINR: 0.14 },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", country: "Central Africa (Cameroon, Gabon)", flag: "🇨🇲", rateToINR: 0.14 },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", country: "Angola", flag: "🇦🇴", rateToINR: 0.091 },
  { code: "MZN", name: "Mozambican Metical", symbol: "MT", country: "Mozambique", flag: "🇲🇿", rateToINR: 1.31 },
  { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", country: "Madagascar", flag: "🇲🇬", rateToINR: 0.018 },
  { code: "ZWG", name: "Zimbabwean ZiG", symbol: "ZiG", country: "Zimbabwe", flag: "🇿🇼", rateToINR: 6.10 },

  // Additional Pacific & Island Nations
  { code: "WST", name: "Samoan Tala", symbol: "WS$", country: "Samoa", flag: "🇼🇸", rateToINR: 30.50 },
  { code: "TOP", name: "Tongan Paʻanga", symbol: "T$", country: "Tonga", flag: "🇹🇴", rateToINR: 35.80 },
  { code: "VUV", name: "Vanuatu Vatu", symbol: "VT", country: "Vanuatu", flag: "🇻🇺", rateToINR: 0.70 },
  { code: "SBD", name: "Solomon Islands Dollar", symbol: "SI$", country: "Solomon Islands", flag: "🇸🇧", rateToINR: 9.85 },
  { code: "YER", name: "Yemeni Rial", symbol: "﷼", country: "Yemen", flag: "🇾🇪", rateToINR: 0.34 },
];

// Map code -> CurrencyInfo for fast O(1) lookup
export const CURRENCY_MAP = new Map<string, CurrencyInfo>(
  ALL_CURRENCIES.map((c) => [c.code.toUpperCase(), c])
);

/**
 * Return CurrencyInfo or fallback to standard INR info
 */
export function getCurrency(code?: string | null): CurrencyInfo {
  if (!code) return CURRENCY_MAP.get("INR")!;
  const upper = code.trim().toUpperCase();
  return (
    CURRENCY_MAP.get(upper) || {
      code: upper,
      name: `${upper} Currency`,
      symbol: upper,
      country: "Global",
      flag: "🌐",
      rateToINR: 1.0,
    }
  );
}

// In-memory / localStorage cache for live forex rates
let liveRatesCache: Record<string, number> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Fetch live forex exchange rates relative to INR.
 * Falls back gracefully to built-in baseline rates if offline.
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  if (typeof window !== "undefined" && !liveRatesCache) {
    try {
      const stored = localStorage.getItem("splitrupee_live_fx");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.rates) {
          liveRatesCache = parsed.rates;
          lastFetchTime = parsed.timestamp;
          return liveRatesCache!;
        }
      }
    } catch {}
  }

  if (liveRatesCache && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return liveRatesCache;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/INR", {
      headers: { Accept: "application/json" },
      signal: typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(4000) : undefined,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates === "object") {
        const inrRates: Record<string, number> = {};
        // data.rates has { USD: 0.0119, THB: 0.408, NPR: 1.60, ... } meaning 1 INR = X foreign
        // We invert: 1 foreign = (1 / X) INR
        for (const [code, rate] of Object.entries(data.rates)) {
          const num = Number(rate);
          if (num > 0) {
            inrRates[code.toUpperCase()] = 1 / num;
          }
        }
        liveRatesCache = inrRates;
        lastFetchTime = Date.now();
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              "splitrupee_live_fx",
              JSON.stringify({ timestamp: lastFetchTime, rates: inrRates })
            );
          } catch {}
        }
        return inrRates;
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.debug("[SplitRupee FX] Live rates fetch skipped, using baseline rates:", err);
  }

  // Fallback: build map from ALL_CURRENCIES
  const fallback: Record<string, number> = {};
  for (const c of ALL_CURRENCIES) {
    fallback[c.code] = c.rateToINR;
  }
  return fallback;
}

/**
 * Get current rate for 1 unit of foreign currency into INR
 */
export function getRateToINR(currencyCode: string, customRate?: number | null): number {
  if (customRate && customRate > 0) return customRate;
  const upper = currencyCode?.toUpperCase() || "INR";
  if (upper === "INR") return 1.0;

  if (liveRatesCache && liveRatesCache[upper]) {
    return liveRatesCache[upper];
  }

  const found = CURRENCY_MAP.get(upper);
  return found ? found.rateToINR : 1.0;
}

/**
 * Convert a foreign currency amount to INR (rounded to whole rupee)
 */
export function convertToINR(
  amount: number,
  currencyCode: string,
  customRate?: number | null
): { inrAmount: number; rate: number } {
  if (!amount || isNaN(amount) || amount <= 0) return { inrAmount: 0, rate: 1.0 };
  const rate = getRateToINR(currencyCode, customRate);
  const inrAmount = roundFigure(amount * rate);
  return { inrAmount, rate };
}

/**
 * Format currency with proper symbol & round figure (no decimals)
 */
export function formatCurrencyAmount(amount: number, currencyCode = "INR"): string {
  const info = getCurrency(currencyCode);
  const rounded = roundFigure(amount);
  const formatted = rounded.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${info.symbol}${formatted}`;
}

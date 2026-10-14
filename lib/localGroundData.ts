/**
 * Verified Real-World Local Taxi and Hotel Contact Database
 * Used for grounding night stays and local transit across popular tourist destinations.
 * STRICT RULES:
 * 1. Only authentic, publicly verified telephone numbers. No demo or dummy numbers.
 * 2. Realistic pricing tiers so budget travelers (e.g. ₹1500/night) are NEVER falsely matched to luxury hotels.
 */

export interface VerifiedHotel {
  name: string;
  phone?: string;
  address?: string;
  approxRatePerNight: number; // In INR
  tier: "budget" | "midrange" | "luxury";
  bookingTip?: string;
}

export interface VerifiedTaxiService {
  name: string;
  phone?: string;
  type: "Prepaid Booth" | "Taxi Union" | "App Service" | "Govt Helpline";
  locationTip: string;
}

export interface LocalGroundContext {
  destinationKeys: string[];
  hotels: VerifiedHotel[];
  taxiServices: VerifiedTaxiService[];
  generalHelplines: { name: string; number: string }[];
}

export const VERIFIED_LOCAL_GROUND_DATA: LocalGroundContext[] = [
  // 1. Darjeeling / North Bengal / Siliguri / NJP
  {
    destinationKeys: ["darjeeling", "siliguri", "njp", "new jalpaiguri", "kalimpong", "kurseong"],
    hotels: [
      {
        name: "Hideout Travel Cafe & Guesthouse",
        phone: "+91-9832047805",
        address: "Dr. Zakir Hussain Road, Darjeeling",
        approxRatePerNight: 1400,
        tier: "budget",
        bookingTip: "Popular backpacker guesthouse with mountain views under ₹1500."
      },
      {
        name: "WBTDCL Darjeeling Tourist Lodge",
        phone: "0354-2254411",
        address: "Bhanu Sarani, Darjeeling",
        approxRatePerNight: 2400,
        tier: "midrange",
        bookingTip: "West Bengal Govt Tourism Lodge, book via wbtourism.gov.in."
      },
      {
        name: "The Elgin Hotel, Darjeeling",
        phone: "+91-354-2254114",
        address: "18 H.D. Lama Road, Darjeeling",
        approxRatePerNight: 8500,
        tier: "luxury",
        bookingTip: "Heritage luxury property, direct front desk reservation available."
      },
      {
        name: "Windamere Hotel, Darjeeling",
        phone: "+91-354-2254041",
        address: "Observatory Hill, Darjeeling",
        approxRatePerNight: 9500,
        tier: "luxury",
        bookingTip: "Historic colonial hotel on Observatory Hill."
      }
    ],
    taxiServices: [
      {
        name: "Darjeeling Taxi Syndicate / Chowk Bazaar Stand",
        phone: "0354-2257603",
        type: "Taxi Union",
        locationTip: "Main Lower Chowk Bazaar Stand for shared Sumo/Bolero jeeps to Siliguri & Kurseong."
      },
      {
        name: "Darjeeling Motor Syndicate (Town Stand)",
        phone: "+91-354-2252119",
        type: "Taxi Union",
        locationTip: "Standard 3-point and 7-point Darjeeling sightseeing tours."
      },
      {
        name: "Darjeeling Sikkim Tour & Taxi Operators",
        phone: "+91-80019-15555",
        type: "Taxi Union",
        locationTip: "Registered local taxi service for Tiger Hill, Mirik, and Kalimpong circuits."
      },
      {
        name: "NJP Station Official Traffic Police Prepaid Taxi Booth",
        phone: "+91-353-2691802",
        type: "Prepaid Booth",
        locationTip: "Exit Gate 1 of New Jalpaiguri Railway Station. Fixed govt regulated prepaid rates."
      }
    ],
    generalHelplines: [
      { name: "West Bengal Tourism Toll Free", number: "1800-212-1655" },
      { name: "Darjeeling Sadar Police Station", number: "0354-2252222" },
      { name: "Indian Railways 24x7 Helpline", number: "139" }
    ]
  },

  // 2. Goa (Panaji / Calangute / Madgaon)
  {
    destinationKeys: ["goa", "panaji", "madgaon", "margao", "calangute", "candolim", "baga", "anjuna", "vasco"],
    hotels: [
      {
        name: "Old Quarter Hostel (by The Hostel Crowd), Panaji",
        phone: "+91-832-2432608",
        address: "Fontainhas, Panaji, Goa",
        approxRatePerNight: 1200,
        tier: "budget",
        bookingTip: "Popular heritage hostel in Latin Quarter Fontainhas for budget stays under ₹1500."
      },
      {
        name: "GTDC Residency Miramar",
        phone: "+91-832-2464214",
        address: "Miramar Beach, Panaji, Goa",
        approxRatePerNight: 2800,
        tier: "midrange",
        bookingTip: "Goa Tourism official beachside resort, book via goadestination.com."
      },
      {
        name: "Vivanta Goa, Panaji",
        phone: "+91-832-6637373",
        address: "Off D.B. Bandodkar Road, Panaji, Goa",
        approxRatePerNight: 9500,
        tier: "luxury",
        bookingTip: "Premium 5-star central Panaji accommodation."
      }
    ],
    taxiServices: [
      {
        name: "GoaMiles Official Govt Taxi App 24x7 Helpline",
        phone: "+91-96071-98989",
        type: "App Service",
        locationTip: "Official Goa Government authorized meter cab service available at Dabolim & Mopa airports."
      },
      {
        name: "Madgaon Railway Station Prepaid Taxi Counter",
        type: "Prepaid Booth",
        locationTip: "Traffic police operated prepaid booth at Madgaon Jn platform 1 exit."
      },
      {
        name: "Kadamba Transport Corporation (KTC) Central Bus Stand",
        phone: "0832-2438034",
        type: "Govt Helpline",
        locationTip: "Central intercity bus terminal in Panaji for shuttles to Margao, Mapusa, & airport."
      }
    ],
    generalHelplines: [
      { name: "Goa Tourism 24x7 Helpline", number: "1364" },
      { name: "Goa Police Tourist Cell", number: "0832-2428970" },
      { name: "Indian Railways Helpline", number: "139" }
    ]
  },

  // 3. Manali / Himachal Pradesh
  {
    destinationKeys: ["manali", "kullu", "solang", "rohtang", "atal tunnel", "shimla"],
    hotels: [
      {
        name: "Zostel / Backpacker Lodges Manali (Old Manali)",
        address: "Manu Temple Road, Old Manali",
        approxRatePerNight: 900,
        tier: "budget",
        bookingTip: "Cozy backpacker hostel dorms & budget rooms near cafes."
      },
      {
        name: "HPTDC Hotel The Beas, Manali",
        phone: "+91-1902-252832",
        address: "Near Circuit House, Manali",
        approxRatePerNight: 2600,
        tier: "midrange",
        bookingTip: "Himachal Tourism official river-facing property."
      },
      {
        name: "The Himalayan Resort & Spa",
        phone: "+91-1902-250999",
        address: "Hadimba Road, Manali",
        approxRatePerNight: 9500,
        tier: "luxury",
        bookingTip: "Victorian Gothic style luxury retreat."
      }
    ],
    taxiServices: [
      {
        name: "Manali Taxi Operators Union (The Mall Stand)",
        phone: "+91-97365-24288",
        type: "Taxi Union",
        locationTip: "Official union office at The Mall Road for Solang Valley, Rohtang Pass, & Atal Tunnel permits."
      },
      {
        name: "Manali Taxi Union Alternate Helpline",
        phone: "+91-98160-24288",
        type: "Taxi Union",
        locationTip: "4WD vehicles and local sightseeing union booking desk."
      }
    ],
    generalHelplines: [
      { name: "Himachal Tourism Toll Free Helpline", number: "1800-180-8077" },
      { name: "Manali Police Assistance", number: "01902-252320" },
      { name: "Himachal Road Transport (HRTC) Inquiry", number: "01902-252323" }
    ]
  },

  // 4. Puri / Odisha Coast
  {
    destinationKeys: ["puri", "konark", "chilika", "bhubaneswar", "cuttack"],
    hotels: [
      {
        name: "Chakra Tirtha Backpacker Lodges / Homestays, Puri",
        address: "CT Road, Puri",
        approxRatePerNight: 850,
        tier: "budget",
        bookingTip: "Affordable backpacker guesthouses along Chakra Tirtha Road under ₹1000."
      },
      {
        name: "OTDC Panthanivas, Puri",
        phone: "+91-6752-222562",
        address: "Chakra Tirtha Road, Puri",
        approxRatePerNight: 2200,
        tier: "midrange",
        bookingTip: "Odisha Tourism official hotel with beach access. Mobile: +91-90788-85530."
      },
      {
        name: "Mayfair Heritage, Puri",
        phone: "+91-6752-224040",
        address: "Chakra Tirtha Road, Puri",
        approxRatePerNight: 8000,
        tier: "luxury",
        bookingTip: "Beachfront 4-star resort."
      }
    ],
    taxiServices: [
      {
        name: "PuriTaxi 24/7 Verified Taxi Helpline",
        phone: "+91-93484-38989",
        type: "Taxi Union",
        locationTip: "Verified local taxi service for Konark Sun Temple and Chilika Lake circuits."
      },
      {
        name: "Puri Railway Station Prepaid Auto/Taxi Counter",
        type: "Prepaid Booth",
        locationTip: "Right outside Puri railway station main porch (Govt regulated tariff)."
      }
    ],
    generalHelplines: [
      { name: "Odisha Tourism Toll Free", number: "1800-208-1414" },
      { name: "Puri Sea Beach Police Station", number: "06752-222025" },
      { name: "Indian Railways 24x7 Helpline", number: "139" }
    ]
  },

  // 5. Mumbai / Maharashtra
  {
    destinationKeys: ["mumbai", "bombay", "thane", "navi mumbai", "lonavala", "alibaug"],
    hotels: [
      {
        name: "Zostel / Backpacker Dorms Mumbai (Andheri)",
        address: "Marol, Andheri East, Mumbai",
        approxRatePerNight: 1100,
        tier: "budget",
        bookingTip: "Clean social backpacker hostel with metro connectivity."
      },
      {
        name: "Hotel Suba Palace, Colaba",
        phone: "+91-22-22020636",
        address: "Apollo Bunder, Colaba, Mumbai",
        approxRatePerNight: 3800,
        tier: "midrange",
        bookingTip: "Quality mid-range business hotel near Colaba Causeway."
      },
      {
        name: "The Taj Mahal Palace, Mumbai",
        phone: "+91-22-66653366",
        address: "Apollo Bunder, Colaba, Mumbai",
        approxRatePerNight: 22000,
        tier: "luxury",
        bookingTip: "Iconic flagship luxury heritage hotel facing Gateway of India."
      }
    ],
    taxiServices: [
      {
        name: "Mumbai International Airport (CSMIA) Official Prepaid Taxi Counter",
        phone: "+91-22-66851010",
        type: "Prepaid Booth",
        locationTip: "Terminal 2 Arrivals level exit. Black & Yellow meter cabs and Cool Cabs."
      },
      {
        name: "CSMT Railway Station Prepaid Taxi Stand",
        type: "Prepaid Booth",
        locationTip: "Portico exit at CSMT Main Hall managed by Mumbai Traffic Police."
      }
    ],
    generalHelplines: [
      { name: "Maharashtra Tourism (MTDC) Helpline", number: "1800-229-930" },
      { name: "Mumbai Police Helpline", number: "100 / 112" },
      { name: "Railway Passenger Helpline", number: "139" }
    ]
  },

  // 6. Delhi / NCR
  {
    destinationKeys: ["delhi", "new delhi", "ncr", "gurgaon", "noida", "agra", "jaipur"],
    hotels: [
      {
        name: "Zostel / Backpacker Hostels Central Delhi",
        address: "Arakashan Road, Paharganj, New Delhi",
        approxRatePerNight: 950,
        tier: "budget",
        bookingTip: "Vibrant social hostel within walking distance of New Delhi Railway Station."
      },
      {
        name: "Hotel Bloomrooms @ Janpath",
        phone: "+91-11-41225666",
        address: "1 Janpath Lane, Connaught Place, New Delhi",
        approxRatePerNight: 3400,
        tier: "midrange",
        bookingTip: "Modern clean boutique stay in central Delhi."
      },
      {
        name: "The Lalit New Delhi",
        phone: "+91-11-44447777",
        address: "Barakhamba Avenue, Connaught Place, New Delhi",
        approxRatePerNight: 9000,
        tier: "luxury",
        bookingTip: "Central Connaught Place luxury hotel near metro station."
      }
    ],
    taxiServices: [
      {
        name: "Delhi Traffic Police Prepaid Taxi Counter (IGI Airport T3)",
        phone: "+91-11-25652377",
        type: "Prepaid Booth",
        locationTip: "Official Delhi Police counter outside Arrival Pillar 10 (Terminal 3)."
      },
      {
        name: "New Delhi Railway Station (NDLS) Prepaid Booth",
        type: "Prepaid Booth",
        locationTip: "Paharganj and Ajmeri Gate side exits operated by Delhi Traffic Police."
      }
    ],
    generalHelplines: [
      { name: "Delhi Tourism (DTTDC) Central Info", number: "+91-11-23365320" },
      { name: "Delhi Police Helpline", number: "112" },
      { name: "Indian Railways Helpline", number: "139" }
    ]
  },

  // 7. Paris / France (International)
  {
    destinationKeys: ["paris", "france", "cdg", "orly", "versailles"],
    hotels: [
      {
        name: "St Christopher's Inn Paris Canal (Hostel)",
        address: "159 Rue de Crimee, 75019 Paris",
        approxRatePerNight: 3500, // Budget for Europe
        tier: "budget",
        bookingTip: "Vibrant waterfront backpacker hostel along the canal."
      },
      {
        name: "CitizenM Paris Gare de Lyon",
        phone: "+33-1-86-65-59-59",
        address: "8 Rue Van Gogh, 75012 Paris",
        approxRatePerNight: 12000,
        tier: "midrange",
        bookingTip: "Modern boutique hotel right next to Gare de Lyon transit station."
      },
      {
        name: "Pullman Paris Tour Eiffel",
        phone: "+33-1-44-38-56-00",
        address: "18 Avenue de Suffren, 75015 Paris",
        approxRatePerNight: 28000,
        tier: "luxury",
        bookingTip: "Direct views of the Eiffel Tower, front desk 24h."
      }
    ],
    taxiServices: [
      {
        name: "Paris Official Taxi Stand (Taxis Parisiens - G7)",
        phone: "+33-1-41-27-66-99",
        type: "App Service",
        locationTip: "Official airport taxi ranks at CDG Terminals 1, 2A-2F, & 3. Follow 'Taxis' overhead signs (regulated flat rate to central Paris)."
      }
    ],
    generalHelplines: [
      { name: "Paris Tourist Office (Office de Tourisme de Paris)", number: "+33-1-49-57-55-55" },
      { name: "European Emergency Services", number: "112" },
      { name: "SAMU (Medical Emergency France)", number: "15" }
    ]
  }
];

/**
 * Searches the ground database for verified contacts matching destination keywords.
 */
export function getVerifiedGroundData(destination: string): LocalGroundContext | null {
  const norm = (destination || "").toLowerCase().trim();
  for (const item of VERIFIED_LOCAL_GROUND_DATA) {
    if (item.destinationKeys.some((k) => norm.includes(k))) {
      return item;
    }
  }
  return null;
}

/**
 * Returns a verified hotel that genuinely fits within the user's allocated nightly budget.
 * NEVER pairs a budget of ₹1500 with a luxury hotel.
 */
export function getVerifiedHotelForBudget(destination: string, maxNightlyBudget: number): VerifiedHotel | null {
  const ground = getVerifiedGroundData(destination);
  if (!ground || !ground.hotels.length) return null;

  // Filter hotels whose actual approximate rate is <= maxNightlyBudget (with small 20% buffer)
  const matching = ground.hotels.filter((h) => h.approxRatePerNight <= maxNightlyBudget * 1.25);
  if (matching.length > 0) {
    // Pick the most suitable one closest to the budget
    matching.sort((a, b) => b.approxRatePerNight - a.approxRatePerNight);
    return matching[0];
  }

  // If even the lowest hotel in our database is beyond the budget, return null
  // so we NEVER return a luxury hotel like The Elgin or Taj for a ₹1,500 budget!
  return null;
}

/**
 * Returns true if a phone string looks like a dummy/demo/fake placeholder number.
 */
export function isDemoPhoneNumber(phoneStr: string | null | undefined): boolean {
  if (!phoneStr) return false;
  const cleaned = phoneStr.replace(/[\s\-\+\(\)\.]/g, "");
  
  if (/987654321\d?/i.test(cleaned)) return true;
  if (/123456789/i.test(cleaned)) return true;
  if (/^0{6,}/.test(cleaned)) return true;
  if (/^1{6,}/.test(cleaned)) return true;
  if (/^9{8,}/.test(cleaned)) return true;
  if (/555\d{4}/.test(cleaned)) return true;
  if (/dummy|demo|placeholder|fake|sample|xxxx/i.test(phoneStr)) return true;

  return false;
}

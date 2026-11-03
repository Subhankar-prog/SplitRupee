/**
 * Destination Ground Engine
 * Provides dynamic, place-specific permit breakdowns, optional activities, 
 * equipment packing checklists, and local travel advisories for ANY destination worldwide.
 */

export interface DestinationPermitInfo {
  permitName: string;
  permitTag: string;
  permitDescription: string;
  approxPerPersonPermitCost: number;
  activitiesName: string;
  activitiesTag: string;
  activitiesDescription: string;
  approxPerPersonActivityCost: number;
}

export interface PlaceItem {
  name: string;
  desc: string;
}

export interface PlaceSection {
  location: string;
  altitude?: string;
  tag: string;
  items: PlaceItem[];
}

/**
 * Returns dynamic destination-specific permits and sightseeing passes for any route worldwide.
 */
export function getDestinationPermitsAndActivities(destination: string = "", travellers: number = 8): DestinationPermitInfo {
  const dest = destination.toLowerCase().trim();

  // 1. Nepal Corridor
  if (/nepal|kathmandu|pokhara|mustang|muktinath|annapurna|ghandruk|chitwan|raxaul|birgunj/i.test(dest)) {
    return {
      permitName: "Permits & Passes (ACAP Ghandruk, Muktinath & Temple Entry)",
      permitTag: "Mandatory Mountain & Cultural Permits",
      permitDescription: `Mandatory conservation and local passes: 1) ACAP (Annapurna Conservation Area Permit) & TIMS Card for Ghandruk & Annapurna foothills (~₹1,250/person); 2) Muktinath & Lower Mustang Baragung Muktikshetra Local Municipality Entry & Environment Permit (~₹400/person); 3) Pashupatinath & Guhyeshwari Temple Tokens (~₹200/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 1850,
      activitiesName: "Sightseeing, Cable Car & Viewpoint Passes",
      activitiesTag: "Scenic & Cable Car Passes",
      activitiesDescription: "Manakamana Devi Temple mountain ropeway cable car round-trip, Phewa Lake wooden boat cruise with safety life jackets, Sarangkot sunrise viewpoint pass, Gupteshwar Mahadev Cave, Davis Fall & Gurung Cultural Museum entry passes.",
      approxPerPersonActivityCost: 850
    };
  }

  // 2. Ladakh & Zanskar
  if (/ladakh|leh|nubra|pangong|khardung|changla|zanskar|kargil|hunder|diskit|drass/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Ladakh ILP, Wildlife & Environment Fee)",
      permitTag: "Inner Line Permits & Ecology Passes",
      permitDescription: `Mandatory high-altitude border passes: 1) Ladakh Autonomous Hill Development Council (LAHDC) Inner Line Permit (ILP) for Nubra Valley & Pangong Tso (~₹450/person); 2) Environmental & Wildlife Protection Sanctuary Pass (~₹350/person); 3) Red Cross Society Humanitarian Fund contribution (~₹100/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 900,
      activitiesName: "Monastery, Camel Dunes & Heritage Passes",
      activitiesTag: "Iconic Passes & Viewpoints",
      activitiesDescription: "Diskit Monastery & Giant Buddha viewing gallery, Hunder double-humped Bactrian camel dunes pass, Hall of Fame War Memorial museum entry, Leh Palace & Magnetic Hill viewpoint access.",
      approxPerPersonActivityCost: 750
    };
  }

  // 3. Sikkim & Darjeeling
  if (/sikkim|gangtok|darjeeling|pelling|lachung|yumthang|nathula|tsomgo|kalimpong|ravangla/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Sikkim PAP, Nathu La & North Sikkim Permits)",
      permitTag: "Protected Area Permits (PAP)",
      permitDescription: `Mandatory restricted area passes: 1) Sikkim Protected Area Permit (PAP) for Tsomgo (Changu) Lake, Baba Mandir & Nathu La Pass (~₹650/person); 2) North Sikkim restricted forest entry for Lachung & Yumthang Valley (~₹450/person); 3) State tourism green cess (~₹100/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 1200,
      activitiesName: "Toy Train Joyride, Ropeway & Monasteries",
      activitiesTag: "Heritage & Cable Car Passes",
      activitiesDescription: "UNESCO Darjeeling Himalayan Railway (DHR) Steam/Diesel Joyride ticket, Darjeeling Rangeet Valley Passenger Ropeway cable car, Padmaja Naidu Himalayan Zoological Park & Rumtek Monastery entries.",
      approxPerPersonActivityCost: 1100
    };
  }

  // 4. Himachal Pradesh (Manali, Shimla, Spiti, Kasol, Dharamshala)
  if (/himachal|manali|solang|rohtang|atal\s+tunnel|spiti|kaza|shimla|kullu|kasol|dharamshala|mcleodganj/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Rohtang Pass NGT Green Permit & Valley Access)",
      permitTag: "NGT Eco-Permits & Local Passes",
      permitDescription: `Mandatory environmental and transit permissions: 1) National Green Tribunal (NGT) Rohtang Pass Special Vehicle Transit Permit & Green Tax (~₹550/vehicle, ~₹200/person); 2) Solang Valley adventure and eco-tourism development fees (~₹150/person); 3) Spiti Valley inner-circle checkpoint registration (~₹150/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 500,
      activitiesName: "Solang Ropeway, Hot Springs & Heritage Shrines",
      activitiesTag: "Adventure & Cultural Passes",
      activitiesDescription: "Solang Valley mountain ropeway cable car, Hadimba Devi Ancient Temple courtyard token, Vashisht thermal hot springs complex & Naggar Castle heritage entry passes.",
      approxPerPersonActivityCost: 800
    };
  }

  // 5. Kashmir Valley (Srinagar, Gulmarg, Pahalgam, Sonamarg)
  if (/kashmir|srinagar|gulmarg|pahalgam|sonamarg|doodhpathri|dal\s+lake|betaab/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Gulmarg Gondola & Tourist Valley Passes)",
      permitTag: "High-Altitude Cable Car & Valley Passes",
      permitDescription: `Mandatory high-altitude and valley passes: 1) Gulmarg Gondola Phase 1 (Kongdoori) & Phase 2 (Apharwat Peak) official high-altitude cable car tickets (~₹1,750/person); 2) Aru Valley & Betaab Valley tourist eco-permits (~₹250/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 2000,
      activitiesName: "Dal Lake Shikara Cruise & Mughal Gardens",
      activitiesTag: "Lake & Garden Passes",
      activitiesDescription: "Private Dal Lake wooden Shikara cruise to Char Chinar & Nehru Park with life jackets, Shalimar Bagh, Nishat Bagh & Cheshma Shahi Mughal Garden heritage admission tickets.",
      approxPerPersonActivityCost: 700
    };
  }

  // 6. Goa & Coastal Konkan
  if (/goa|panaji|calangute|candolim|baga|anjuna|vagator|colva|palolem|madgaon|margao/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Coastal Eco-Cess, Marine & Fort Passes)",
      permitTag: "Coastal & Heritage Passes",
      permitDescription: `Mandatory coastal safety and heritage conservation passes: 1) Goa Coastal Zone Eco-Tourism & Lifeguard Safety Fund contribution (~₹150/person); 2) Archeological Survey of India (ASI) Fort Aguada & Chapora Fort heritage entry tickets (~₹200/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 350,
      activitiesName: "Mandovi River Cruise, Dudhsagar Safari & Water Sports",
      activitiesTag: "Boat Cruise & Water Passes",
      activitiesDescription: "Mandovi River sunset cruise with live Goan folk dance & Portuguese music, Bhagwan Mahavir Wildlife Sanctuary entry & Dudhsagar 4WD jeep safari pass, certified water sports life-jacket equipment rental.",
      approxPerPersonActivityCost: 1250
    };
  }

  // 7. Kerala & Western Ghats
  if (/kerala|munnar|alleppey|alappuzha|kochi|cochin|thekkady|periyar|wayanad|varkala|kovalam/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Eravikulam National Park & Periyar Tiger Reserve)",
      permitTag: "Forest Eco-Permits & Wildlife Passes",
      permitDescription: `Mandatory wildlife and eco-preservation passes: 1) Eravikulam National Park (Nilgiri Tahr sanctuary) forest entry & shuttle pass (~₹300/person); 2) Periyar Tiger Reserve & Thekkady bamboo eco-trail pass (~₹200/person); 3) Mattupetty dam catchment permit (~₹50/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 550,
      activitiesName: "Alleppey Backwater Shikara, Tea Factory & Cultural Theater",
      activitiesTag: "Backwaters & Heritage Passes",
      activitiesDescription: "Private Alleppey backwater Shikara cruise through scenic village canals, Kanan Devan Tea Museum & processing factory pass, authentic Kathakali dance & Kalaripayattu martial arts theater passes.",
      approxPerPersonActivityCost: 950
    };
  }

  // 8. Rajasthan Heritage Circuit
  if (/rajasthan|jaipur|udaipur|jodhpur|jaisalmer|pushkar|mount\s+abu|bikaner|ajmer/i.test(dest)) {
    return {
      permitName: "Permits & Passes (ASI Composite Monument & Desert Eco-Pass)",
      permitTag: "Composite Heritage Passes",
      permitDescription: `Mandatory heritage conservation and royal palace passes: 1) Rajasthan Tourism / ASI Composite Monument Pass covering Amber Fort, Hawa Mahal, Jantar Mantar, Nahargarh & Albert Hall (~₹500/person); 2) Desert National Park Sam Sand Dunes eco-tax (~₹150/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 650,
      activitiesName: "Lake Pichola Sunset Boat, Mehrangarh & Desert Safari",
      activitiesTag: "Palace, Fort & Safari Passes",
      activitiesDescription: "Lake Pichola sunset boat ride to Jag Mandir Island, Mehrangarh Fort elevator & royal armory museum ticket, Thar Desert camel caravan safari and Rajasthani campfire folk music pass.",
      approxPerPersonActivityCost: 1100
    };
  }

  // 9. Uttarakhand (Rishikesh, Haridwar, Mussoorie, Nainital, Corbett)
  if (/uttarakhand|rishikesh|haridwar|mussoorie|nainital|dehradun|corbett|jim\s+corbett|kedarnath|badrinath/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Green Eco-Tax, Forest & Temple Passes)",
      permitTag: "Eco-Tax & Yatra Passes",
      permitDescription: `Mandatory mountain transit and conservation fees: 1) Uttarakhand Municipal Green Entry Tax & Himalayan eco-tourism cess (~₹200/person); 2) Jim Corbett National Park / Rajaji buffer zone day entry permits (~₹300/person); 3) Char Dham / Biometric Yatra e-registration token. Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 500,
      activitiesName: "Ganga Aarti Ghat Seating, Cable Car & Naini Lake Cruise",
      activitiesTag: "Ropeway & Lake Passes",
      activitiesDescription: "Rishikesh Triveni Ghat Maha Aarti special platform pass, Mussoorie Gun Hill ropeway cable car, Nainital Lake traditional yacht cruise, Neer Garh waterfall trek entry.",
      approxPerPersonActivityCost: 850
    };
  }

  // 10. Andaman & Nicobar Islands
  if (/andaman|nicobar|port\s+blair|havelock|swaraj|neil|shaheed|ross\s+island|baratang/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Marine National Park & Cellular Jail Pass)",
      permitTag: "Island Ecology & Heritage Passes",
      permitDescription: `Mandatory island eco-passes: 1) Mahatma Gandhi Marine National Park conservation eco-cess (~₹350/person); 2) Cellular Jail National Memorial pass (~₹100/person); 3) Forest transit permits for Baratang limestone caves (~₹200/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 650,
      activitiesName: "Glass-Bottom Coral Boat, Light & Sound Show & Snorkeling",
      activitiesTag: "Marine & Light Show Passes",
      activitiesDescription: "Cellular Jail historic Light & Sound show evening ticket, Elephant Beach glass-bottom boat coral viewing cruise with certified life jackets, Ross Island ferry tokens.",
      approxPerPersonActivityCost: 1350
    };
  }

  // 11. Northeast (Meghalaya, Shillong, Cherrapunji, Arunachal, Assam, Kaziranga)
  if (/meghalaya|shillong|cherrapunji|sohra|dawki|arunachal|tawang|kaziranga|guwahati|assam/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Inner Line Permit / ILP & Forest Eco-Cess)",
      permitTag: "Tribal & Protected Area Passes",
      permitDescription: `Mandatory restricted area and conservation passes: 1) State Inner Line Permit (ILP) / Tourism Registration for Arunachal/border zones (~₹450/person); 2) Kaziranga National Park jeep safari forest entry & camera tokens (~₹400/person); 3) Meghalaya Eco-Tourism village community permits (~₹200/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 1050,
      activitiesName: "Living Root Bridge Guide, Dawki River Boating & Waterfalls",
      activitiesTag: "Nature & River Passes",
      activitiesDescription: "Double Decker Living Root Bridge village indigenous guide pass, Umngot crystal river wooden boat cruise with life jackets, Nohkalikai Falls viewpoint & Mawsmai Cave exploration tokens.",
      approxPerPersonActivityCost: 850
    };
  }

  // 12. International Destinations (Thailand, Bali, Dubai, Europe, Vietnam, Singapore)
  if (/thailand|bangkok|phuket|krabi|bali|indonesia|dubai|uae|paris|france|rome|italy|switzerland|vietnam|singapore/i.test(dest)) {
    return {
      permitName: "Permits & Passes (Visa-on-Arrival / Tourism Tax & City Passes)",
      permitTag: "International Entry & City Taxes",
      permitDescription: `Mandatory immigration and tourist entry passes: 1) Tourist Visa-on-Arrival / Electronic Travel Authorization (ETA) & Tourism City Tax (~₹1,800/person); 2) National Marine Park / Heritage conservation tokens (~₹700/person). Full coverage for all ${travellers} travellers.`,
      approxPerPersonPermitCost: 2500,
      activitiesName: "Iconic Landmark Admissions, Island Ferries & Viewing Decks",
      activitiesTag: "World Landmark Passes",
      activitiesDescription: "Iconic observation deck & monument admission passes, speedboat island transit with safety life jackets, UNESCO cultural temple & museum audio-guided entries.",
      approxPerPersonActivityCost: 2200
    };
  }

  // 13. General Cultural / Domestic India Fallback
  return {
    permitName: `Permits & Passes (${destination || "Destination"} Heritage & Municipal Entry)`,
    permitTag: "Heritage & Municipal Entry Passes",
    permitDescription: `Mandatory state archeology, ASI monument entries, municipal green tax, and protected cultural zone tokens for all landmark visits in ${destination || "your destination"}. Full coverage for all ${travellers} travellers.`,
    approxPerPersonPermitCost: 400,
    activitiesName: "Sightseeing Passes, Monument Entries & Viewpoint Tokens",
    activitiesTag: "Local Sightseeing & Culture Passes",
    activitiesDescription: `Priority entry passes for prominent local landmarks, botanical gardens, heritage museums, cultural viewpoints, and evening fountain/light-and-sound shows in ${destination || "the region"}.`,
    approxPerPersonActivityCost: 750
  };
}

/**
 * Returns dynamic, authentic place-by-place equipment checklists or travel tips
 * tailored to the specific destination, terrain, altitude, and itinerary stops.
 */
export function getDynamicPlaceSections(
  type: "equipments" | "tips",
  result: any,
  formDestination: string = ""
): PlaceSection[] {
  const dest = (formDestination || result?.destination || "").toLowerCase();

  // 1. If AI generated structured placeGear or placeTips, use them immediately
  if (type === "equipments" && Array.isArray(result?.placeGear) && result.placeGear.length > 0) {
    return result.placeGear;
  }
  if (type === "tips" && Array.isArray(result?.placeTips) && result.placeTips.length > 0) {
    return result.placeTips;
  }

  // 2. Parse from result.equipments or result.tips if items are location-prefixed (e.g. "[Location]: Item - Reason")
  const rawList: string[] = type === "equipments" ? result?.equipments : result?.tips;
  if (Array.isArray(rawList) && rawList.length >= 3) {
    const groupedMap = new Map<string, PlaceItem[]>();
    let hasLocationPrefix = false;

    rawList.forEach((str) => {
      if (typeof str !== "string") return;
      // Match pattern like "[Location Name]: Item Name - Reason" or "Location Name: Item Name - Reason"
      const bracketMatch = str.match(/^\[([^\]]+)\]\s*:\s*(.+)$/);
      const colonMatch = !bracketMatch ? str.match(/^([A-Za-z0-9\s,&'-]{3,35}):\s*(.+)$/) : null;

      const loc = bracketMatch ? bracketMatch[1].trim() : colonMatch ? colonMatch[1].trim() : null;
      const body = bracketMatch ? bracketMatch[2].trim() : colonMatch ? colonMatch[2].trim() : null;

      if (loc && body) {
        hasLocationPrefix = true;
        // Split item name and description by '-' or '—'
        const parts = body.split(/\s+[-—]\s+/);
        const name = parts[0].trim();
        const desc = parts.slice(1).join(" — ").trim() || (type === "equipments" ? "Essential for this leg of the itinerary." : "Recommended guidance for your group.");

        if (!groupedMap.has(loc)) groupedMap.set(loc, []);
        groupedMap.get(loc)!.push({ name, desc });
      }
    });

    if (hasLocationPrefix && groupedMap.size >= 2) {
      const parsedSections: PlaceSection[] = [];
      groupedMap.forEach((items, location) => {
        const isAltitude = /(high|mountain|pass|peak|m|altitude)/i.test(location);
        parsedSections.push({
          location,
          tag: type === "equipments" ? "Location-Specific Gear" : "Local Field Advice",
          altitude: isAltitude ? "High Elevation" : "Scenic Transit",
          items
        });
      });
      return parsedSections;
    }
  }

  // 3. High-Quality Curated Presets for Recognized Destinations
  // A. NEPAL ROUTE
  if (/nepal|kathmandu|pokhara|mustang|muktinath|annapurna|ghandruk/i.test(dest)) {
    if (type === "equipments") {
      return [
        {
          location: "Muktinath Temple & 108 Sacred Spouts",
          altitude: "3,710 m",
          tag: "High-Altitude Sacred Shrine",
          items: [
            { name: "High-Altitude Thermal Innerwear (Top + Bottom)", desc: "Merino wool or synthetic thermal base layers for sub-freezing morning chills (0°C to 5°C)." },
            { name: "Quick-Dry Microfiber Towel & Dry Clothes Change", desc: "Essential immediately after taking the holy dip under the 108 icy waterspouts (Muktidhara) and two Kunda pools." },
            { name: "Down Jacket or Heavy Wind Shell", desc: "To put on immediately post-dip while offering prayers inside the inner sanctum to prevent hypothermia." },
            { name: "Warm Woollen Beanie & Fleece Gloves", desc: "Protects head and hands against biting trans-Himalayan crosswinds." },
            { name: "Diamox (Acetazolamide 250mg) & ORS Packets", desc: "Basic altitude acclimatization and hydration aid for ascending above 3,500m." }
          ]
        },
        {
          location: "Ghandruk Gurung Heritage Village",
          altitude: "1,940 m",
          tag: "Gurung Stone Steps & High Vistas",
          items: [
            { name: "Collapsible Trekking Poles (Pair)", desc: "Critical knee support for ascending and descending 2,000+ uneven stone steps in the Gurung village." },
            { name: "Insulated Thermos Flask (750ml–1L)", desc: "To carry hot boiled water in village homestays (tap water is freezing and untreated)." },
            { name: "High-Capacity Power Bank (20,000mAh)", desc: "Traditional homestays rely on shared solar/hydro power points with limited charging sockets." },
            { name: "Sturdy Grip Ankle-Support Walking Shoes", desc: "Prevents slips on steep wet flagstone village pathways." },
            { name: "Nepali Rupee (NPR) Physical Cash", desc: "Traditional village lodges, tea stalls, and the Gurung Museum do NOT have UPI or card POS machines." }
          ]
        },
        {
          location: "Marpha Apple Village & Kali Gandaki Valley",
          altitude: "2,670 m",
          tag: "Trans-Himalayan Riverbed Gorge",
          items: [
            { name: "Heavy Windproof Shell Jacket", desc: "Powerful Kali Gandaki valley gale-force crosswinds blow daily between 11:00 AM and 4:00 PM." },
            { name: "UV400 Polarized Sunglasses", desc: "Shields eyes from intense UV radiation reflecting off white limestone riverbeds." },
            { name: "Motion Sickness Tablets (Avomine / Ondansetron)", desc: "Essential for the rugged, unpaved off-road 4WD riverbed jeep track along Rupse Waterfall." },
            { name: "UV-Protection Lip Balm & Moisturizer", desc: "Dry mountain winds cause painful cracked lips and dry skin within hours." }
          ]
        },
        {
          location: "Pokhara Valley (Phewa Lake, Sarangkot & Caves)",
          altitude: "822 m",
          tag: "Lakeside, Caves & Viewpoints",
          items: [
            { name: "Waterproof Compact LED Headlamp or Mini Torch", desc: "Necessary for navigating inside the dark, damp limestone cavern of Gupteshwar Mahadev Cave." },
            { name: "Slip-Resistant Grip Footwear", desc: "Wet, slippery steps inside Gupteshwar Cave and mist-covered walkways at Davis Fall." },
            { name: "Lightweight Windbreaker Jacket", desc: "For breezy 5:00 AM Sarangkot viewpoint platform overlooking Annapurna range at dawn." },
            { name: "Waterproof Phone Pouch", desc: "Protects smartphones, wallets, and documents during Phewa Lake wooden boat cruising." }
          ]
        },
        {
          location: "Kathmandu Valley (Pashupatinath & Heritage Stupas)",
          altitude: "1,400 m",
          tag: "Sacred Shrines & Heritage Squares",
          items: [
            { name: "Modest Temple Attire", desc: "Shoulders, arms, and knees must be covered to enter Pashupatinath & Guhyeshwari Shaktipeeth." },
            { name: "Easy Slip-On Shoes", desc: "Shoes must be removed multiple times at temple gates and stupa circumambulation paths." },
            { name: "N95 Anti-Dust Face Mask", desc: "For Kathmandu ring-road traffic, highway dust, and crowded heritage bazaar lanes." },
            { name: "Cloth Cash/Coin Pouch", desc: "For temple dakshina, Bagmati Maha Aarti offerings, and butter lamp tokens." }
          ]
        },
        {
          location: "Border & Railway Transit (Bhubaneswar ⇄ Raxaul / Birgunj)",
          altitude: "Transit",
          tag: "Immigration & Overland Rail",
          items: [
            { name: "Original Physical Voter ID Card or Passport (Original + 3 Xerox Copies)", desc: "Mandatory for all travellers at Raxaul/Birgunj border immigration. (Aadhaar/PAN cards are strictly NOT accepted)." },
            { name: "4 Passport-Sized Photographs per Person", desc: "For acquiring local Nepal Ncell / Nepal Telecom (NTC) physical SIM cards at border checkpoints." },
            { name: "Indian ₹100 and ₹200 Denomination Cash Banknotes", desc: "Universally accepted across Nepal. (Indian ₹500 notes are strictly prohibited and illegal)." },
            { name: "Lightweight Travel Fleece Blanket & Neck Pillow", desc: "For comfortable overnight sleep on the long overnight rail journeys." }
          ]
        }
      ];
    } else {
      return [
        {
          location: "Muktinath Temple Dip & Mountain Protocol",
          altitude: "3,710 m",
          tag: "Sacred High-Altitude Rituals",
          items: [
            { name: "108 Spouts Bath Timing", desc: "Take your holy bath between 7:30 AM and 10:30 AM when morning sun rays warm the stone courtyard and reduce thermal shock." },
            { name: "Altitude Pacing & Steady Breathing", desc: "Do not rush up the temple stairs at 3,710m altitude; take slow, steady, measured breaths to prevent dizziness or lightheadedness." },
            { name: "Post-Bath Internal Warmth", desc: "Drink hot ginger-lemon-honey tea or local garlic soup at the teahouse immediately after bathing to restore core body warmth." }
          ]
        },
        {
          location: "Ghandruk Gurung Homestay Etiquette",
          altitude: "1,940 m",
          tag: "Traditional Village Living",
          items: [
            { name: "Homestay Meal Protocol", desc: "Traditional Gurung homestays prepare fresh organic meals (local red rice, gundruk soup, farm greens); place dinner orders by 6:00 PM as village kitchens close early." },
            { name: "Balcony Sunrise View", desc: "Wake up at 5:45 AM for the majestic golden sunrise hitting the snow peak of Machhapuchhre (Fishtail) and Annapurna South directly from your homestay balcony." },
            { name: "Night Navigation", desc: "Village stone paths have zero street lights; keep a pocket torch or headlamp handy after dusk." }
          ]
        },
        {
          location: "Marpha & Kali Gandaki Off-Road Pacing",
          altitude: "2,670 m",
          tag: "Riverbed Valley Transitions",
          items: [
            { name: "Early Valley Transit Departure", desc: "Travel between Pokhara and Jomsom/Marpha early in the morning (start by 6:00 AM) to cross river sections before midday crosswinds peak at noon." },
            { name: "Local Apple Delicacies", desc: "Marpha is Nepal's apple capital; visit traditional village bakeries for freshly baked warm apple crumble pie, dried apple crisps, and local cider." }
          ]
        },
        {
          location: "Pokhara Lakeside & Sacred Caves",
          altitude: "822 m",
          tag: "Dawn Viewpoints & Cave Safety",
          items: [
            { name: "Sarangkot Sunrise Departure", desc: "Depart Lakeside Pokhara by 5:00 AM sharp for Sarangkot to beat tourist vehicle queues and secure the best platform view for sunrise." },
            { name: "Cave Wet Stone Footing", desc: "Keep one hand firmly on the metal railing inside Gupteshwar Cave; natural subterranean water droplets make limestone steps very slick." }
          ]
        },
        {
          location: "Kathmandu Temple Sanctuary Regulations",
          altitude: "1,400 m",
          tag: "Heritage Dress Codes & Ethics",
          items: [
            { name: "Pashupatinath Sanctum Access", desc: "At Pashupatinath Temple, only Hindus may enter the main sanctum courtyard; all visitors can view the divine Bagmati Maha Aarti from the eastern riverbank." },
            { name: "Leather Article Deposit", desc: "Leather articles (belts, wallets, bags) must be deposited in the cloakroom outside Pashupatinath inner courtyard." },
            { name: "Clockwise Circumambulation", desc: "Always circumambulate Boudhanath Stupa in a clockwise direction (pradakshina) and spin prayer wheels in a clockwise direction only." }
          ]
        },
        {
          location: "Nepal Border Formalities at Raxaul / Birgunj",
          altitude: "Transit",
          tag: "Immigration, SIM & Currency",
          items: [
            { name: "Border Documentation", desc: "Clear both Indian customs at Raxaul and Nepal immigration at Birgunj with your original Voter ID / Passport before boarding your private cab." },
            { name: "Local SIM Connectivity", desc: "Pick up an Ncell or Nepal Telecom tourist SIM card right at the border or Thamel for ₹250 with a 20GB data pack for group coordination." },
            { name: "Currency Exchange Rules", desc: "Exchange Indian ₹100/₹200 notes at standard 1:1.60 fixed rate (₹100 INR = 160 NPR). Strictly do not carry Indian ₹500 notes into Nepal." }
          ]
        }
      ];
    }
  }

  // B. LADAKH & LEH ROUTE
  if (/ladakh|leh|nubra|pangong|khardung|zanskar/i.test(dest)) {
    if (type === "equipments") {
      return [
        {
          location: "Pangong Tso & Chang La Pass",
          altitude: "4,350 m",
          tag: "Sub-Zero High-Altitude Lake",
          items: [
            { name: "Heavy Down Puffer Jacket (-10°C rated)", desc: "Pangong lake night temperatures drop below freezing even in peak summer months." },
            { name: "Thermal Woollen Base Layers (Top & Bottom)", desc: "Retains vital core temperature during lakefront walks and starlight observation." },
            { name: "UV400 Category 4 Glacier Sunglasses", desc: "Intense ultraviolet reflection from high-altitude blue lake waters and salt shores causes eye strain without dark polarized lenses." },
            { name: "Insulated Heavy Winter Gloves & Balaclava", desc: "Protects fingers and face from biting gale-force crosswinds along the lakeshore." }
          ]
        },
        {
          location: "Khardung La Summit (5,359 m)",
          altitude: "5,359 m",
          tag: "World's Highest Motorables",
          items: [
            { name: "Portable Oxygen Canister (Oxy99 / 6L)", desc: "Essential instant relief in case a group member experiences acute altitude breathlessness at the 17,500ft pass summit." },
            { name: "Diamox (Acetazolamide 250mg) Tablets", desc: "Start 24 hours prior to ascending high passes as guided by your medical practitioner." },
            { name: "High-Calorie Glucose Bars & Nuts", desc: "Quick-release carbohydrates maintain stamina and keep oxygen metabolism active." }
          ]
        },
        {
          location: "Nubra Valley (Hunder & Diskit Dunes)",
          altitude: "3,048 m",
          tag: "High-Altitude Cold Desert",
          items: [
            { name: "Dust-Proof Shemagh / Cotton Scarf", desc: "Protects face, nose, and mouth from blowing white sand during the afternoon Hunder camel dunes walk." },
            { name: "High-SPF 50+ Sunscreen & Hydrating Lip Balm", desc: "Thin atmosphere at 10,000ft causes severe sunburn and cracked lips within 30 minutes of exposure." },
            { name: "BSNL / Jio Postpaid SIM Cards", desc: "Prepaid SIM cards from other Indian states strictly do NOT work in Jammu & Kashmir and Ladakh. Only postpaid or local Ladakh SIMs function." }
          ]
        },
        {
          location: "Leh Old Town, Shanti Stupa & Hall of Fame",
          altitude: "3,500 m",
          tag: "Acclimatization Base",
          items: [
            { name: "Comfortable Breathable Walking Shoes", desc: "For climbing the steps to Shanti Stupa, Leh Palace, and walking along the bazaar cobbled streets." },
            { name: "20,000mAh Rugged Power Bank", desc: "Cold temperatures drain smartphone and camera batteries 2x faster than normal." },
            { name: "Electrolyte ORS Sachets (Hydration Pouch)", desc: "Drink minimum 3.5 to 4 liters of water daily to accelerate physiological acclimatization." }
          ]
        }
      ];
    } else {
      return [
        {
          location: "Leh Mandatory Acclimatization Protocol",
          altitude: "3,500 m",
          tag: "Crucial High-Altitude Safety",
          items: [
            { name: "Mandatory 48-Hour Rest", desc: "Spend the entire first 48 hours resting completely in Leh. Do not visit high passes or exert physically on Day 1 or Day 2." },
            { name: "Hydration Without Alcohol", desc: "Drink 4 liters of water/soup daily. Avoid alcohol, smoking, and sleeping pills which depress respiration at high altitude." },
            { name: "Oximeter Group Check", desc: "Monitor group blood oxygen (SpO2) morning and evening. Normal acclimatized SpO2 at Leh is 80–90%." }
          ]
        },
        {
          location: "Khardung La & Chang La Pass Protocol",
          altitude: "5,359 m",
          tag: "High Pass Safety",
          items: [
            { name: "15-Minute Summit Rule", desc: "Never halt at Khardung La or Chang La top for more than 15 to 20 minutes to prevent acute mountain sickness (AMS) triggered by thin air." },
            { name: "Pacing Steps", desc: "Walk slowly; avoid running or jumping for celebratory photos at pass summits." }
          ]
        },
        {
          location: "Nubra Valley & Diskit Cultural Ethics",
          altitude: "3,048 m",
          tag: "Monastery Etiquette",
          items: [
            { name: "Monastery Sanctum Silence", desc: "Remove footwear and silence phones inside Diskit and Thiksey monastery prayer halls. Do not photograph meditating monks without permission." },
            { name: "Physical Cash Only", desc: "Nubra and Pangong camp regions have zero internet and no working ATMs. Withdraw sufficient physical cash in Leh town." }
          ]
        }
      ];
    }
  }

  // C. GOA & COASTAL DESTINATIONS
  if (/goa|panaji|calangute|candolim|baga|anjuna|palolem|gokarna/i.test(dest)) {
    if (type === "equipments") {
      return [
        {
          location: "North Goa Beaches & Water Sports (Baga, Calangute, Anjuna)",
          altitude: "Sea Level",
          tag: "Surf, Sand & Adventure",
          items: [
            { name: "Waterproof IPX8 Phone Pouch with Lanyard", desc: "Protects phone from saltwater splashes and sand during parasailing, jet skiing, and beach wading." },
            { name: "Reef-Safe High-SPF 50+ Sunscreen", desc: "Prevents severe coastal sunburn during midday water sports and open sun exposure." },
            { name: "Quick-Dry Swimwear & UV Rash Guard", desc: "Comfortable synthetic rash guards prevent chafing against water sports life vests and boards." },
            { name: "Polarized UV400 Sunglasses & Sun Hat", desc: "Essential for glare reduction over water and midday coastal walks." }
          ]
        },
        {
          location: "Dudhsagar Waterfalls & Western Ghats",
          altitude: "310 m",
          tag: "Cascading Waterfall & Forest Jeep Safari",
          items: [
            { name: "Sturdy Grip Water Shoes / Sandals", desc: "Slippery wet granite boulders and riverbed crossings at the base pool require high-friction rubber soles." },
            { name: "Dry Bag (15L–20L)", desc: "Keeps electronics, dry towels, and spare clothes 100% dry from heavy waterfall mist and spray." },
            { name: "Cash for Mandatory Forest Life Jacket", desc: "Renting the mandatory safety life jacket at Kolem forest entry costs ₹100 cash per person." }
          ]
        },
        {
          location: "Old Goa UNESCO Basilicas & Panaji Latin Quarter (Fontainhas)",
          altitude: "Sea Level",
          tag: "Heritage Architecture & Historic Squares",
          items: [
            { name: "Modest Church Attire", desc: "Shoulders and knees must be respectfully covered to enter the Basilica of Bom Jesus and Se Cathedral." },
            { name: "Cushioned Walking Shoes / Loafers", desc: "For exploring the heritage cobbled alleys of Fontainhas and church stone compounds." },
            { name: "Mosquito Repellent Lotion (DEET 20%)", desc: "Protects against coastal evening mosquitoes at outdoor riverside cafes and heritage garden compounds." }
          ]
        }
      ];
    } else {
      return [
        {
          location: "Goa Beach Safety & Swim Advisories",
          altitude: "Sea Level",
          tag: "Ocean & Lifeguard Safety",
          items: [
            { name: "Swim Only Between Red-and-Yellow Flags", desc: "Follow Drishti Marine lifeguard zones. Never swim where a red flag is planted due to dangerous rip currents." },
            { name: "Strict Zero Night Swimming", desc: "Never enter the sea after dark, especially after consuming alcohol. High tides and underwater undertows are hazardous." }
          ]
        },
        {
          location: "Scooter / Rental Car Road Discipline",
          altitude: "Transit",
          tag: "Local Transport Guidelines",
          items: [
            { name: "Mandatory Helmets & Digital Documents", desc: "Traffic police actively check both rider and pillion helmets. Carry valid driving licenses via DigiLocker." },
            { name: "Regulated GoaMiles & Prepaid Booths", desc: "Use the official GoaMiles app or airport/railway prepaid taxi counters to avoid unmetered private taxi overcharges." }
          ]
        },
        {
          location: "Fontainhas Latin Quarter Photography Etiquette",
          altitude: "Sea Level",
          tag: "Heritage Living Ethics",
          items: [
            { name: "Respect Residential Privacy", desc: "Fontainhas is an active heritage residential neighborhood. Do not sit on private verandah steps or photograph through open home windows." }
          ]
        }
      ];
    }
  }

  // D. KASHMIR VALLEY
  if (/kashmir|srinagar|gulmarg|pahalgam|sonamarg/i.test(dest)) {
    if (type === "equipments") {
      return [
        {
          location: "Gulmarg Gondola & Apharwat Peak",
          altitude: "3,950 m",
          tag: "Snow Peak & High Cable Car",
          items: [
            { name: "Heavy Down Jacket & Windproof Trousers", desc: "Apharwat Phase 2 summit remains freezing year-round with sub-zero winds." },
            { name: "Waterproof High-Traction Snow Boots", desc: "Rental rubber boots or high-traction waterproof boots prevent soaking in wet snow and glacier slush." },
            { name: "UV400 Snow Goggles / Dark Polarized Glasses", desc: "Prevents snow blindness from intense solar reflection off the Apharwat snowfields." }
          ]
        },
        {
          location: "Dal Lake Houseboats & Shikara Cruise",
          altitude: "1,585 m",
          tag: "Living Water Heritage",
          items: [
            { name: "Light Fleece / Pashmina Shawl", desc: "Lake temperatures drop rapidly in the evening during open Shikara rides." },
            { name: "Waterproof Phone Lanyard", desc: "Secures devices when photographing the floating lotus markets and Shikara vendors." },
            { name: "Physical Cash for Shikara Crafts", desc: "Floating flower and saffron vendors accept UPI, but lake mobile network can be intermittent." }
          ]
        },
        {
          location: "Pahalgam & Betaab / Aru Valley",
          altitude: "2,130 m",
          tag: "Pine Forests & Mountain Rivers",
          items: [
            { name: "Trekking Shoes with Ankle Support", desc: "For riverbank trails along the Lidder River and alpine meadow walks." },
            { name: "Rain Poncho / Compact Umbrella", desc: "Unpredictable afternoon mountain showers are frequent in the Lidder valley." }
          ]
        }
      ];
    } else {
      return [
        {
          location: "Gulmarg Gondola Booking Hack",
          altitude: "3,950 m",
          tag: "Advance Booking Rule",
          items: [
            { name: "Book Phase 2 Tickets Weeks in Advance", desc: "Gulmarg Gondola tickets sell out weeks prior online via JK Cable Car portal. Never rely on on-spot counter tickets." },
            { name: "Acclimatize Before Apharwat", desc: "Spend 20 minutes at Phase 1 Kongdoori before boarding Phase 2 to allow your breathing to adjust." }
          ]
        },
        {
          location: "Pahalgam Local Pony Union Pacing",
          altitude: "2,130 m",
          tag: "Transit & Local Rates",
          items: [
            { name: "Fix Government Rates at Tourism Booth", desc: "Check the official district administration signboard at Pahalgam taxi/pony stand before hiring to ensure standard pricing." }
          ]
        }
      ];
    }
  }

  // 4. UNIVERSAL DYNAMIC GENERATOR FOR ANY DESTINATION IN THE WORLD
  // Extracts unique route stops from result.days or provides a contextual 4-part breakdown
  const stops: string[] = [];
  if (Array.isArray(result?.days)) {
    result.days.forEach((d: any) => {
      const stay = (d.stay || "").replace(/Stay|Hotel|Central|Homestay|Resort/gi, "").trim();
      if (stay && !stops.includes(stay) && !/overnight|home/i.test(stay)) {
        stops.push(stay);
      }
      if (Array.isArray(d.legs)) {
        d.legs.forEach((l: any) => {
          const to = (l.to || "").replace(/Terminal|Junction|Airport|Station/gi, "").trim();
          if (to && !stops.includes(to) && !/hotel|home/i.test(to) && stops.length < 5) {
            stops.push(to);
          }
        });
      }
    });
  }

  const primaryDestName = formDestination || result?.destination || "Your Destination";
  const isHilly = /hill|mountain|peak|valley|himalay|altitude|pass|shimla|ooty|munnar|kodaikanal/i.test(dest);
  const isBeach = /beach|sea|coast|island|ocean|port|lake|water/i.test(dest);
  const isHeritage = /temple|fort|palace|heritage|historic|ancient|monument/i.test(dest);

  if (type === "equipments") {
    return [
      {
        location: `${primaryDestName} Primary Exploration & Central Circuit`,
        altitude: isHilly ? "Elevated Terrain" : isBeach ? "Coastal" : "Urban / Heritage",
        tag: "Core Destination Gear",
        items: [
          { name: "Comfortable Breathable Walking Footwear", desc: "High-traction cushioned footwear suitable for full-day sightseeing, uneven flagstones, and landmark walking." },
          { name: "High-Capacity 20,000mAh Power Bank", desc: "Keeps smartphones, offline navigation maps, camera, and payment apps charged throughout full outdoor excursion days." },
          { name: isHilly ? "Layered Thermal Windbreaker Jacket" : isBeach ? "UV400 Polarized Sunglasses & High-SPF Sunscreen" : "Lightweight Breathable Cotton / Linen Attire", desc: isHilly ? "Protects against sudden temperature drops and chilly morning/evening mountain breezes." : isBeach ? "Shields eyes and skin from harsh midday coastal sun reflection." : "Comfortable all-day wear for city sightseeing and walking tours." },
          { name: "Compact Refillable Water Flask & ORS Salts", desc: "Ensures continuous hydration during transit without accumulating single-use plastic waste." }
        ]
      },
      {
        location: `${stops[1] || primaryDestName} Outdoor Landmarks & Sightseeing`,
        altitude: "Sightseeing Circuit",
        tag: "Activity & Monument Essentials",
        items: [
          { name: isHeritage ? "Modest Cultural Shrines Attire (Shoulders & Knees Covered)" : "Compact Foldable Rain Poncho / Umbrella", desc: isHeritage ? "Required for respect and entry approval inside ancient sanctuaries, temples, and heritage monuments." : "Shields group members and camera bags from sudden unexpected localized showers." },
          { name: "Water-Resistant Compact Daypack (15L–20L)", desc: "Carries documents, medication, light snacks, and water bottles while keeping hands free during excursions." },
          { name: "Personal First-Aid & Blister Kit", desc: "Antiseptic wipes, Band-Aids for walking blisters, pain-relief spray, and personal prescription medicines." }
        ]
      },
      {
        location: `Round-Trip Transit & Gateway Stations (${result?.origin || "Origin"} ⇄ ${primaryDestName})`,
        altitude: "Transit Circuit",
        tag: "Immigration, Rail & Road Transit",
        items: [
          { name: "Original Government Photo ID Proofs + Digital Backups", desc: "Mandatory for railway boarding, airport security check, hotel check-in, and local checkpoint clearances." },
          { name: "Physical Cash Currency in Small Denominations", desc: "Essential for rural tea stalls, highway toll booths, station porters, and local street vendors with weak network." },
          { name: "Inflatable Neck Pillow & Compact Travel Blanket", desc: "Ensures ergonomic spinal support and restful sleep during long intercity train, bus, or cab journeys." }
        ]
      }
    ];
  } else {
    return [
      {
        location: `${primaryDestName} Local Exploration & Cultural Etiquette`,
        altitude: isHilly ? "Mountain Protocol" : isBeach ? "Coastal Protocol" : "City & Heritage Protocol",
        tag: "Sightseeing & Etiquette Tips",
        items: [
          { name: "Peak Queue Management & Early Starts", desc: "Visit iconic monuments, viewpoints, and major shrines between 7:30 AM and 9:30 AM to beat tour-bus crowds and heat." },
          { name: isHeritage ? "Sacred Shrines Respect & Footwear Deposit" : isBeach ? "Strict Water Safety & Flag Advisories" : "Authentic Regional Culinary Specialties", desc: isHeritage ? "Deposit footwear at official cloakrooms; follow circumambulation directions and respect photography restrictions." : isBeach ? "Never enter the water beyond designated lifeguard safety flags or after sunset." : "Try signature local eateries recommended by residents rather than tourist-trap highway restaurants." }
        ]
      },
      {
        location: `Transit & Regulated Local Transportation`,
        altitude: "Transit Advice",
        tag: "Transit Pacing & Fares",
        items: [
          { name: "Pre-Paid Booths & Regulated Fares", desc: "Always utilize official prepaid taxi booths at railway stations and airports or app-based services to ensure transparent rates." },
          { name: "Allow 45-Minute Buffer Before Departures", desc: "Factor in city traffic congestion and station security lines when scheduling return hotel check-out and station arrivals." }
        ]
      },
      {
        location: `Group Health, Hydration & Cash Planning`,
        altitude: "General Safety",
        tag: "Group Coordination",
        items: [
          { name: "Offline Digital Maps & Group Meeting Pin", desc: "Download Google Maps of the destination offline in advance. Agree on a clear physical landmark meeting spot in crowded markets." },
          { name: "Split Cash Reserves", desc: "Distribute group petty cash among multiple travellers rather than leaving all funds with one person." }
        ]
      }
    ];
  }
}

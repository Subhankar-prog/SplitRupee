/** Verified Indian Railways IRCTC Train Route Database for Grounded Itinerary Generation */

export interface VerifiedTrainRoute {
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  operatingDays: string;
  availableClasses: string[];
  approxFarePerPerson: Record<string, number>;
  tip: string;
}

export interface RouteMapping {
  originKeys: string[];
  destinationKeys: string[];
  directTrains: VerifiedTrainRoute[];
  connectingRoutes?: {
    hubName: string;
    leg1: VerifiedTrainRoute[];
    leg2: VerifiedTrainRoute[];
  }[];
}

export const VERIFIED_IRCTC_ROUTES: RouteMapping[] = [
  // 1. Bhubaneswar (BBS) to New Jalpaiguri (NJP) / Sikkim Corridor
  {
    originKeys: ["bhubaneswar", "bbs", "puri", "cuttack"],
    destinationKeys: ["sikkim", "gangtok", "njp", "new jalpaiguri", "siliguri", "darjeeling", "kalimpong", "pelling"],
    directTrains: [
      {
        trainNumber: "15643",
        trainName: "Puri - Kamakhya Weekly Express",
        from: "Bhubaneswar (BBS)",
        to: "New Jalpaiguri (NJP)",
        departure: "11:30 PM (Day 1)",
        arrival: "07:30 PM (Day 2)",
        operatingDays: "Saturdays",
        availableClasses: ["2S", "SL", "3A", "2A"],
        approxFarePerPerson: { "2S": 260, SL: 440, "3A": 1180, "2A": 1690 },
        tip: "Overnight journey via Malda Town. Pre-book 2A/3A for maximum comfort."
      },
      {
        trainNumber: "12513",
        trainName: "Secunderabad - Guwahati SF Express",
        from: "Bhubaneswar (BBS)",
        to: "New Jalpaiguri (NJP)",
        departure: "07:30 PM (Day 1)",
        arrival: "02:15 PM (Day 2)",
        operatingDays: "Saturdays",
        availableClasses: ["SL", "3A", "2A"],
        approxFarePerPerson: { SL: 470, "3A": 1240, "2A": 1780 },
        tip: "Superfast express via Kharagpur & Rampurhat."
      },
      {
        trainNumber: "12509",
        trainName: "Bengaluru - Guwahati SF Express",
        from: "Bhubaneswar (BBS)",
        to: "New Jalpaiguri (NJP)",
        departure: "02:00 AM (Day 1)",
        arrival: "09:50 PM (Day 1)",
        operatingDays: "Wed, Thu, Fri",
        availableClasses: ["SL", "3A", "2A"],
        approxFarePerPerson: { SL: 470, "3A": 1240, "2A": 1780 },
        tip: "Day express running through North Bengal."
      },
      {
        trainNumber: "22503",
        trainName: "Kanyakumari - Dibrugarh Vivek SF Express",
        from: "Bhubaneswar (BBS)",
        to: "New Jalpaiguri (NJP)",
        departure: "05:35 PM (Day 1)",
        arrival: "11:20 AM (Day 2)",
        operatingDays: "Mon, Tue, Wed, Thu, Sat",
        availableClasses: ["SL", "3A", "2A"],
        approxFarePerPerson: { SL: 480, "3A": 1260, "2A": 1810 },
        tip: "Popular long-distance Superfast train."
      }
    ],
    connectingRoutes: [
      {
        hubName: "Howrah Junction (HWH)",
        leg1: [
          {
            trainNumber: "12074",
            trainName: "Bhubaneswar - Howrah Jan Shatabdi Express",
            from: "Bhubaneswar (BBS)",
            to: "Howrah Junction (HWH)",
            departure: "06:00 AM",
            arrival: "12:40 PM",
            operatingDays: "Daily except Sun",
            availableClasses: ["2S", "CC"],
            approxFarePerPerson: { "2S": 220, CC: 745 },
            tip: "Target 2S or CC seats for fast day travel to Kolkata."
          },
          {
            trainNumber: "22896",
            trainName: "Howrah Vande Bharat Express",
            from: "Puri / Bhubaneswar (BBS)",
            to: "Howrah Junction (HWH)",
            departure: "05:45 AM",
            arrival: "12:15 PM",
            operatingDays: "Daily except Thu",
            availableClasses: ["CC", "EC"],
            approxFarePerPerson: { CC: 1265, EC: 2420 },
            tip: "Premium high-speed chair car option."
          }
        ],
        leg2: [
          {
            trainNumber: "12041",
            trainName: "Howrah - New Jalpaiguri Shatabdi Express",
            from: "Howrah Junction (HWH)",
            to: "New Jalpaiguri (NJP)",
            departure: "02:15 PM",
            arrival: "10:30 PM",
            operatingDays: "Daily except Sun",
            availableClasses: ["CC", "EC"],
            approxFarePerPerson: { CC: 1160, EC: 2100 },
            tip: "Seamless same-day connection from Howrah."
          },
          {
            trainNumber: "12377",
            trainName: "Padatik Express",
            from: "Sealdah (SDAH / Kolkata)",
            to: "New Jalpaiguri (NJP)",
            departure: "11:20 PM",
            arrival: "09:15 AM (Next Day)",
            operatingDays: "Daily",
            availableClasses: ["SL", "3A", "2A", "1A"],
            approxFarePerPerson: { SL: 360, "3A": 960, "2A": 1370 },
            tip: "Overnight superfast express to North Bengal."
          },
          {
            trainNumber: "22301",
            trainName: "Howrah - NJP Vande Bharat Express",
            from: "Howrah Junction (HWH)",
            to: "New Jalpaiguri (NJP)",
            departure: "05:55 AM",
            arrival: "01:25 PM",
            operatingDays: "Daily except Wed",
            availableClasses: ["CC", "EC"],
            approxFarePerPerson: { CC: 1565, EC: 2825 },
            tip: "Morning high-speed service to NJP."
          }
        ]
      }
    ]
  },

  // 2. Bhubaneswar (BBS) to Raxaul / Nepal Border Corridor
  {
    originKeys: ["bhubaneswar", "bbs", "cuttack", "puri"],
    destinationKeys: ["nepal", "raxaul", "rxl", "birgunj", "kathmandu", "pokhara", "gandrukh", "mustang"],
    directTrains: [],
    connectingRoutes: [
      {
        hubName: "Howrah Junction (HWH)",
        leg1: [
          {
            trainNumber: "12074",
            trainName: "Bhubaneswar - Howrah Jan Shatabdi Express",
            from: "Bhubaneswar (BBS)",
            to: "Howrah Junction (HWH)",
            departure: "06:00 AM",
            arrival: "12:40 PM",
            operatingDays: "Daily except Sun",
            availableClasses: ["2S", "CC"],
            approxFarePerPerson: { "2S": 220, CC: 745 },
            tip: "Quick morning seating train to Kolkata."
          },
          {
            trainNumber: "12838",
            trainName: "Puri - Howrah SF Express",
            from: "Bhubaneswar (BBS)",
            to: "Howrah Junction (HWH)",
            departure: "09:30 PM",
            arrival: "04:45 AM (Next Day)",
            operatingDays: "Daily",
            availableClasses: ["SL", "3A", "2A", "1A"],
            approxFarePerPerson: { SL: 295, "3A": 780, "2A": 1100 },
            tip: "Overnight journey to Howrah."
          }
        ],
        leg2: [
          {
            trainNumber: "13021",
            trainName: "Mithila Express",
            from: "Howrah Junction (HWH)",
            to: "Raxaul Junction (RXL)",
            departure: "03:50 PM",
            arrival: "08:30 AM (Next Day)",
            operatingDays: "Daily",
            availableClasses: ["SL", "3A", "2A"],
            approxFarePerPerson: { SL: 380, "3A": 1020, "2A": 1450 },
            tip: "Direct train to Nepal Border (Raxaul/Birgunj)."
          },
          {
            trainNumber: "15271",
            trainName: "Howrah - Raxaul Weekly Express",
            from: "Howrah Junction (HWH)",
            to: "Raxaul Junction (RXL)",
            departure: "04:30 PM",
            arrival: "08:50 AM (Next Day)",
            operatingDays: "Wednesdays",
            availableClasses: ["SL", "3A", "2A"],
            approxFarePerPerson: { SL: 380, "3A": 1020, "2A": 1450 },
            tip: "Weekly alternative to Raxaul."
          }
        ]
      }
    ]
  },

  // 3. Bhubaneswar (BBS) to New Delhi (NDLS) / North India
  {
    originKeys: ["bhubaneswar", "bbs", "cuttack"],
    destinationKeys: ["delhi", "ndls", "new delhi", "agra", "jaipur"],
    directTrains: [
      {
        trainNumber: "22811",
        trainName: "Bhubaneswar - New Delhi Rajdhani Express",
        from: "Bhubaneswar (BBS)",
        to: "New Delhi (NDLS)",
        departure: "10:35 AM",
        arrival: "09:55 AM (Next Day)",
        operatingDays: "Wed, Sun",
        availableClasses: ["3A", "2A", "1A"],
        approxFarePerPerson: { "3A": 2890, "2A": 4050, "1A": 5080 },
        tip: "Premium Rajdhani service with catering."
      },
      {
        trainNumber: "12801",
        trainName: "Purushottam Express",
        from: "Bhubaneswar (BBS)",
        to: "New Delhi (NDLS)",
        departure: "11:00 PM",
        arrival: "04:00 AM (Day 3)",
        operatingDays: "Daily",
        availableClasses: ["SL", "3A", "2A", "1A"],
        approxFarePerPerson: { SL: 680, "3A": 1790, "2A": 2580 },
        tip: "Reliable daily express to Delhi."
      }
    ]
  }
];

/** Lookup function to get verified trains for any origin-destination pair */
export function getVerifiedTrainsForRoute(origin: string, destination: string): VerifiedTrainRoute[] {
  const oClean = origin.toLowerCase().trim();
  const dClean = destination.toLowerCase().trim();

  for (const route of VERIFIED_IRCTC_ROUTES) {
    const matchOrigin = route.originKeys.some((k) => oClean.includes(k) || k.includes(oClean));
    const matchDest = route.destinationKeys.some((k) => dClean.includes(k) || k.includes(dClean));

    if (matchOrigin && matchDest) {
      if (route.directTrains.length > 0) {
        return route.directTrains;
      }
      if (route.connectingRoutes && route.connectingRoutes.length > 0) {
        const conn = route.connectingRoutes[0];
        return [conn.leg1[0], conn.leg2[0]];
      }
    }
  }

  return [];
}

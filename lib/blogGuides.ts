export interface BlogGuideSection {
  heading: string;
  body: string[];
  bullets?: string[];
}

export interface BlogGuide {
  slug: string;
  title: string;
  desc: string;
  category: string;
  readTime: string;
  date: string;
  iconName: "plane" | "home" | "upi";
  intro: string;
  sections: BlogGuideSection[];
  relatedTool: {
    label: string;
    href: string;
    description: string;
  };
}

export const BLOG_GUIDES: BlogGuide[] = [
  {
    slug: "how-to-split-goa-trip-expenses",
    title: "How to Split Goa Trip Expenses Fairly with 8 Friends",
    desc: "From beach shacks to self-drive Thar rentals and villa bookings, here is how to manage group expenses with zero awkwardness.",
    category: "Travel & Trips",
    readTime: "4 min read",
    date: "Oct 2026",
    iconName: "plane",
    intro:
      "Multi-day group trips break spreadsheets quickly because different friends pay for villas, car rentals, fuel, and restaurant rounds. Keeping one shared ledger avoids post-trip confusion and reduces how many transfers everyone has to make at the end.",
    sections: [
      {
        heading: "1. Set up one shared group before the first booking",
        body: [
          "Create a dedicated Trip group and invite everyone via the shareable join link or QR code. If one or two friends have not signed up yet, record their name or mobile number as a placeholder member so upfront deposits are logged immediately.",
          "When they join later with the same phone number or Google account, SplitRupee links their historical splits automatically.",
        ],
      },
      {
        heading: "2. Use the right split mode for each expense",
        body: [
          "Not every bill on a trip belongs equally to all eight people. SplitRupee records each bill in exact paise across three modes:",
        ],
        bullets: [
          "Equal splits for shared accommodation, tolls, parking, and group activities.",
          "Exact rupee amounts when non-drinkers skip bar tabs or one room costs more than another.",
          "Percentage splits when two families or couples share a larger booking proportionally.",
        ],
      },
      {
        heading: "3. Settle the simplified net transfers, not individual bills",
        body: [
          "Across a four-day itinerary with 25 bills, paying back every friend one purchase at a time could require dozens of transfers. SplitRupee simplifies the group graph into minimal transfers so most people make only one or two UPI payments total.",
        ],
      },
    ],
    relatedTool: {
      label: "Open Bill & Tip Split Calculator",
      href: "/calculator",
      description: "Test quick equal or itemized splits with GST and tip before starting a group.",
    },
  },
  {
    slug: "flatmate-rent-and-groceries-guide",
    title: "The Ultimate Flatmate Budgeting Guide: Rent, Wi-Fi & Maid",
    desc: "Stop chasing roommates every month. Learn how clear shared records and debt simplification keep your flat finances organized.",
    category: "Flatmates",
    readTime: "5 min read",
    date: "Oct 2026",
    iconName: "home",
    intro:
      "Shared flats run smoothly when recurring household expenses (rent, domestic help, internet, water cans, and groceries) sit in one transparent ledger instead of buried WhatsApp chats.",
    sections: [
      {
        heading: "1. Separate fixed household bills from ad-hoc groceries",
        body: [
          "Fixed costs like rent, Wi-Fi, and maid salaries repeat on predictable dates, whereas kitchen groceries and utility top-ups happen ad hoc throughout the month.",
          "On Pro accounts, weekly or monthly recurring rules inside a group can post fixed bills automatically on their scheduled day. On Free accounts, logging them takes a few seconds inside the Home group ledger.",
        ],
      },
      {
        heading: "2. Adjust unequal room rents with Exact Splits",
        body: [
          "In a 3BHK flat where the master bedroom has an attached washroom, splitting rent 33.3% each creates resentment. Record the monthly rent using Exact rupee splits (or percentages) once, while keeping shared utilities like electricity and Wi-Fi split equally.",
        ],
      },
      {
        heading: "3. Reconcile balances at month-end with CSV or PDF statements",
        body: [
          "Before transferring final dues on the 1st of the month, export the Group Statement in CSV or printable PDF format so every roommate can review total paid, fair share, and net remaining balance.",
        ],
      },
    ],
    relatedTool: {
      label: "View Recurring & Pro Tools",
      href: "/pro",
      description: "See which monthly household automation tools are part of SplitRupee Pro.",
    },
  },
  {
    slug: "upi-deep-linking-explained",
    title: "Behind the Scenes: How 1-Tap UPI Settlements Work in SplitRupee",
    desc: "How standard NPCI UPI intent URIs, dynamic QR codes, and non-custodial links prevent manual VPA typos.",
    category: "Engineering & Tech",
    readTime: "6 min read",
    date: "Sep 2026",
    iconName: "upi",
    intro:
      "Copying a 25-character UPI ID, switching apps, and re-typing an amount leaves room for avoidable mistakes. SplitRupee uses standard UPI payment links so your existing UPI app receives the payee address and exact rupee amount automatically.",
    sections: [
      {
        heading: "1. Standard NPCI upi://pay intent structure",
        body: [
          "When you tap Settle Up inside a group or friend balance, SplitRupee formats a standard UPI intent string containing the receiver's Virtual Payment Address (pa), display name (pn), rounded settlement amount (am), currency (cu=INR), and a short transaction note (tn).",
          "Tapping Pay via UPI App hands that link directly to Google Pay, PhonePe, Paytm, BHIM, or another installed UPI handler on your phone.",
        ],
      },
      {
        heading: "2. Dynamic QR fallback on desktop and offline screens",
        body: [
          "If you are viewing balances on a laptop browser, SplitRupee renders a scannable QR code encoding that exact same upi://pay URI so you can scan from your phone camera. If the QR image fails to load offline, the raw UPI VPA, copy button, and direct link remain available.",
        ],
      },
      {
        heading: "3. Non-custodial by design",
        body: [
          "SplitRupee never holds wallet balances, touches bank credentials, or processes money on its servers. Your transfer happens directly between bank accounts over NPCI's UPI rails, and you confirm the recorded payment back in your group ledger.",
        ],
      },
    ],
    relatedTool: {
      label: "Read Security & UPI FAQ",
      href: "/faq",
      description: "Answers on non-custodial settlements, password limits, and offline sync.",
    },
  },
];

export function getBlogGuideBySlug(slug: string): BlogGuide | null {
  return BLOG_GUIDES.find((guide) => guide.slug === slug) ?? null;
}


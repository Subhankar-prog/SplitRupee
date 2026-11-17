"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";

export default function RootLandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 print:hidden">
      <SplitRupeeLoader variant="page" text="SplitRupee" subtext="Opening dashboard..." />
    </div>
  );
}

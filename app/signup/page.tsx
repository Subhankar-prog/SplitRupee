"use client";

import React, { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import ReferenceAuthCard from "@/components/auth/ReferenceAuthCard";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";

export default function SignupPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <SplitRupeeLoader
            variant="page"
            text="SplitRupee"
            subtext="Preparing your account setup..."
          />
        }
      >
        <ReferenceAuthCard initialMode="signup" />
      </Suspense>
    </AuthLayout>
  );
}

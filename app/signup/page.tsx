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
            fullScreen={false}
            text="SplitRupee"
            subtext="Preparing account creation..."
          />
        }
      >
        <ReferenceAuthCard initialMode="signup" />
      </Suspense>
    </AuthLayout>
  );
}

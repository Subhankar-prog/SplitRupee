"use client";

import React, { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import ReferenceAuthCard from "@/components/auth/ReferenceAuthCard";
import SplitRupeeLoader from "@/components/SplitRupeeLoader";

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <SplitRupeeLoader
            fullScreen={false}
            text="SplitRupee"
            subtext="Preparing secure sign in..."
          />
        }
      >
        <ReferenceAuthCard initialMode="login" />
      </Suspense>
    </AuthLayout>
  );
}

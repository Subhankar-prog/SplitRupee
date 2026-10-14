"use client";

import React, { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import ReferenceAuthCard from "@/components/auth/ReferenceAuthCard";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        }
      >
        <ReferenceAuthCard initialMode="login" />
      </Suspense>
    </AuthLayout>
  );
}

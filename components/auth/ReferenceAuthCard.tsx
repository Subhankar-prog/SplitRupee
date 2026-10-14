"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/userContext";
import GoogleAuthModal from "@/components/GoogleAuthModal";
import {
  User,
  Lock,
  Mail,
  Phone,
  QrCode,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Split,
  Scale,
  Users,
  GitFork,
  Smartphone,
} from "lucide-react";

interface ReferenceAuthCardProps {
  initialMode?: "login" | "signup";
}

export default function ReferenceAuthCard({ initialMode = "login" }: ReferenceAuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const { login, refreshUsers } = useUser();

  // Mode & Animation Tracking
  const [isToggled, setIsToggled] = useState(initialMode === "signup");
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Sync mode with props if changed externally
  useEffect(() => {
    setIsToggled(initialMode === "signup");
  }, [initialMode]);

  function handleToggle(targetMode: "login" | "signup") {
    setHasAnimated(true);
    const toggled = targetMode === "signup";
    setIsToggled(toggled);
    setLoginError("");
    setSignupError("");
    if (!toggled) {
      setIsGoogleOnboarding(false);
    }
    window.history.replaceState(null, "", toggled ? "/signup" : "/login");
  }

  // --- LOGIN STATE ---
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setLoginError("Please enter your Email or Mobile Number.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your password.");
      return;
    }

    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Login failed. Check your credentials.");
      }

      login(data.user);
      await refreshUsers();
      router.push(redirectUrl);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
    } finally {
      setLoginLoading(false);
    }
  }

  // --- GOOGLE ONBOARDING STATE ---
  const [isGoogleOnboarding, setIsGoogleOnboarding] = useState(false);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState("");

  function handleCancelGoogleOnboarding() {
    setIsGoogleOnboarding(false);
    setGoogleAvatarUrl("");
    setSignupName("");
    setSignupIdentifier("");
    setSignupUpiId("");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setSignupError("");
  }

  // --- SIGNUP STATE ---
  const [signupName, setSignupName] = useState("");
  const [signupIdentifier, setSignupIdentifier] = useState("");
  const [signupUpiId, setSignupUpiId] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  async function handleGoogleAuthSuccess(data: any) {
    if (!data.isNewUser && data.user) {
      // Returning user -> Direct 1-Click Login!
      login(data.user);
      await refreshUsers();
      router.push(redirectUrl);
    } else if (data.isNewUser && data.googleProfile) {
      // First-time Google user -> Slide to Signup view with prefilled Name & Email, NO password
      setIsGoogleOnboarding(true);
      setGoogleAvatarUrl(data.googleProfile.avatarUrl || "");
      setSignupName(data.googleProfile.name || "");
      setSignupIdentifier(data.googleProfile.email || "");
      setSignupUpiId("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setSignupError("");
      setLoginError("");
      handleToggle("signup");
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!signupName.trim()) {
      setSignupError("Please enter your full name.");
      return;
    }

    const trimmedId = signupIdentifier.trim();
    if (!trimmedId) {
      setSignupError("Please enter your email or mobile number.");
      return;
    }

    // --- GOOGLE ONBOARDING SUBMISSION ---
    if (isGoogleOnboarding) {
      setSignupError("");
      setSignupLoading(true);

      const payload = {
        name: signupName.trim(),
        email: trimmedId.toLowerCase(),
        authMethod: "google",
        avatarColor: "#10b981",
        upiId: signupUpiId.trim() || undefined,
      };

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Registration failed. Check your details.");
        }

        login(data.user);
        await refreshUsers();
        router.push(redirectUrl);
      } catch (err: any) {
        setSignupError(err.message || "Failed to create account with Google");
      } finally {
        setSignupLoading(false);
      }
      return;
    }

    // --- STANDARD REGISTRATION ---
    const isEmail = trimmedId.includes("@");
    const cleanPhone = trimmedId.replace(/\D/g, "").slice(-10);

    if (!isEmail && cleanPhone.length !== 10) {
      setSignupError("Please enter a valid email address or 10-digit mobile number.");
      return;
    }

    if (!signupPassword || signupPassword.length < 4) {
      setSignupError("Password must be at least 4 characters long.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }

    setSignupError("");
    setSignupLoading(true);

    const payload: any = {
      name: signupName.trim(),
      password: signupPassword.trim(),
      authMethod: isEmail ? "email" : "phone",
      avatarColor: "#10b981",
      upiId: signupUpiId.trim() || undefined,
    };

    if (isEmail) {
      payload.email = trimmedId.toLowerCase();
    } else {
      payload.phone = cleanPhone;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Registration failed. Check your details.");
      }

      login(data.user);
      await refreshUsers();
      router.push(redirectUrl);
    } catch (err: any) {
      setSignupError(err.message || "Failed to create account");
    } finally {
      setSignupLoading(false);
    }
  }

  // --- REAL GOOGLE OAUTH 2.0 HANDLER ---
  function handleGoogleSignIn() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // 1. If Client ID is provided and Google SDK is loaded, launch the real Google OAuth Account Chooser popup
    if (clientId && typeof window !== "undefined" && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setLoginError("Google sign-in was cancelled or failed");
              return;
            }
            if (tokenResponse.access_token) {
              setLoginLoading(true);
              setSignupLoading(true);
              try {
                const res = await fetch("/api/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ accessToken: tokenResponse.access_token }),
                });
                const data = await res.json();
                if (!res.ok || !data.ok) {
                  throw new Error(data.error || "Failed to authenticate with Google");
                }
                await handleGoogleAuthSuccess(data);
              } catch (err: any) {
                setLoginError(err.message || "Failed to sign in with Google");
                setSignupError(err.message || "Failed to sign in with Google");
              } finally {
                setLoginLoading(false);
                setSignupLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err) {
        console.error("Error initiating Google OAuth:", err);
      }
    }

    // 2. Fallback to interactive modal (allows testing with demo accounts or notifies user to set Client ID)
    setShowGoogleModal(true);
  }

  return (
    <div className="ref-auth-container">
      <div
        className={`auth-wrapper ${isToggled ? "toggled" : ""} ${hasAnimated ? "has-animated" : ""
          }`}
      >
        {/* Animated 3D Skewed Diagonal Background Shapes */}
        <div className="background-shape" />
        <div className="secondary-shape" />

        {/* =========================================================================
            1. SIGN IN CREDENTIALS PANEL (Left side on desktop when untoggled)
           ========================================================================= */}
        <div className="credentials-panel signin">
          {/* Brand Icon & Heading */}
          <div className="slide-element flex flex-col items-center mb-3 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-bold text-slate-950 text-base shadow-md shadow-emerald-500/25 mb-1.5">
              ₹
            </div>
            <h2>Sign In</h2>
            <p className="text-[12px] text-slate-300 mt-1 max-w-[260px] mx-auto">
              Sign in to access your groups and balances
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="slide-element mb-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-center text-[11px] text-rose-300"
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            {/* Field: Email or Mobile */}
            <div className="field-wrapper slide-element !mt-1">
              <input
                id="login-id"
                type="text"
                placeholder=" "
                required={!isToggled}
                tabIndex={isToggled ? -1 : 0}
                data-has-value={Boolean(loginIdentifier)}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                autoComplete="username"
              />
              <label htmlFor="login-id">Email or Mobile Number</label>
              <div className="field-icon">
                <User className="h-4 w-4" />
              </div>
            </div>

            {/* Field: Password */}
            <div className="field-wrapper slide-element">
              <input
                id="login-pass"
                type={showLoginPassword ? "text" : "password"}
                placeholder=" "
                required={!isToggled}
                tabIndex={isToggled ? -1 : 0}
                data-has-value={Boolean(loginPassword)}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
              />
              <label htmlFor="login-pass">Password</label>
              <button
                type="button"
                onClick={() => setShowLoginPassword((p) => !p)}
                className="eye-toggle"
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
              >
                {showLoginPassword ? (
                  <EyeOff className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="slide-element flex justify-end pt-2 pb-2">
              <Link
                href="/forgot-password"
                className="text-[11.5px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Primary Submit Button */}
            <div className="slide-element pt-1">
              <button
                type="submit"
                disabled={loginLoading}
                className="submit-button"
              >
                {loginLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                <span>Sign In to Account</span>
              </button>
            </div>

            {/* Divider */}
            <div className="slide-element flex items-center gap-2 pt-3 pb-1.5">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">
                OR CONTINUE WITH EMAIL OR MOBILE
              </span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* 1-Click Google OAuth Button */}
            <div className="slide-element">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] text-[12px] font-semibold text-white hover:bg-white/[0.08] hover:border-emerald-500/40 transition shadow-sm"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Switch to Signup */}
            <div className="switch-link slide-element">
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleToggle("signup")}
                  className="register-trigger"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* =========================================================================
            2. SIGN IN WELCOME SECTION (Right side on desktop when untoggled)
           ========================================================================= */}
        <div className="welcome-section signin">
          <div className="slide-element text-right max-w-[285px]">
            <h2>WELCOME BACK!</h2>
            <p>
              Track shared expenses, simplify group debts, and settle balances with ease.
            </p>
          </div>

          <div className="slide-element mt-6 space-y-3.5 max-w-[250px] ml-auto">
            <div className="flex items-center justify-end gap-2.5 text-xs font-semibold text-slate-100">
              <span>Smart expense splitting</span>
              <Split className="h-4 w-4 text-emerald-400 shrink-0" />
            </div>
            <div className="flex items-center justify-end gap-2.5 text-xs font-semibold text-slate-100">
              <span>Clear group balances</span>
              <Scale className="h-4 w-4 text-emerald-400 shrink-0" />
            </div>
            <div className="flex items-center justify-end gap-2.5 text-xs font-semibold text-slate-100">
              <span>Quick UPI settlement links</span>
              <QrCode className="h-4 w-4 text-emerald-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. SIGN UP CREDENTIALS PANEL (Right side on desktop when toggled)
           ========================================================================= */}
        <div className="credentials-panel signup">
          {/* Brand Icon & Heading */}
          <div className="slide-element flex flex-col items-center mb-2 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-bold text-slate-950 text-base shadow-md shadow-emerald-500/25 mb-1.5">
              {isGoogleOnboarding ? (
                <CheckCircle2 className="h-5 w-5 text-slate-950" />
              ) : (
                "₹"
              )}
            </div>
            <h2>{isGoogleOnboarding ? "Complete Profile" : "Create Account"}</h2>
            <p className="text-[12px] text-slate-300 mt-1 max-w-[280px]">
              {isGoogleOnboarding
                ? "Confirm your name and set your UPI ID for instant expense settlements"
                : "Create your account to start managing shared expenses"}
            </p>
          </div>

          {/* Google Verified Banner during First-Time Onboarding */}
          {isGoogleOnboarding && (
            <div className="slide-element mb-2 flex items-center justify-between rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-300">
              <div className="flex items-center gap-1.5 truncate">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span className="font-semibold text-white">Google Verified:</span>
                <span className="text-emerald-200 truncate">{signupIdentifier}</span>
              </div>
              <button
                type="button"
                onClick={handleCancelGoogleOnboarding}
                className="text-[10px] text-slate-400 hover:text-emerald-300 underline ml-2 shrink-0 transition"
                title="Cancel Google sign-in and switch to standard mode"
              >
                Change
              </button>
            </div>
          )}

          {signupError && (
            <div
              role="alert"
              className="slide-element mb-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-center text-[11px] text-rose-300"
            >
              {signupError}
            </div>
          )}

          <form onSubmit={handleSignupSubmit}>
            {/* Field: Full Name (EDITABLE) */}
            <div className="field-wrapper slide-element !mt-0.5">
              <input
                id="signup-name"
                type="text"
                placeholder=" "
                required={isToggled}
                tabIndex={isToggled ? 0 : -1}
                data-has-value={Boolean(signupName)}
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                autoComplete="name"
              />
              <label htmlFor="signup-name">Full Name</label>
              <div className="field-icon">
                <User className="h-4 w-4" />
              </div>
            </div>

            {/* Field: Email or Mobile (READ ONLY when isGoogleOnboarding) */}
            <div className="field-wrapper slide-element">
              <input
                id="signup-id"
                type={isGoogleOnboarding ? "email" : "text"}
                placeholder=" "
                required={isToggled}
                tabIndex={isToggled ? 0 : -1}
                data-has-value={Boolean(signupIdentifier)}
                value={signupIdentifier}
                readOnly={isGoogleOnboarding}
                onChange={(e) => {
                  if (!isGoogleOnboarding) setSignupIdentifier(e.target.value);
                }}
                autoComplete="username"
                className={isGoogleOnboarding ? "cursor-not-allowed text-emerald-200" : ""}
                title={isGoogleOnboarding ? "Email verified by Google (cannot be changed)" : undefined}
              />
              <label htmlFor="signup-id">
                {isGoogleOnboarding ? "Google Email (Verified)" : "Email or Mobile Number"}
              </label>
              <div className="field-icon">
                {isGoogleOnboarding ? (
                  <Lock className="h-4 w-4 text-emerald-400/80" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
              </div>
            </div>

            {/* Field: UPI ID / VPA (EDITABLE) */}
            <div className="field-wrapper slide-element">
              <input
                id="signup-upi"
                type="text"
                placeholder=" "
                tabIndex={isToggled ? 0 : -1}
                data-has-value={Boolean(signupUpiId)}
                value={signupUpiId}
                onChange={(e) => setSignupUpiId(e.target.value)}
              />
              <label htmlFor="signup-upi">
                {isGoogleOnboarding ? "UPI ID for Settlements (e.g. name@okhdfcbank)" : "UPI ID / VPA (Optional)"}
              </label>
              <div className="field-icon">
                <QrCode className="h-4 w-4" />
              </div>
            </div>

            {/* Passwords in 2-Column Grid (Only shown for standard credentials signup, hidden for Google OAuth) */}
            {!isGoogleOnboarding && (
              <div className="slide-element grid grid-cols-2 gap-3 !mt-5">
                <div className="field-wrapper !mt-0">
                  <input
                    id="signup-pass"
                    type={showSignupPassword ? "text" : "password"}
                    placeholder=" "
                    required={isToggled && !isGoogleOnboarding}
                    tabIndex={isToggled && !isGoogleOnboarding ? 0 : -1}
                    data-has-value={Boolean(signupPassword)}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <label htmlFor="signup-pass">Password</label>
                  <button
                    type="button"
                    tabIndex={isToggled ? 0 : -1}
                    onClick={() => setShowSignupPassword((p) => !p)}
                    className="eye-toggle"
                    aria-label={showSignupPassword ? "Hide password" : "Show password"}
                  >
                    {showSignupPassword ? (
                      <EyeOff className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="field-wrapper !mt-0">
                  <input
                    id="signup-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder=" "
                    required={isToggled && !isGoogleOnboarding}
                    tabIndex={isToggled && !isGoogleOnboarding ? 0 : -1}
                    data-has-value={Boolean(signupConfirmPassword)}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <label htmlFor="signup-confirm">Confirm Password</label>
                  <button
                    type="button"
                    tabIndex={isToggled ? 0 : -1}
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="eye-toggle"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Primary Submit Button */}
            <div className={`slide-element ${isGoogleOnboarding ? "!mt-6" : "pt-3"}`}>
              <button
                type="submit"
                disabled={signupLoading}
                className="submit-button"
              >
                {signupLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isGoogleOnboarding ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                <span>
                  {isGoogleOnboarding ? "Complete Google Sign Up" : "Create Free Account"}
                </span>
              </button>
            </div>

            {/* Divider and Google Button (Hidden during Google Onboarding) */}
            {!isGoogleOnboarding && (
              <>
                <div className="slide-element flex items-center gap-2 pt-2.5 pb-1">
                  <div className="flex-1 border-t border-white/10" />
                  <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">
                    OR
                  </span>
                  <div className="flex-1 border-t border-white/10" />
                </div>

                <div className="slide-element">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] text-[12px] font-semibold text-white hover:bg-white/[0.08] hover:border-emerald-500/40 transition shadow-sm"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              </>
            )}

            {/* Switch to Login / Switch to Standard */}
            <div className="switch-link slide-element">
              {isGoogleOnboarding ? (
                <p>
                  Prefer password signup?{" "}
                  <button
                    type="button"
                    onClick={handleCancelGoogleOnboarding}
                    className="register-trigger"
                  >
                    Standard Form
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleToggle("login")}
                    className="login-trigger"
                  >
                    Log In
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* =========================================================================
            4. SIGN UP WELCOME SECTION (Left side on desktop when toggled)
           ========================================================================= */}
        <div className="welcome-section signup">
          <div className="slide-element text-left max-w-[235px]">
            <h2>{isGoogleOnboarding ? "ALMOST READY!" : "WELCOME!"}</h2>
            <p>
              {isGoogleOnboarding
                ? "Confirm your details to finish setting up your account."
                : "Organize shared expenses and keep group balances clear."}
            </p>
          </div>

          <div className="slide-element mt-6 space-y-3.5 max-w-[235px]">
            <div className="flex items-center justify-start gap-2.5 text-xs font-semibold text-slate-100">
              <Users className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Split expenses with your group</span>
            </div>
            <div className="flex items-center justify-start gap-2.5 text-xs font-semibold text-slate-100">
              <GitFork className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Track who owes whom</span>
            </div>
            <div className="flex items-center justify-start gap-2.5 text-xs font-semibold text-slate-100">
              <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Direct UPI settlement links</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Auth Modal */}
      {showGoogleModal && (
        <GoogleAuthModal
          onClose={() => setShowGoogleModal(false)}
          onSuccess={(data) => handleGoogleAuthSuccess(data)}
        />
      )}
    </div>
  );
}

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { MemberDTO } from "./types";

interface UserContextType {
  currentUser: MemberDTO | null;
  users: MemberDTO[];
  setCurrentUser: (user: MemberDTO | null) => void;
  login: (user: MemberDTO) => void;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<MemberDTO[]>([]);

  const [currentUser, setCurrentUser] = useState<MemberDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUsers = useCallback(async () => {
    try {
      const savedUserStr =
        typeof window !== "undefined"
          ? localStorage.getItem("splitrupee_session_user")
          : null;

      let parsedUser: any = null;
      if (savedUserStr) {
        try {
          parsedUser = JSON.parse(savedUserStr);
        } catch {}
      }

      // Immediately hydrate active user after mount before network round-trip
      if (parsedUser) {
        setCurrentUser((prev) => prev || parsedUser);
        setIsLoading(false);
      }

      const queryUrl = parsedUser?.id
        ? `/api/users?userId=${encodeURIComponent(parsedUser.id)}`
        : "/api/users";
      const res = await fetch(queryUrl);
      const json = await res.json();
      if (json.ok && Array.isArray(json.users)) {
        setUsers(json.users);

        if (parsedUser?.id) {
          const freshUser = json.users.find((u: MemberDTO) => u.id === parsedUser.id);
          const activeUser = freshUser || parsedUser;

          // Safe one-time background migration for existing active sessions:
          // If the user's database record has no avatar yet, but their active session
          // has a stored Google picture, sync it safely without requiring logout or re-auth.
          if (
            freshUser &&
            !freshUser.avatarUrl &&
            !freshUser.customAvatarUrl &&
            parsedUser.avatarUrl
          ) {
            fetch("/api/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: freshUser.id,
                syncGoogleAvatar: parsedUser.avatarUrl,
              }),
            })
              .then((r) => r.json())
              .then((data) => {
                if (data.ok && data.user) {
                  setCurrentUser(data.user);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("splitrupee_session_user", JSON.stringify(data.user));
                  }
                }
              })
              .catch(() => {});
          }

          setCurrentUser((prev) => {
            if (
              prev &&
              prev.id === activeUser.id &&
              prev.name === activeUser.name &&
              prev.email === activeUser.email &&
              prev.phone === activeUser.phone &&
              prev.upiId === activeUser.upiId &&
              prev.isPro === activeUser.isPro &&
              prev.avatarColor === activeUser.avatarColor &&
              prev.avatarUrl === activeUser.avatarUrl &&
              prev.customAvatarUrl === activeUser.customAvatarUrl &&
              prev.googleAvatarUrl === activeUser.googleAvatarUrl
            ) {
              return prev;
            }
            return activeUser;
          });
          if (typeof window !== "undefined") {
            localStorage.setItem("splitrupee_session_user", JSON.stringify(activeUser));
            document.cookie = `splitrupee_session=${encodeURIComponent(JSON.stringify(activeUser))}; max-age=315360000; path=/; SameSite=Lax`;
          }
        }
      }
    } catch (e) {
      console.warn("User refresh notice (session maintained from local storage):", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const login = useCallback((user: MemberDTO) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("splitrupee_session_user", JSON.stringify(user));
      document.cookie = `splitrupee_session=${encodeURIComponent(JSON.stringify(user))}; max-age=315360000; path=/; SameSite=Lax`;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("splitrupee_session_user");
      document.cookie = "splitrupee_session=; max-age=0; path=/; SameSite=Lax";
      window.location.replace("/login");
    }
  }, []);

  const handleSetCurrentUser = useCallback((user: MemberDTO | null) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("splitrupee_session_user", JSON.stringify(user));
        document.cookie = `splitrupee_session=${encodeURIComponent(JSON.stringify(user))}; max-age=315360000; path=/; SameSite=Lax`;
      } else {
        localStorage.removeItem("splitrupee_session_user");
        document.cookie = "splitrupee_session=; max-age=0; path=/; SameSite=Lax";
      }
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser: handleSetCurrentUser,
        login,
        logout,
        refreshUsers,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

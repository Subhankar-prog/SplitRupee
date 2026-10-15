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

  // Synchronously initialize currentUser from persistent storage (zero logout flicker)
  const [currentUser, setCurrentUser] = useState<MemberDTO | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("splitrupee_session_user");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("splitrupee_session_user");
    }
    return true;
  });

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

      // If already logged in, keep active user
      if (parsedUser && !currentUser) {
        setCurrentUser(parsedUser);
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
          setCurrentUser(activeUser);
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
  }, [currentUser]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const login = (user: MemberDTO) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("splitrupee_session_user", JSON.stringify(user));
      document.cookie = `splitrupee_session=${encodeURIComponent(JSON.stringify(user))}; max-age=315360000; path=/; SameSite=Lax`;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("splitrupee_session_user");
      document.cookie = "splitrupee_session=; max-age=0; path=/; SameSite=Lax";
      window.location.replace("/login");
    }
  };

  const handleSetCurrentUser = (user: MemberDTO | null) => {
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
  };

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

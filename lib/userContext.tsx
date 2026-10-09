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
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.ok && Array.isArray(json.users)) {
        setUsers(json.users);

        const savedUserStr =
          typeof window !== "undefined"
            ? localStorage.getItem("splitrupee_session_user")
            : null;

        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            const freshUser = json.users.find((u: MemberDTO) => u.id === parsed.id);
            if (freshUser) {
              setCurrentUser(freshUser);
            } else {
              setCurrentUser(parsed);
            }
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const login = (user: MemberDTO) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("splitrupee_session_user", JSON.stringify(user));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("splitrupee_session_user");
      window.location.href = "/login";
    }
  };

  const handleSetCurrentUser = (user: MemberDTO | null) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("splitrupee_session_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("splitrupee_session_user");
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

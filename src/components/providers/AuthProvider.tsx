"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserSession, DEFAULT_DEMO_USER } from "@/lib/auth";
import { Role, ModuleName, PermissionAction, hasPermission as checkPermission } from "@/lib/permissions";
import { toast } from "sonner";

interface AuthContextType {
  user: UserSession;
  loading: boolean;
  switchUser: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (moduleName: ModuleName, action: PermissionAction) => boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_DEMO_USER,
  loading: false,
  switchUser: async () => {},
  logout: async () => {},
  hasPermission: () => true,
  refetchUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession>(DEFAULT_DEMO_USER);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (e) {
      console.error("Auth fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const switchUser = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        toast.success(`Switched role to ${data.user.name} (${data.user.role})`);
        window.location.reload();
      } else {
        toast.error("Failed to switch user account");
      }
    } catch (error) {
      toast.error("Error switching user account");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.info("Logged out successfully");
      window.location.href = "/login";
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const checkUserPermission = (moduleName: ModuleName, action: PermissionAction): boolean => {
    return checkPermission(user.role, user.permissions, moduleName, action);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        switchUser,
        logout,
        hasPermission: checkUserPermission,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

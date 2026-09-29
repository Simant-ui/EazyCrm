"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserSession, DEFAULT_DEMO_USER } from "@/lib/auth";
import { ModuleName, PermissionAction, hasPermission as checkPermission } from "@/lib/permissions";
import { toast } from "sonner";

interface AuthContextType {
  user: UserSession;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  switchUser: (identifier: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (moduleName: ModuleName | string, action?: PermissionAction | string) => boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_DEMO_USER,
  isAuthenticated: false,
  loading: true,
  login: async () => false,
  switchUser: async () => {},
  logout: async () => {},
  hasPermission: () => true,
  refetchUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession>(DEFAULT_DEMO_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          if (data.user.status === "INACTIVE") {
            toast.error("Your account has been deactivated. Please contact the administrator.");
            setIsAuthenticated(false);
          } else {
            setUser(data.user);
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error("Auth fetch failed:", e);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.user?.status === "INACTIVE") {
          toast.error("Your account has been deactivated. Please contact the administrator.");
          return false;
        }
        setUser(data.user);
        setIsAuthenticated(true);
        toast.success(`Welcome back, ${data.user.name}!`);
        return true;
      } else {
        toast.error(data.error || "Login failed. Please check your credentials.");
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Network error logging in");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const switchUser = async (identifier: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          userId: identifier,
          role: identifier,
          identifier: identifier,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (data.user?.status === "INACTIVE") {
          toast.error("Cannot switch to deactivated account!");
          return;
        }
        setUser(data.user);
        const roleLabel = (data.user.role || "").replace("_", " ");
        toast.success(`Switched account to ${data.user.name} (${roleLabel})`);
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to switch user account");
      }
    } catch (error: any) {
      toast.error(error.message || "Error switching user account");
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

  const checkUserPermission = (moduleName: ModuleName | string, action: PermissionAction | string = "view"): boolean => {
    return checkPermission(user, moduleName, action);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
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

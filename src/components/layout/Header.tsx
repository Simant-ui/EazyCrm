"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  Menu,
  ChevronRight,
  User,
  Shield,
  LogOut,
  UserCheck,
  Check,
  Sparkles,
  Users,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
}

const FALLBACK_USERS = [
  {
    _id: "user_admin_01",
    name: "Admin User",
    email: "admin@eazybox.com",
    role: "ADMIN",
    department: "Executive Management",
  },
  {
    _id: "user_prabin_02",
    name: "Prabin Sharma",
    email: "prabin@eazybox.com",
    role: "SALES_MANAGER",
    department: "Sales Management",
  },
  {
    _id: "user_aayusha_03",
    name: "Aayusha Paudel",
    email: "aayusha@eazybox.com",
    role: "SALES_EXECUTIVE",
    department: "Direct Sales",
  },
];

export function Header({ onOpenMobileSidebar, onOpenSearch }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout, switchUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>(FALLBACK_USERS);
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});

    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.users) && data.users.length > 0) {
          setAvailableUsers(data.users);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchAccount = async (targetEmail: string) => {
    try {
      setSwitchingEmail(targetEmail);
      await switchUser(targetEmail);
      setShowRoleMenu(false);
      setShowProfileMenu(false);
      setShowSwitchModal(false);
    } catch (e) {
      console.error("Account switch error:", e);
    } finally {
      setSwitchingEmail(null);
    }
  };

  // Format title and breadcrumbs dynamically based on current route
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return { title: "Dashboard", breadcrumbs: ["Home", "Dashboard"] };
    const main = parts[0];
    const formattedMain = main.charAt(0).toUpperCase() + main.slice(1).replace("-", " ");
    return {
      title: formattedMain,
      breadcrumbs: ["Home", formattedMain],
    };
  };

  const { title, breadcrumbs } = getBreadcrumbs();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "SALES_MANAGER":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 md:px-6 bg-card/80 backdrop-blur-md border-b border-border transition-colors">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open Mobile Menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-col">
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb}>
                  {i > 0 && <ChevronRight size={12} className="text-muted-foreground/50" />}
                  <span className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : ""}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">{title}</h1>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Role / Account Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowProfileMenu(false);
                setShowThemeMenu(false);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              title="Switch Account / Role Context"
            >
              <Shield size={13} />
              <span className="capitalize hidden xs:inline">{user.role.replace("_", " ")}</span>
              <ArrowRightLeft size={12} className="opacity-70" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-card border border-border shadow-2xl z-50 text-xs space-y-1">
                <div className="px-2 py-1.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider flex items-center justify-between border-b border-border/50 pb-2 mb-1">
                  <span>Switch Account</span>
                  <span className="text-[10px] text-primary font-normal">{availableUsers.length} Users</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
                  {availableUsers.map((u) => {
                    const isCurrent = u.email?.toLowerCase() === user.email?.toLowerCase();
                    const isSwitching = switchingEmail === u.email;
                    return (
                      <button
                        key={u._id || u.email}
                        onClick={() => handleSwitchAccount(u.email)}
                        disabled={isSwitching}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all border",
                          isCurrent
                            ? "bg-primary/10 border-primary/30 text-primary font-medium shadow-sm"
                            : "bg-transparent border-transparent hover:bg-accent/70 hover:border-border"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 border border-primary/30">
                            {getInitials(u.name)}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-foreground text-xs truncate">{u.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-full font-semibold border uppercase",
                              getRoleBadgeStyle(u.role)
                            )}
                          >
                            {u.role === "ADMIN" ? "Admin" : u.role === "SALES_MANAGER" ? "Manager" : "Exec"}
                          </span>
                          {isCurrent && <Check size={14} className="text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/60 hover:bg-accent border border-border/60 text-muted-foreground text-xs font-medium transition-colors"
          >
            <Search size={15} />
            <span className="hidden sm:inline">Search EazyInvo...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
                setShowThemeMenu(false);
                setShowRoleMenu(false);
              }}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card animate-pulse" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-card border border-border shadow-2xl z-50 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <span className="font-bold text-foreground">Notifications</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {notifications.length} Recent
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className="p-2.5 rounded-xl bg-accent/40 border border-border/50 hover:bg-accent/80 transition-colors"
                    >
                      <div className="font-semibold text-foreground">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                setShowProfileMenu(false);
                setShowNotifMenu(false);
                setShowRoleMenu(false);
              }}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Theme Switcher"
            >
              {mounted && theme === "dark" ? (
                <Moon size={18} />
              ) : mounted && theme === "light" ? (
                <Sun size={18} />
              ) : (
                <Laptop size={18} />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-36 p-1.5 rounded-xl bg-card border border-border shadow-xl z-50 text-xs space-y-0.5">
                <button
                  onClick={() => {
                    setTheme("light");
                    setShowThemeMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors",
                    theme === "light" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                  )}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setShowThemeMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors",
                    theme === "dark" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                  )}
                >
                  <Moon size={14} /> Dark
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setShowThemeMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors",
                    theme === "system" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                  )}
                >
                  <Laptop size={14} /> System
                </button>
              </div>
            )}
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowThemeMenu(false);
                setShowNotifMenu(false);
                setShowRoleMenu(false);
              }}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/40 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/30">
                {getInitials(user.name)}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-card border border-border shadow-2xl z-50 text-xs space-y-1">
                <div className="p-2 border-b border-border">
                  <div className="font-semibold text-foreground">{user.name}</div>
                  <div className="text-muted-foreground text-[11px] truncate">{user.email}</div>
                  <span
                    className={cn(
                      "inline-block mt-1 px-2 py-0.5 rounded-full font-medium text-[10px] border border-transparent",
                      getRoleBadgeStyle(user.role)
                    )}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Switch Account Quick Action */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowSwitchModal(true);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-foreground hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft size={14} className="text-primary" />
                    <span>Switch Account</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </button>

                <div className="border-t border-border pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-left font-medium"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Switch Account Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Switch User Account</h3>
                  <p className="text-xs text-muted-foreground">Select an account context to switch into</p>
                </div>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {availableUsers.map((u) => {
                const isCurrent = u.email?.toLowerCase() === user.email?.toLowerCase();
                const isSwitching = switchingEmail === u.email;
                return (
                  <button
                    key={u._id || u.email}
                    onClick={() => handleSwitchAccount(u.email)}
                    disabled={isSwitching}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all group",
                      isCurrent
                        ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                        : "bg-accent/40 border-border hover:bg-accent hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/30 to-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                        <div className="text-[10px] text-muted-foreground/80 mt-0.5">{u.department || "Sales"}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase",
                          getRoleBadgeStyle(u.role)
                        )}
                      >
                        {u.role ? u.role.replace("_", " ") : "User"}
                      </span>
                      {isCurrent ? (
                        <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                          <Check size={12} /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                          Switch →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


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
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
}

export function Header({ onOpenMobileSidebar, onOpenSearch }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout, switchUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});
  }, []);

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

  return (
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
        {/* Quick Role Switcher for Testing/Evaluation */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowProfileMenu(false);
              setShowThemeMenu(false);
              setShowNotifMenu(false);
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <Shield size={13} />
            <span className="capitalize">{user.role.replace("_", " ")}</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl bg-card border border-border shadow-xl z-50 text-xs space-y-1">
              <div className="px-2 py-1.5 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                Switch Role Context
              </div>
              <button
                onClick={() => {
                  switchUser("admin@eazybox.com");
                  setShowRoleMenu(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                  user.role === "ADMIN" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                )}
              >
                <div>
                  <div className="font-semibold">Admin User</div>
                  <div className="text-[10px] text-muted-foreground">Full system control</div>
                </div>
                {user.role === "ADMIN" && <Check size={14} />}
              </button>

              <button
                onClick={() => {
                  switchUser("prabin@eazybox.com");
                  setShowRoleMenu(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                  user.role === "SALES_MANAGER" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                )}
              >
                <div>
                  <div className="font-semibold">Prabin Sharma</div>
                  <div className="text-[10px] text-muted-foreground">Sales Manager</div>
                </div>
                {user.role === "SALES_MANAGER" && <Check size={14} />}
              </button>

              <button
                onClick={() => {
                  switchUser("aayusha@eazybox.com");
                  setShowRoleMenu(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                  user.role === "SALES_EXECUTIVE" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                )}
              >
                <div>
                  <div className="font-semibold">Aayusha Paudel</div>
                  <div className="text-[10px] text-muted-foreground">Sales Executive</div>
                </div>
                {user.role === "SALES_EXECUTIVE" && <Check size={14} />}
              </button>
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
            <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-card border border-border shadow-2xl z-50 text-xs space-y-1">
              <div className="p-2 border-b border-border">
                <div className="font-semibold text-foreground">{user.name}</div>
                <div className="text-muted-foreground text-[11px] truncate">{user.email}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[10px]">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

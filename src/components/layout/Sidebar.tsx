"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserCheck,
  Award,
  Megaphone,
  BarChart3,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Package,
  Truck,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { EazyInvoLogo } from "@/components/common/EazyInvoLogo";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onNavigateMobile?: () => void;
  onOpenAddSale?: () => void;
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  module?: any;
  action?: any;
  badge?: string;
  subItems?: { title: string; href: string; icon?: any }[];
}

export function Sidebar({ collapsed, setCollapsed, onNavigateMobile, onOpenAddSale }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>("Sales");

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu((prev) => (prev === title ? null : title));
  };

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      module: "dashboard",
      action: "viewOwn",
    },
    {
      title: "Sales",
      icon: ShoppingCart,
      module: "sales",
      action: "viewOwn",
      subItems: [
        { title: "All Sales", href: "/sales" },
        { title: "Confirmed", href: "/sales?status=CONFIRMED" },
        { title: "Completed", href: "/sales?status=COMPLETED" },
        { title: "Cancelled", href: "/sales?status=CANCELLED" },
      ],
    },
    {
      title: "Leads CRM",
      icon: Target,
      module: "leads",
      action: "viewOwn",
      subItems: [
        { title: "All Leads", href: "/leads" },
        { title: "Kanban Board", href: "/leads?view=kanban" },
        { title: "Follow-ups", href: "/leads?status=FOLLOW-UP" },
      ],
    },
    {
      title: "Customers",
      href: "/customers",
      icon: Users,
      module: "customers",
      action: "viewOwn",
    },
    {
      title: "Products Catalog",
      href: "/products",
      icon: Package,
      module: "products",
      action: "viewOwn",
    },
    {
      title: "NCM Courier Hub",
      href: "/ncm",
      icon: Truck,
      module: "ncm",
      action: "viewOwn",
      badge: "NCM API",
    },
    {
      title: "Commission",
      href: "/commission",
      icon: Award,
      module: "commission",
      action: "viewOwn",
    },
    {
      title: "Marketing & Meta",
      href: "/marketing",
      icon: Megaphone,
      module: "marketing",
      action: "viewOwn",
    },
    {
      title: "Team & Roles",
      href: "/team",
      icon: UserCheck,
      module: "team",
      action: "viewOwn",
    },
    {
      title: "Reports & Analytics",
      href: "/reports",
      icon: BarChart3,
      module: "reports",
      action: "viewOwn",
    },
    {
      title: "Audit Logs",
      href: "/audit-logs",
      icon: ClipboardList,
      module: "audit_logs",
      action: "viewOwn",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      module: "settings",
      action: "viewOwn",
    },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300 z-30 select-none",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Top Header & Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden"
          onClick={onNavigateMobile}
        >
          <EazyInvoLogo collapsed={collapsed} />
        </Link>

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Quick Add Button */}
      {!collapsed && onOpenAddSale && (
        <div className="p-3">
          <button
            onClick={onOpenAddSale}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:bg-primary-hover transition-colors"
          >
            <PlusCircle size={16} />
            <span>New Sale</span>
          </button>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          if (item.module && !hasPermission(item.module, item.action)) {
            return null;
          }

          const Icon = item.icon;
          const isDirectActive = item.href ? pathname === item.href : false;
          const hasSub = item.subItems && item.subItems.length > 0;
          const isSubActive = hasSub
            ? item.subItems!.some(
                (sub) =>
                  pathname === sub.href ||
                  (sub.href.includes("?") &&
                    typeof window !== "undefined" &&
                    pathname + window.location.search === sub.href)
              )
            : false;
          const isActive = isDirectActive || isSubActive;
          const isSubOpen = openSubmenu === item.title;

          if (hasSub) {
            return (
              <div key={item.title} className="space-y-0.5">
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    toggleSubmenu(item.title);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!collapsed && <span>{item.title}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      size={14}
                      className={cn("transition-transform duration-200", isSubOpen ? "rotate-180" : "")}
                    />
                  )}
                </button>

                {!collapsed && isSubOpen && (
                  <div className="pl-9 pr-2 py-1 space-y-1 border-l-2 border-border/50 ml-4">
                    {item.subItems!.map((sub) => {
                      const isSubCurrent = pathname === sub.href;
                      return (
                        <Link
                          key={sub.title}
                          href={sub.href}
                          onClick={onNavigateMobile}
                          className={cn(
                            "block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                            isSubCurrent
                              ? "text-primary bg-primary/10 font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                          )}
                        >
                          {sub.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.title}
              href={item.href || "#"}
              onClick={onNavigateMobile}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom User Profile */}
      <div className="p-3 border-t border-border bg-card-elevated/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/30">
                {getInitials(user.name)}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">{user.name}</span>
                <span className="text-[10px] text-muted-foreground capitalize truncate">
                  {user.role === "ADMIN"
                    ? "Administrator"
                    : user.role === "SALES_MANAGER"
                    ? "Sales Manager"
                    : "Sales Executive"}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPalette } from "./CommandPalette";
import { X, ShieldAlert, ArrowLeft, Mail, Lock } from "lucide-react";
import { AddSaleModal } from "@/components/sales/AddSaleModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { ModuleName } from "@/lib/permissions";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, hasPermission } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addSaleOpen, setAddSaleOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("eazybox_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, pathname, router]);

  const toggleCollapsed = (state: boolean) => {
    setCollapsed(state);
    localStorage.setItem("eazybox_sidebar_collapsed", JSON.stringify(state));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground">Verifying session & security permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== "/login") {
    return null;
  }

  // Map route path to permission module name
  const getModuleNameForPath = (path: string): ModuleName | null => {
    if (path.startsWith("/sales")) return "sales";
    if (path.startsWith("/leads")) return "leads";
    if (path.startsWith("/customers")) return "customers";
    if (path.startsWith("/products")) return "products";
    if (path.startsWith("/ncm")) return "ncm";
    if (path.startsWith("/commission")) return "commission";
    if (path.startsWith("/marketing")) return "marketing";
    if (path.startsWith("/team")) return "team";
    if (path.startsWith("/reports")) return "reports";
    if (path.startsWith("/audit-logs")) return "audit_logs";
    if (path.startsWith("/settings")) return "settings";
    return null;
  };

  const targetModule = getModuleNameForPath(pathname);
  const isAuthorized = targetModule ? hasPermission(targetModule, "view") : true;

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={toggleCollapsed}
          onOpenAddSale={() => setAddSaleOpen(true)}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full bg-card shadow-2xl z-10 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent z-20"
            >
              <X size={20} />
            </button>
            <Sidebar
              collapsed={false}
              setCollapsed={() => {}}
              onNavigateMobile={() => setMobileOpen(false)}
              onOpenAddSale={() => {
                setMobileOpen(false);
                setAddSaleOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          {isAuthorized ? (
            children
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-full max-w-lg p-8 rounded-3xl bg-card border border-border shadow-2xl space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
                  <ShieldAlert size={36} />
                </div>

                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                    Access Denied (403)
                  </span>
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Permission Restricted</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You don't have permission to access the <strong className="text-foreground capitalize">{targetModule?.replace("_", " ")}</strong> module with your current account (<span className="font-semibold text-foreground">{user.name}</span> — <span className="capitalize">{user.role.replace("_", " ")}</span>).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-accent/40 border border-border/80 text-xs text-left space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Lock size={14} className="text-amber-500" /> Need access to this module?
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Your System Administrator can update your account permissions from the Team Management matrix.
                  </p>
                  <div className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Administrator: admin@eazybox.com
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
                  >
                    <ArrowLeft size={16} /> Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Command Palette Global Search */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Global Add Sale Modal */}
      {addSaleOpen && (
        <AddSaleModal isOpen={addSaleOpen} onClose={() => setAddSaleOpen(false)} />
      )}
    </div>
  );
}

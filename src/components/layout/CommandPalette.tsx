"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Users, Target, UserCheck, Megaphone, X, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = Router();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    sales: any[];
    customers: any[];
    leads: any[];
    team: any[];
    campaigns: any[];
  }>({
    sales: [],
    customers: [],
    leads: [],
    team: [],
    campaigns: [],
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled externally
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ sales: [], customers: [], leads: [], team: [], campaigns: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();
        const [salesRes, custRes, leadsRes, teamRes, campRes] = await Promise.all([
          fetch(`/api/sales?search=${q}`).then((r) => r.json()),
          fetch(`/api/customers?search=${q}`).then((r) => r.json()),
          fetch(`/api/leads?search=${q}`).then((r) => r.json()),
          fetch(`/api/team`).then((r) => r.json()),
          fetch(`/api/marketing`).then((r) => r.json()),
        ]);

        setResults({
          sales: (salesRes.sales || []).slice(0, 4),
          customers: (custRes.customers || []).slice(0, 4),
          leads: (leadsRes.leads || []).slice(0, 4),
          team: (teamRes.users || []).filter((u: any) => u.name.toLowerCase().includes(q)).slice(0, 4),
          campaigns: (campRes.campaigns || []).filter((c: any) => c.name.toLowerCase().includes(q)).slice(0, 4),
        });
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const hasResults =
    results.sales.length > 0 ||
    results.customers.length > 0 ||
    results.leads.length > 0 ||
    results.team.length > 0 ||
    results.campaigns.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border bg-card-elevated/50">
          <Search size={20} className="text-muted-foreground mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sales, customers, leads, team members, campaigns..."
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!query.trim() && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Search size={32} className="mx-auto mb-2 opacity-40" />
              Type to search across the entire EazyBox system
            </div>
          )}

          {query.trim() && !hasResults && !loading && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No results found for &ldquo;<span className="text-foreground font-semibold">{query}</span>&rdquo;
            </div>
          )}

          {/* Sales Category */}
          {results.sales.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart size={13} className="text-primary" /> Sales ({results.sales.length})
              </div>
              {results.sales.map((sale) => (
                <button
                  key={sale._id}
                  onClick={() => handleSelect(`/sales`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/80 transition-colors text-left group"
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span>{sale.saleId}</span>
                      <span className="text-xs font-normal text-muted-foreground">({sale.customerName})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sale.product} · {formatCurrency(sale.finalAmount)}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Customers Category */}
          {results.customers.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users size={13} className="text-primary" /> Customers ({results.customers.length})
              </div>
              {results.customers.map((cust) => (
                <button
                  key={cust._id}
                  onClick={() => handleSelect(`/customers`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/80 transition-colors text-left group"
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">{cust.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {cust.mobile} · {cust.totalOrders} Orders · Total Spent: {formatCurrency(cust.totalSpent)}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Leads Category */}
          {results.leads.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target size={13} className="text-primary" /> Leads ({results.leads.length})
              </div>
              {results.leads.map((lead) => (
                <button
                  key={lead._id}
                  onClick={() => handleSelect(`/leads`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/80 transition-colors text-left group"
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {lead.mobile} · Status: <span className="font-semibold">{lead.status}</span> · {lead.campaign}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Team Category */}
          {results.team.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={13} className="text-primary" /> Team Members ({results.team.length})
              </div>
              {results.team.map((member) => (
                <button
                  key={member._id}
                  onClick={() => handleSelect(`/team`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/80 transition-colors text-left group"
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">{member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.role} · {member.department} · {member.email}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Campaigns Category */}
          {results.campaigns.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone size={13} className="text-primary" /> Campaigns ({results.campaigns.length})
              </div>
              {results.campaigns.map((camp) => (
                <button
                  key={camp._id}
                  onClick={() => handleSelect(`/marketing`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/80 transition-colors text-left group"
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">{camp.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {camp.platform} · Revenue: {formatCurrency(camp.revenue)}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-card-elevated border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Use <kbd className="px-1 py-0.5 rounded bg-card border border-border">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-card border border-border">↓</kbd> to navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-card border border-border">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return useRouter();
}

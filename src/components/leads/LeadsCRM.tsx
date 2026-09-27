"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Megaphone,
  Phone,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  X,
  FileText,
  Send,
} from "lucide-react";
import { LEAD_STATUS_CONFIG, LeadStatus } from "@/lib/business";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { AddLeadModal } from "./AddLeadModal";

const KANBAN_COLUMNS: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "FOLLOW-UP",
  "CONFIRMED",
  "CONVERTED",
  "LOST",
];

export function LeadsCRM() {
  const [leads, setLeads] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Filters
  const [search, setSearch] = useState("");
  const [salespersonFilter, setSalespersonFilter] = useState("ALL");

  // Modals & Active Drawer
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<any | null>(null);

  // Follow up & Note forms inside detail drawer
  const [newNote, setNewNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const [leadsRes, teamRes] = await Promise.all([
        fetch("/api/leads").then((r) => r.json()),
        fetch("/api/team").then((r) => r.json()),
      ]);
      setLeads(leadsRes.leads || []);
      setTeamMembers(teamRes.users || []);
    } catch (e) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          l.name.toLowerCase().includes(q) ||
          l.mobile.includes(q) ||
          l.source.toLowerCase().includes(q) ||
          l.campaign.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (salespersonFilter !== "ALL" && l.salespersonName !== salespersonFilter) {
        return false;
      }
      return true;
    });
  }, [leads, search, salespersonFilter]);

  // Drag and Drop Handler
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    const lead = leads.find((l) => l._id === leadId);
    if (!lead || lead.status === targetStatus) return;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, status: targetStatus } : l))
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.ok) {
        toast.success(`Lead moved to ${targetStatus}`);
        fetchLeads();
      } else {
        toast.error("Failed to update lead status");
        fetchLeads();
      }
    } catch (e) {
      toast.error("Error dropping lead card");
      fetchLeads();
    }
  };

  const handleAddNote = async () => {
    if (!activeLead || !newNote.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${activeLead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      if (res.ok) {
        toast.success("Note added to lead timeline");
        setNewNote("");
        fetchLeads();
        const updated = await res.json();
        setActiveLead(updated.lead);
      }
    } catch (e) {
      toast.error("Failed to add note");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddFollowUp = async () => {
    if (!activeLead || !followUpDate) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${activeLead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpDate, followUpNote }),
      });
      if (res.ok) {
        toast.success("Follow-up scheduled!");
        setFollowUpDate("");
        setFollowUpNote("");
        fetchLeads();
        const updated = await res.json();
        setActiveLead(updated.lead);
      }
    } catch (e) {
      toast.error("Failed to schedule follow up");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Leads CRM</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage incoming prospects across Kanban board & table views.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "kanban" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "table" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon size={14} /> Table
            </button>
          </div>

          <button
            onClick={() => setAddLeadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead name, phone, campaign..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={salespersonFilter}
          onChange={(e) => setSalespersonFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Executives</option>
          {teamMembers.map((m) => (
            <option key={m._id} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* View Mode 1: Kanban Board */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none">
          {KANBAN_COLUMNS.map((colStatus) => {
            const colConfig = LEAD_STATUS_CONFIG[colStatus];
            const colLeads = filteredLeads.filter((l) => l.status === colStatus);

            return (
              <div
                key={colStatus}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, colStatus)}
                className="w-72 shrink-0 rounded-2xl bg-card-elevated/60 border border-border/70 p-3 space-y-3 flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colConfig.color }}
                    />
                    <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                      {colConfig.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-card text-muted-foreground font-bold text-[11px] border border-border">
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colLeads.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-[11px] border-2 border-dashed border-border/50 rounded-xl">
                      Drop lead here
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead._id)}
                        onClick={() => setActiveLead(lead)}
                        className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5 interactive-card"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-sm text-foreground truncate">{lead.name}</div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold shrink-0">
                            {lead.source}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone size={12} /> {lead.mobile}
                        </div>

                        <div className="text-[11px] text-muted-foreground truncate">
                          🎯 {lead.campaign}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-medium">
                            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
                              {getInitials(lead.salespersonName)}
                            </div>
                            <span>{lead.salespersonName}</span>
                          </div>
                          {lead.nextFollowUpDate && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                              <Clock size={10} /> {formatDate(lead.nextFollowUpDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode 2: Data Table */}
      {viewMode === "table" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Lead Name</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Campaign</th>
                <th className="py-3 px-3">Assigned Executive</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Next Follow-up</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.map((lead) => {
                const colCfg = LEAD_STATUS_CONFIG[lead.status as LeadStatus] || LEAD_STATUS_CONFIG.NEW;
                return (
                  <tr key={lead._id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-foreground">{lead.name}</td>
                    <td className="py-3 px-3 text-muted-foreground">{lead.mobile}</td>
                    <td className="py-3 px-3 text-muted-foreground">{lead.source}</td>
                    <td className="py-3 px-3 text-muted-foreground">{lead.campaign}</td>
                    <td className="py-3 px-3 font-medium text-foreground">{lead.salespersonName}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${colCfg.bgClass} ${colCfg.textClass}`}>
                        {colCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{formatDate(lead.nextFollowUpDate)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setActiveLead(lead)}
                        className="px-2.5 py-1 rounded-lg border border-border text-foreground hover:bg-accent font-medium text-[11px]"
                      >
                        View Lead
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lead Modal */}
      {addLeadOpen && <AddLeadModal isOpen={addLeadOpen} onClose={() => setAddLeadOpen(false)} onSuccess={fetchLeads} />}

      {/* Lead Detail Drawer / Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-full bg-card border-l border-border shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="font-bold text-xl text-foreground">{activeLead.name}</h3>
                <p className="text-xs text-muted-foreground">{activeLead.mobile} · Source: {activeLead.source}</p>
              </div>
              <button onClick={() => setActiveLead(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent">
                <X size={20} />
              </button>
            </div>

            {/* Overview Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-accent/40"><span className="text-muted-foreground">Campaign: </span><span className="font-bold text-foreground">{activeLead.campaign}</span></div>
              <div className="p-3 rounded-xl bg-accent/40"><span className="text-muted-foreground">Assigned Rep: </span><span className="font-bold text-foreground">{activeLead.salespersonName}</span></div>
              <div className="p-3 rounded-xl bg-accent/40"><span className="text-muted-foreground">Current Status: </span><span className="font-bold text-primary">{activeLead.status}</span></div>
              <div className="p-3 rounded-xl bg-accent/40"><span className="text-muted-foreground">Next Follow Up: </span><span className="font-bold text-amber-600">{formatDate(activeLead.nextFollowUpDate)}</span></div>
            </div>

            {/* Schedule Follow-up Form */}
            <div className="p-4 rounded-xl bg-card-elevated border border-border space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Clock size={14} className="text-primary" /> Schedule Follow-Up
              </h4>
              <div className="space-y-2 text-xs">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs"
                />
                <input
                  type="text"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Follow-up note (e.g. Call owner to confirm quote)"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs"
                />
                <button
                  onClick={handleAddFollowUp}
                  disabled={updating || !followUpDate}
                  className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover disabled:opacity-50"
                >
                  Schedule Follow-Up
                </button>
              </div>
            </div>

            {/* Lead Notes & Add Note */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <FileText size={14} className="text-primary" /> Lead Notes
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add note..."
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs"
                />
                <button
                  onClick={handleAddNote}
                  disabled={updating || !newNote.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(activeLead.notes || []).map((n: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-accent/40 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-bold text-foreground">{n.author}</span>
                      <span>{formatDate(n.createdAt)}</span>
                    </div>
                    <div className="text-foreground">{n.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Activity Timeline</h4>
              <div className="space-y-2 border-l-2 border-border pl-3 ml-2 text-xs">
                {(activeLead.timeline || []).map((t: any, idx: number) => (
                  <div key={idx} className="relative space-y-0.5">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-primary" />
                    <div className="font-bold text-foreground">{t.title}</div>
                    <div className="text-muted-foreground">{t.description}</div>
                    <div className="text-[10px] text-muted-foreground">{t.user} · {formatDateTime(t.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

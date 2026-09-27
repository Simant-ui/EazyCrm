"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClipboardList, Shield, Clock, Search, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const json = await res.json();
      setLogs(json.auditLogs || json.logs || []);
    } catch (e) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              System Audit Logs
              <Shield size={22} className="text-primary" />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Immutable compliance trail of all user actions, sales modifications & payouts.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor / User</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Details / Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log: any) => (
                <tr key={log._id || Math.random()} className="hover:bg-accent/40 transition-colors">
                  <td className="py-3 px-3 text-muted-foreground font-mono text-[11px]">
                    {formatDate(log.createdAt || new Date())}
                  </td>
                  <td className="py-3 px-3 font-bold text-foreground">{log.userName || log.actor || "Admin User"}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-accent text-foreground">
                      {log.action || "CREATE_SALE"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-primary">{log.module || "Sales"}</td>
                  <td className="py-3 px-3 text-muted-foreground">{log.details || log.description || "Created new sale transaction"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

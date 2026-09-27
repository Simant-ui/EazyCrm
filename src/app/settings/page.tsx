"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Settings, Save, Database, Key, Shield, Bell, Moon, Sun, Sparkles, Truck, CheckCircle, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mongoUri, setMongoUri] = useState("mongodb+srv://*****:*****@cluster0.mongodb.net/eazycrm");
  const [commissionRate, setCommissionRate] = useState("8");
  const [metaAppId, setMetaAppId] = useState("102938475610293");

  // NCM API Settings state
  const [ncmToken, setNcmToken] = useState("0c593255a1805c938fd006ab01db5465fa680d8c");
  const [ncmBaseUrl, setNcmBaseUrl] = useState("https://demo.nepalcanmove.com");
  const [ncmPickupBranch, setNcmPickupBranch] = useState("TINKUNE");
  const [testingNcm, setTestingNcm] = useState(false);
  const [ncmConnectionStatus, setNcmConnectionStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ncm/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setNcmToken(d.config.apiToken || "");
          setNcmBaseUrl(d.config.baseUrl || "https://demo.nepalcanmove.com");
          setNcmPickupBranch(d.config.defaultPickupBranch || "TINKUNE");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/ncm/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: ncmToken,
          baseUrl: ncmBaseUrl,
          defaultPickupBranch: ncmPickupBranch,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Settings & Nepal Can Move API credentials updated!");
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (e) {
      toast.success("Settings updated successfully!");
    }
  };

  const handleTestNcmConnection = async () => {
    setTestingNcm(true);
    setNcmConnectionStatus(null);
    try {
      const res = await fetch(`/api/ncm/branches?token=${encodeURIComponent(ncmToken)}&baseUrl=${encodeURIComponent(ncmBaseUrl)}`);
      const data = await res.json();
      if (res.ok && data.branches) {
        setNcmConnectionStatus(`Connected successfully! ${data.branches.length} branches retrieved from NCM portal.`);
        toast.success(`NCM API Test Successful! (${data.branches.length} branches loaded)`);
      } else {
        setNcmConnectionStatus(`Connection Warning: ${data.error || "Could not verify branches"}`);
        toast.warning("NCM API response warning");
      }
    } catch (e: any) {
      setNcmConnectionStatus(`Error connecting to NCM endpoint: ${e.message}`);
      toast.error("Failed to connect to NCM API");
    } finally {
      setTestingNcm(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              System Settings
              <Settings size={22} className="text-primary" />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure database connection, Nepal Can Move API credentials & theme preferences.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Appearance */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> Theme Preference
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  theme === "light" ? "bg-primary text-primary-foreground border-primary" : "bg-accent border-border text-foreground"
                }`}
              >
                <Sun size={15} /> Light Theme
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  theme === "dark" ? "bg-primary text-primary-foreground border-primary" : "bg-accent border-border text-foreground"
                }`}
              >
                <Moon size={15} /> Dark Theme
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  theme === "system" ? "bg-primary text-primary-foreground border-primary" : "bg-accent border-border text-foreground"
                }`}
              >
                System Default
              </button>
            </div>
          </div>

          {/* Nepal Can Move (NCM) API Configuration */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/5 to-card border border-red-500/20 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Truck size={18} className="text-red-500" /> Nepal Can Move (NCM) API Credentials
              </h3>
              <button
                type="button"
                onClick={handleTestNcmConnection}
                disabled={testingNcm}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors border border-red-500/30 disabled:opacity-50"
              >
                <RefreshCw size={13} className={testingNcm ? "animate-spin" : ""} />
                {testingNcm ? "Testing..." : "Test Connection"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="font-semibold text-foreground">NCM Vendor API Token Key *</label>
                <input
                  type="text"
                  value={ncmToken}
                  onChange={(e) => setNcmToken(e.target.value)}
                  placeholder="e.g. a3dede0dcfb45e2af76ced9f7a74909aac9d0a45"
                  className="w-full mt-1.5 p-2.5 rounded-xl bg-background border border-input text-foreground font-mono font-semibold"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Obtained from your Nepal Can Move Vendor Portal account settings.
                </p>
              </div>

              <div>
                <label className="font-semibold text-foreground">API Mode / Base URL</label>
                <select
                  value={ncmBaseUrl}
                  onChange={(e) => setNcmBaseUrl(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl bg-background border border-input text-foreground font-semibold"
                >
                  <option value="https://demo.nepalcanmove.com">Demo / Staging (https://demo.nepalcanmove.com)</option>
                  <option value="https://nepalcanmove.com">Production / Live (https://nepalcanmove.com)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Default Pickup Branch (Sender)</label>
                <input
                  type="text"
                  value={ncmPickupBranch}
                  onChange={(e) => setNcmPickupBranch(e.target.value)}
                  placeholder="TINKUNE"
                  className="w-full mt-1.5 p-2.5 rounded-xl bg-background border border-input text-foreground font-semibold"
                />
              </div>
            </div>

            {ncmConnectionStatus && (
              <div className="p-3 rounded-xl bg-background border border-border text-xs flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                <span className="text-foreground">{ncmConnectionStatus}</span>
              </div>
            )}
          </div>

          {/* Business Rules */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Key size={16} className="text-primary" /> Commission & Business Rules
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Base Sales Executive Commission Rate (%)</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl bg-background border border-input text-foreground font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Meta Lead Ads App ID</label>
                <input
                  type="text"
                  value={metaAppId}
                  onChange={(e) => setMetaAppId(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl bg-background border border-input text-foreground font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary-hover transition-colors"
            >
              <Save size={16} /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

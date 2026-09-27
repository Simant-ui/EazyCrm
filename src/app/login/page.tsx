"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShieldCheck, LogIn, Sparkles, UserCheck, Key, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    setLoading(true);
    try {
      await switchUser(email);
      router.push("/dashboard");
    } catch (error) {
      toast.error("Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      name: "Admin User",
      email: "admin@eazybox.com",
      role: "ADMIN",
      title: "System Owner",
      color: "from-blue-600 to-indigo-600",
      badge: "Full Access",
    },
    {
      name: "Prabin Sharma",
      email: "prabin@eazybox.com",
      role: "SALES_MANAGER",
      title: "Sales Manager",
      color: "from-purple-600 to-pink-600",
      badge: "Team Leader",
    },
    {
      name: "Aayusha Paudel",
      email: "aayusha@eazybox.com",
      role: "SALES_EXECUTIVE",
      title: "Sales Executive",
      color: "from-emerald-600 to-teal-600",
      badge: "Individual Rep",
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-2xl shadow-lg shadow-primary/30">
            E
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
            EazyBox <span className="text-primary">Hub</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Enterprise Sales, Leads CRM & Commission Platform
          </p>
        </div>

        {/* Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6">
          {/* Quick Demo Switcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Quick Login As</span>
              <Sparkles size={14} className="text-amber-500" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.email}
                  onClick={async () => {
                    setLoading(true);
                    await switchUser(demo.email);
                    router.push("/dashboard");
                  }}
                  disabled={loading}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border bg-accent/40 hover:bg-accent hover:border-primary/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${demo.color} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                      {demo.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                        {demo.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{demo.email}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {demo.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative px-3 bg-card text-[11px] font-medium text-muted-foreground">
              Or sign in with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Work Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eazybox.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all"
            >
              <LogIn size={16} />
              <span>{loading ? "Signing in..." : "Sign In to Dashboard"}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Powered by EazyBox Sales Management Engine · Kathmandu, Nepal
        </p>
      </div>
    </div>
  );
}

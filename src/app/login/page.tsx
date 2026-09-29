"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { LogIn, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address or username");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Sign In to Your Account</h2>
            <p className="text-xs text-muted-foreground">Enter your credentials below to access the platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email / Username</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-all"
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

"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  UserCheck,
  ShieldCheck,
  Mail,
  Phone,
  Plus,
  Key,
  Trash2,
  CheckCircle,
  X,
  Lock,
  User,
  Building,
  Shield,
  Search,
  CheckSquare,
  Square,
  Award,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { ModuleName } from "@/lib/permissions";

const ALL_MODULES: { id: ModuleName; label: string }[] = [
  { id: "dashboard", label: "Dashboard Analytics" },
  { id: "sales", label: "Sales & Orders" },
  { id: "customers", label: "Customers CRM" },
  { id: "leads", label: "Leads CRM" },
  { id: "products", label: "Products Catalog" },
  { id: "ncm", label: "Nepal Can Move Courier Hub" },
  { id: "commission", label: "Commission & Payments" },
  { id: "marketing", label: "Marketing Attribution" },
  { id: "reports", label: "Reports & Audit PDF" },
  { id: "team", label: "Team & Role Management" },
  { id: "audit_logs", label: "Audit Logs" },
  { id: "settings", label: "System Settings" },
];

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "SALES_EXECUTIVE",
    department: "Sales & Marketing",
    commissionRate: 5,
    password: "",
    confirmPassword: "",
  });

  // Selected permission checkboxes state
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({
    dashboard: true,
    sales: true,
    customers: true,
    leads: true,
    products: true,
    ncm: true,
    commission: true,
    marketing: true,
    reports: true,
    team: false,
    audit_logs: true,
    settings: false,
  });

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetMember, setResetMember] = useState<any>(null);
  const [resetPasswords, setResetPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Load Team Members
  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      setMembers(json.users || json.team || []);
    } catch (e) {
      toast.error("Failed to load team list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const togglePermissionModule = (modId: string) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const selectAllPermissions = () => {
    const next: Record<string, boolean> = {};
    ALL_MODULES.forEach((m) => (next[m.id] = true));
    setSelectedPermissions(next);
  };

  const clearAllPermissions = () => {
    const next: Record<string, boolean> = {};
    ALL_MODULES.forEach((m) => (next[m.id] = false));
    setSelectedPermissions(next);
  };

  // Handle Add Member Submit
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addFormData.name || !addFormData.email || !addFormData.mobile) {
      toast.error("Please fill in Name, Email, and Mobile number");
      return;
    }

    if (!addFormData.password) {
      toast.error("Please enter a password for the new member");
      return;
    }

    if (addFormData.password !== addFormData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    // Convert checkbox permissions to permission matrix structure
    const customPermissionsMatrix: Record<string, any> = {};
    ALL_MODULES.forEach((m) => {
      const isGranted = !!selectedPermissions[m.id];
      customPermissionsMatrix[m.id] = {
        viewOwn: isGranted,
        viewAll: addFormData.role === "ADMIN" ? true : isGranted,
        create: isGranted,
        edit: isGranted,
        delete: isGranted,
        export: isGranted,
        manage: isGranted,
      };
    });

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addFormData.name,
          email: addFormData.email,
          mobile: addFormData.mobile,
          role: addFormData.role,
          department: addFormData.department,
          commissionRate: addFormData.commissionRate,
          password: addFormData.password,
          permissions: customPermissionsMatrix,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Team member '${addFormData.name}' added with custom module permissions!`);
        setIsAddModalOpen(false);
        setAddFormData({
          name: "",
          email: "",
          mobile: "",
          role: "SALES_EXECUTIVE",
          department: "Sales & Marketing",
          commissionRate: 5,
          password: "",
          confirmPassword: "",
        });
        fetchTeam();
      } else {
        toast.error(data.error || "Failed to add team member");
      }
    } catch (err) {
      toast.error("Error creating team member");
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswords.newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (resetPasswords.newPassword !== resetPasswords.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`/api/team/${resetMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswords.newPassword }),
      });

      if (res.ok) {
        toast.success(`Password reset successfully for ${resetMember.name}!`);
        setIsResetModalOpen(false);
        setResetMember(null);
        setResetPasswords({ newPassword: "", confirmPassword: "" });
      } else {
        toast.error("Failed to reset password");
      }
    } catch (err) {
      toast.error("Error resetting password");
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (member: any) => {
    if (!confirm(`Are you sure you want to delete member '${member.name}'?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/team/${member._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Member '${member.name}' deleted!`);
        fetchTeam();
      } else {
        toast.error("Failed to delete member");
      }
    } catch (err) {
      toast.error("Error deleting member");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile?.includes(search) ||
      m.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              Team & Module Permission Management
              <ShieldCheck size={22} className="text-emerald-500" />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create team accounts, assign module access checkboxes, set commission rates & manage member credentials.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} /> Add New Team Member
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading team members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
            No team members found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => (
              <div key={m._id} className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 font-bold text-sm flex items-center justify-center border border-emerald-500/30">
                      {getInitials(m.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{m.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{m.department || "Direct Sales"}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      m.role === "ADMIN"
                        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                        : m.role === "SALES_MANAGER"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    }`}
                  >
                    {m.role}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-muted-foreground shrink-0" />
                    <span>{m.mobile || "9800000000"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-emerald-500 shrink-0" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Commission: {m.commissionRate || 5}%</span>
                  </div>
                </div>

                {/* Member Module Permissions Preview Badges */}
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Granted Module Access:</span>
                  <div className="flex flex-wrap gap-1">
                    {ALL_MODULES.map((mod) => {
                      const hasAcc =
                        m.role === "ADMIN" ||
                        (m.permissions && m.permissions[mod.id] && m.permissions[mod.id].viewOwn);
                      return (
                        <span
                          key={mod.id}
                          className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                            hasAcc
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : "bg-accent text-muted-foreground opacity-40 line-through"
                          }`}
                        >
                          {mod.label.split(" ")[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setResetMember(m);
                      setResetPasswords({ newPassword: "", confirmPassword: "" });
                      setIsResetModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <Key size={13} /> Reset Pass
                  </button>

                  <button
                    onClick={() => handleDeleteMember(m)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Add Team Member Modal with Checkbox Permissions --- */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="relative w-full max-w-2xl my-8 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-elevated">
                <div className="flex items-center gap-2">
                  <UserCheck size={20} className="text-emerald-500" />
                  <div>
                    <h3 className="font-bold text-base text-foreground">Add New Team Member</h3>
                    <p className="text-[11px] text-muted-foreground">Set account credentials & tick module access checkboxes</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div>
                  <label className="block font-medium text-foreground mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    placeholder="e.g. Ram Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Email / Username *</label>
                    <input
                      type="email"
                      required
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      placeholder="ram@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={addFormData.mobile}
                      onChange={(e) => setAddFormData({ ...addFormData, mobile: e.target.value })}
                      placeholder="9841XXXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-foreground mb-1">System Role *</label>
                    <select
                      value={addFormData.role}
                      onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="SALES_EXECUTIVE">Sales Executive</option>
                      <option value="SALES_MANAGER">Sales Manager</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Department</label>
                    <input
                      type="text"
                      value={addFormData.department}
                      onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                      placeholder="Direct Sales"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Commission Rate (%)</label>
                    <input
                      type="number"
                      value={addFormData.commissionRate}
                      onChange={(e) => setAddFormData({ ...addFormData, commissionRate: Number(e.target.value) })}
                      placeholder="5"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Account Password *</label>
                    <input
                      type="password"
                      required
                      value={addFormData.password}
                      onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={addFormData.confirmPassword}
                      onChange={(e) => setAddFormData({ ...addFormData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* --- MODULE ACCESS PERMISSION CHECKBOXES --- */}
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500" /> Module Access Checkboxes
                      </h4>
                      <p className="text-[10px] text-muted-foreground">Tick only the modules this member is allowed to access</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllPermissions}
                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={clearAllPermissions}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-accent/30 border border-border">
                    {ALL_MODULES.map((mod) => {
                      const isChecked = !!selectedPermissions[mod.id];
                      return (
                        <label
                          key={mod.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermissionModule(mod.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={`text-xs ${isChecked ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                            {mod.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    Create Member & Apply Permissions
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- Reset Password Modal --- */}
        {isResetModalOpen && resetMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-elevated">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-amber-500" />
                  <h3 className="font-bold text-base text-foreground">Reset Password</h3>
                </div>
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-xs">
                <p className="text-xs text-muted-foreground">
                  Resetting password for member <strong className="text-foreground">{resetMember.name}</strong> ({resetMember.email})
                </p>

                <div>
                  <label className="block font-medium text-foreground mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    value={resetPasswords.newPassword}
                    onChange={(e) => setResetPasswords({ ...resetPasswords, newPassword: e.target.value })}
                    placeholder="Enter new password..."
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={resetPasswords.confirmPassword}
                    onChange={(e) => setResetPasswords({ ...resetPasswords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password..."
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 shadow-md shadow-amber-600/20"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

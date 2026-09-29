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
  Filter,
  Check,
  Power,
  Edit2,
  RotateCcw,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { ALL_MODULE_DEFINITIONS, ModuleName, PermissionAction, PermissionMatrix } from "@/lib/permissions";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  // Form State
  const [addFormData, setAddFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "MEMBER",
    department: "Sales & Marketing",
    commissionRate: 5,
    status: "ACTIVE",
    password: "",
    confirmPassword: "",
  });

  // Permission Search Filter inside Modal
  const [permSearch, setPermSearch] = useState("");

  // Checkbox matrix state
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Record<string, boolean>>>({});

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

  // Initialize permission matrix for member creation/editing
  const initPermissionsMatrix = (existingPermissions?: any, role = "MEMBER") => {
    const matrix: Record<string, Record<string, boolean>> = {};
    ALL_MODULE_DEFINITIONS.forEach((mod) => {
      matrix[mod.id] = {};
      mod.actions.forEach((act) => {
        if (role === "ADMIN") {
          matrix[mod.id][act] = true;
        } else if (existingPermissions && existingPermissions[mod.id] && typeof existingPermissions[mod.id][act] === "boolean") {
          matrix[mod.id][act] = existingPermissions[mod.id][act];
        } else if (existingPermissions && existingPermissions[mod.id] && typeof existingPermissions[mod.id]["viewOwn"] === "boolean" && act === "view") {
          matrix[mod.id][act] = existingPermissions[mod.id]["viewOwn"];
        } else {
          // Defaults for members
          if (["dashboard", "sales", "leads", "customers", "products", "reports"].includes(mod.id) && act === "view") {
            matrix[mod.id][act] = true;
          } else if (["sales", "leads", "customers"].includes(mod.id) && ["create", "edit"].includes(act)) {
            matrix[mod.id][act] = true;
          } else {
            matrix[mod.id][act] = false;
          }
        }
      });
    });
    setSelectedPermissions(matrix);
  };

  const handleOpenAddModal = () => {
    setAddFormData({
      name: "",
      email: "",
      mobile: "",
      role: "MEMBER",
      department: "Sales & Marketing",
      commissionRate: 5,
      status: "ACTIVE",
      password: "",
      confirmPassword: "",
    });
    initPermissionsMatrix(undefined, "MEMBER");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: any) => {
    setEditingMember(member);
    setAddFormData({
      name: member.name || "",
      email: member.email || "",
      mobile: member.mobile || "",
      role: member.role || "MEMBER",
      department: member.department || "Sales",
      commissionRate: member.commissionRate || 5,
      status: member.status || "ACTIVE",
      password: "",
      confirmPassword: "",
    });
    initPermissionsMatrix(member.permissions, member.role);
    setIsEditModalOpen(true);
  };

  const toggleSinglePermission = (modId: string, action: string) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [modId]: {
        ...(prev[modId] || {}),
        [action]: !prev[modId]?.[action],
      },
    }));
  };

  const toggleModuleAll = (modId: string, enabled: boolean) => {
    const modDef = ALL_MODULE_DEFINITIONS.find((m) => m.id === modId);
    if (!modDef) return;
    setSelectedPermissions((prev) => {
      const nextMod: Record<string, boolean> = { ...(prev[modId] || {}) };
      modDef.actions.forEach((act) => {
        nextMod[act] = enabled;
      });
      return { ...prev, [modId]: nextMod };
    });
  };

  const selectAllPermissionsGlobal = () => {
    const next: Record<string, Record<string, boolean>> = {};
    ALL_MODULE_DEFINITIONS.forEach((mod) => {
      next[mod.id] = {};
      mod.actions.forEach((act) => {
        next[mod.id][act] = true;
      });
    });
    setSelectedPermissions(next);
  };

  const clearAllPermissionsGlobal = () => {
    const next: Record<string, Record<string, boolean>> = {};
    ALL_MODULE_DEFINITIONS.forEach((mod) => {
      next[mod.id] = {};
      mod.actions.forEach((act) => {
        next[mod.id][act] = false;
      });
    });
    setSelectedPermissions(next);
  };

  // Count active permissions
  const countEnabledPermissions = () => {
    let count = 0;
    let total = 0;
    ALL_MODULE_DEFINITIONS.forEach((mod) => {
      mod.actions.forEach((act) => {
        total++;
        if (selectedPermissions[mod.id]?.[act]) count++;
      });
    });
    return { count, total };
  };

  // Submit Add Member
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
          status: addFormData.status,
          password: addFormData.password,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Team member '${addFormData.name}' added with assigned permissions!`);
        setIsAddModalOpen(false);
        fetchTeam();
      } else {
        toast.error(data.error || "Failed to add team member");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error creating team member");
    }
  };

  // Submit Edit Member
  const handleEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/team/${editingMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addFormData.name,
          email: addFormData.email,
          mobile: addFormData.mobile,
          role: addFormData.role,
          department: addFormData.department,
          commissionRate: addFormData.commissionRate,
          status: addFormData.status,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Member permissions and details updated for '${addFormData.name}'!`);
        setIsEditModalOpen(false);
        setEditingMember(null);
        fetchTeam();
      } else {
        toast.error(data.error || "Failed to update member");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error updating member");
    }
  };

  // Toggle Member Active Status
  const handleToggleStatus = async (member: any) => {
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/team/${member._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`Member '${member.name}' status set to ${nextStatus}!`);
        fetchTeam();
      } else {
        toast.error("Failed to change member status");
      }
    } catch (err) {
      toast.error("Error updating member status");
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

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile?.includes(search) ||
      m.role?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { count: enabledCount, total: totalPermCount } = countEnabledPermissions();

  const filteredModuleDefs = ALL_MODULE_DEFINITIONS.filter(
    (mod) =>
      mod.label.toLowerCase().includes(permSearch.toLowerCase()) ||
      mod.id.toLowerCase().includes(permSearch.toLowerCase()) ||
      mod.category.toLowerCase().includes(permSearch.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              Team & Permission Management (RBAC)
              <ShieldCheck size={22} className="text-emerald-500" />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create member accounts, assign granular module permissions (View, Create, Edit, Delete), and manage active/inactive status.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} /> Add New Team Member
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <div className="flex rounded-xl bg-card border border-border p-1 text-xs">
              {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === st
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading team members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
            No team members found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => {
              // Calculate assigned permissions count
              let activeCount = 0;
              ALL_MODULE_DEFINITIONS.forEach((mod) => {
                mod.actions.forEach((act) => {
                  if (m.role === "ADMIN") activeCount++;
                  else if (m.permissions && m.permissions[mod.id] && m.permissions[mod.id][act]) activeCount++;
                  else if (m.permissions && m.permissions[mod.id] && m.permissions[mod.id]["viewOwn"] && act === "view") activeCount++;
                });
              });

              return (
                <div key={m._id} className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 font-bold text-sm flex items-center justify-center border border-emerald-500/30 shrink-0">
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {m.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">{m.department || "Direct Sales"}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          m.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }`}
                      >
                        {m.role === "ADMIN" ? "Administrator" : "Member"}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        }`}
                      >
                        {m.status || "ACTIVE"}
                      </span>
                    </div>
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

                  {/* Granted Permissions Badge Count */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-500" />
                      {m.role === "ADMIN" ? "Full Access (Admin)" : `${activeCount} Permissions Enabled`}
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(m)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Edit2 size={12} /> Edit Matrix
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(m)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        m.status === "ACTIVE"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                      }`}
                      title={m.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
                    >
                      <Power size={13} /> {m.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => {
                        setResetMember(m);
                        setResetPasswords({ newPassword: "", confirmPassword: "" });
                        setIsResetModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      <Key size={13} /> Reset Pass
                    </button>

                    <button
                      onClick={() => handleDeleteMember(m)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- ADD / EDIT MEMBER MODAL WITH PROFESSIONAL PERMISSION MATRIX --- */}
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="relative w-full max-w-3xl my-8 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-elevated">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={22} className="text-emerald-500" />
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">
                      {isAddModalOpen ? "Add New Team Member" : `Edit Permissions — ${addFormData.name}`}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Configure account credentials & set granular module access matrix (View, Create, Edit, Delete)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form
                onSubmit={isAddModalOpen ? handleAddMemberSubmit : handleEditMemberSubmit}
                className="p-6 space-y-5 text-xs overflow-y-auto flex-1"
              >
                {/* Credentials Section */}
                <div className="space-y-3 p-4 rounded-xl bg-accent/30 border border-border">
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} className="text-emerald-500" /> Member Details & Account Credentials
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-medium text-foreground mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={addFormData.name}
                        onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                        placeholder="Ram Sharma"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-medium text-foreground mb-1">Role *</label>
                      <select
                        value={addFormData.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setAddFormData({ ...addFormData, role: newRole });
                          if (newRole === "ADMIN") selectAllPermissionsGlobal();
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="MEMBER">Member (Controlled Access)</option>
                        <option value="ADMIN">Administrator (Full Access)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-foreground mb-1">Status *</label>
                      <select
                        value={addFormData.status}
                        onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl bg-background border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold ${
                          addFormData.status === "ACTIVE" ? "text-emerald-600 border-emerald-500/30" : "text-rose-600 border-rose-500/30"
                        }`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive (Access Blocked)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-foreground mb-1">Department</label>
                      <input
                        type="text"
                        value={addFormData.department}
                        onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                        placeholder="Sales & Marketing"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-foreground mb-1">Commission (%)</label>
                      <input
                        type="number"
                        value={addFormData.commissionRate}
                        onChange={(e) => setAddFormData({ ...addFormData, commissionRate: Number(e.target.value) })}
                        placeholder="5"
                        className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600"
                      />
                    </div>
                  </div>

                  {isAddModalOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                  )}
                </div>

                {/* --- GRANULAR PERMISSION MATRIX SECTION --- */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      <div>
                        <h4 className="font-extrabold text-xs text-foreground">Granular Module Permission Matrix</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {addFormData.role === "ADMIN"
                            ? "Administrators automatically bypass permission restrictions"
                            : "Check specific access levels granted to this member"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] shadow-sm">
                        {enabledCount} of {totalPermCount} permissions enabled
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllPermissionsGlobal}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-600/25"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearAllPermissionsGlobal}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-600 text-[10px] font-bold hover:bg-rose-500/25"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Permission Search Input */}
                  <div className="relative max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter modules or categories..."
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Matrix Table */}
                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-accent/60 border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
                        <tr>
                          <th className="p-3">Module Name</th>
                          <th className="p-3 text-center">View</th>
                          <th className="p-3 text-center">Create</th>
                          <th className="p-3 text-center">Edit</th>
                          <th className="p-3 text-center">Delete</th>
                          <th className="p-3 text-center">Export / Manage</th>
                          <th className="p-3 text-right">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredModuleDefs.map((mod) => {
                          const currentModPerms = selectedPermissions[mod.id] || {};
                          const isView = !!currentModPerms.view;
                          const isCreate = !!currentModPerms.create;
                          const isEdit = !!currentModPerms.edit;
                          const isDelete = !!currentModPerms.delete;
                          const isExport = !!currentModPerms.export || !!currentModPerms.manage;

                          const modAllChecked = mod.actions.every((act) => !!currentModPerms[act]);

                          return (
                            <tr key={mod.id} className="hover:bg-accent/30 transition-colors">
                              <td className="p-3 font-semibold text-foreground">
                                <div>
                                  <span className="block font-bold">{mod.label}</span>
                                  <span className="text-[10px] text-muted-foreground font-normal">{mod.category}</span>
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                {mod.actions.includes("view") && (
                                  <input
                                    type="checkbox"
                                    checked={isView}
                                    onChange={() => toggleSinglePermission(mod.id, "view")}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                )}
                              </td>

                              <td className="p-3 text-center">
                                {mod.actions.includes("create") && (
                                  <input
                                    type="checkbox"
                                    checked={isCreate}
                                    onChange={() => toggleSinglePermission(mod.id, "create")}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                )}
                              </td>

                              <td className="p-3 text-center">
                                {mod.actions.includes("edit") && (
                                  <input
                                    type="checkbox"
                                    checked={isEdit}
                                    onChange={() => toggleSinglePermission(mod.id, "edit")}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                )}
                              </td>

                              <td className="p-3 text-center">
                                {mod.actions.includes("delete") && (
                                  <input
                                    type="checkbox"
                                    checked={isDelete}
                                    onChange={() => toggleSinglePermission(mod.id, "delete")}
                                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                  />
                                )}
                              </td>

                              <td className="p-3 text-center">
                                {(mod.actions.includes("export") || mod.actions.includes("manage")) && (
                                  <input
                                    type="checkbox"
                                    checked={isExport}
                                    onChange={() =>
                                      toggleSinglePermission(mod.id, mod.actions.includes("export") ? "export" : "manage")
                                    }
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                )}
                              </td>

                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleModuleAll(mod.id, !modAllChecked)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                                    modAllChecked
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                      : "bg-accent text-muted-foreground border-border hover:text-foreground"
                                  }`}
                                >
                                  {modAllChecked ? "Clear Module" : "Select Module"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Check size={14} /> {isAddModalOpen ? "Create Member & Save Matrix" : "Save Matrix Permissions"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- RESET PASSWORD MODAL --- */}
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

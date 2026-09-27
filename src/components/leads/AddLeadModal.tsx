"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { X, Target } from "lucide-react";

const addLeadSchema = z.object({
  name: z.string().min(2, "Name required"),
  mobile: z.string().min(10, "10-digit mobile required"),
  email: z.string().email("Invalid email").or(z.literal("")),
  source: z.string().default("Meta Ads"),
  campaign: z.string().default("Dashain Special Promo 2026"),
  salespersonId: z.string().min(1, "Select salesperson"),
  status: z.string().default("NEW"),
  nextFollowUpDate: z.string().optional(),
  initialNote: z.string().optional(),
});

type AddLeadFormValues = z.infer<typeof addLeadSchema>;

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddLeadModal({ isOpen, onClose, onSuccess }: AddLeadModalProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(addLeadSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      source: "Meta Ads",
      campaign: "Dashain Special Promo 2026",
      salespersonId: "",
      status: "NEW",
      nextFollowUpDate: "",
      initialNote: "",
    },
  });

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => {
        setTeamMembers(d.users || []);
        if (d.users && d.users.length > 0) {
          form.setValue("salespersonId", d.users[0]._id);
        }
      })
      .catch(() => {});
  }, [form]);

  if (!isOpen) return null;

  const onSubmit = async (values: AddLeadFormValues) => {
    setLoading(true);
    try {
      const selectedMember = teamMembers.find((m) => m._id === values.salespersonId);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          salespersonName: selectedMember ? selectedMember.name : "Sales Executive",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Lead ${values.name} added successfully!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Unable to add lead");
      }
    } catch (e: any) {
      toast.error("Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-elevated">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Add New Lead</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Lead / Business Name *</label>
            <input
              type="text"
              {...form.register("name")}
              placeholder="e.g. Greenland Departmental Store"
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Mobile Number *</label>
              <input
                type="tel"
                {...form.register("mobile")}
                placeholder="9841XXXXXX"
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email Address</label>
              <input
                type="email"
                {...form.register("email")}
                placeholder="info@business.np"
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Lead Source</label>
              <select
                {...form.register("source")}
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Meta Ads">Meta Ads (FB/IG)</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Organic Referral">Organic Referral</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Campaign</label>
              <select
                {...form.register("campaign")}
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Dashain Special Promo 2026">Dashain Special Promo 2026</option>
                <option value="Retail Merchants Lead Gen - Q3">Retail Merchants Lead Gen - Q3</option>
                <option value="Restaurant POS Hardware Kit">Restaurant POS Hardware Kit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Assigned Executive *</label>
              <select
                {...form.register("salespersonId")}
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {teamMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Lead Status</label>
              <select
                {...form.register("status")}
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERESTED">Interested</option>
                <option value="FOLLOW-UP">Follow-up</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Initial Note / Requirements</label>
            <input
              type="text"
              {...form.register("initialNote")}
              placeholder="Interested in 3 hardware units..."
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover"
            >
              {loading ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { X, Users } from "lucide-react";

const addCustomerSchema = z.object({
  name: z.string().min(2, "Customer name required"),
  mobile: z.string().min(10, "10-digit mobile required"),
  email: z.string().email("Invalid email").or(z.literal("")),
  address: z.string().optional(),
  salespersonId: z.string().min(1, "Select salesperson"),
});

type AddCustomerFormValues = z.infer<typeof addCustomerSchema>;

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<AddCustomerFormValues>({
    resolver: zodResolver(addCustomerSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      address: "",
      salespersonId: "",
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

  const onSubmit = async (values: AddCustomerFormValues) => {
    setLoading(true);
    try {
      const selectedMember = teamMembers.find((m) => m._id === values.salespersonId);
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          salespersonName: selectedMember ? selectedMember.name : "Sales Executive",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Customer ${values.name} added successfully!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Unable to add customer");
      }
    } catch (e: any) {
      toast.error("Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card-elevated">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Add New Customer</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1">Customer / Business Name *</label>
            <input
              type="text"
              {...form.register("name")}
              placeholder="e.g. Bishal Supermarket & Mart"
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
                placeholder="customer@gmail.com"
                className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Store / Business Address</label>
            <input
              type="text"
              {...form.register("address")}
              placeholder="New Road, Kathmandu"
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Assigned Account Manager *</label>
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
              {loading ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

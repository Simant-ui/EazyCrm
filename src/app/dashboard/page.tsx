"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";

export default function DashboardPage() {
  return (
    <AppLayout>
      <ExecutiveDashboard />
    </AppLayout>
  );
}

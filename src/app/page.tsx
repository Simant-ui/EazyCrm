"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";

export default function HomePage() {
  return (
    <AppLayout>
      <ExecutiveDashboard />
    </AppLayout>
  );
}

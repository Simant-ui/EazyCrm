"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { CommissionDashboard } from "@/components/commission/CommissionDashboard";

export default function CommissionPage() {
  return (
    <AppLayout>
      <CommissionDashboard />
    </AppLayout>
  );
}

"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { NcmVendorSystemContent } from "@/components/ncm/NcmVendorSystemContent";

export default function NcmPage() {
  return (
    <AppLayout>
      <NcmVendorSystemContent />
    </AppLayout>
  );
}

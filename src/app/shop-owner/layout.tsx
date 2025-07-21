
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";

export default function ShopOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="shop-owner">
      {children}
    </DashboardLayout>
  );
}

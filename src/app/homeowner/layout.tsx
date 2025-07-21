
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";

export default function HomeownerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="homeowner">
        {children}
    </DashboardLayout>
  );
}


'use client';

import { DashboardLayout } from "@/components/dashboard-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // For now, we allow any authenticated user to access the admin panel.
  // In a real app, you'd check for the 'admin' role here.
  return (
    <DashboardLayout role="homeowner">
        {children}
    </DashboardLayout>
  );
}

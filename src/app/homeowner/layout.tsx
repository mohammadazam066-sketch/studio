
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function HomeownerLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  // This layout is accessible to both guests and logged-in homeowners.
  // The DashboardLayout will handle showing/hiding nav items based on auth state.
  return (
    <DashboardLayout role={currentUser?.role ?? null}>
      {children}
    </DashboardLayout>
  );
}

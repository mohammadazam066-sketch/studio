
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();
    
    // The dashboard layout can handle a null role for guests.
    // We only need to show a loader while auth state is being determined.
    if (loading) {
        return (
             <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <DashboardLayout role={currentUser?.role ?? null}>
        {children}
    </DashboardLayout>
  );
}

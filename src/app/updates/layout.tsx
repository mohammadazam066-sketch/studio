
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();
    
    // We can't determine role until currentUser is loaded.
    // The DashboardLayout itself has a loader, so this is fine.
    if (loading || !currentUser) {
        return (
             <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <DashboardLayout role={currentUser.role}>
        {children}
    </DashboardLayout>
  );
}

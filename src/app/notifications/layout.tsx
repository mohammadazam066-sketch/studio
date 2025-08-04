
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    
    // We can't determine role until currentUser is loaded.
    // The DashboardLayout itself has a loader, so this is fine.
    if (!currentUser) {
        return null; 
    }

  return (
    <DashboardLayout role={currentUser.role}>
        {children}
    </DashboardLayout>
  );
}

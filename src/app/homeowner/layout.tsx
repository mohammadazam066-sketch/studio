
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";

export default function HomeownerLayout({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    
    // Pass the homeowner role if a user is logged in, otherwise pass null to signify a guest.
    const role = currentUser && currentUser.role === 'homeowner' ? 'homeowner' : null;

  return (
    <DashboardLayout role={role}>
        {children}
    </DashboardLayout>
  );
}


'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";
import { ProtectedRoute } from "@/components/protected-route";
import { Loader2 } from "lucide-react";

export default function HomeownerLayout({ children }: { children: React.ReactNode }) {
  // This layout is now fully protected. Guests will be redirected to login.
  // The "guest" view of the dashboard is handled by the main app layout.
  return (
    <ProtectedRoute role="homeowner">
      <DashboardLayout role="homeowner">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

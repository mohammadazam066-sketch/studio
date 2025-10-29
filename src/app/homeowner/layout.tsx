
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";
import { ProtectedRoute } from "@/components/protected-route";
import { Loader2 } from "lucide-react";

export default function HomeownerLayout({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();

    // If we are still checking the auth status, show a loader.
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // If a user is logged in AND they are a homeowner, wrap the content in a ProtectedRoute.
    if (currentUser && currentUser.role === 'homeowner') {
        return (
            <ProtectedRoute role="homeowner">
                <DashboardLayout role="homeowner">
                    {children}
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    // Otherwise, this is a guest. Render the dashboard in guest mode (role={null}).
    return (
        <DashboardLayout role={null}>
            {children}
        </DashboardLayout>
    );
}

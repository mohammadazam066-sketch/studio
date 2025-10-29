
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        if (!loading && !currentUser) {
            router.replace('/auth/login');
        }
    }, [currentUser, loading, router]);


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

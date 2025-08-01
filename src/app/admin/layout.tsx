
'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

function checkIsAdmin(uid: string): boolean {
    const adminUids = process.env.NEXT_PUBLIC_ADMIN_UIDS?.split(',') || [];
    return adminUids.includes(uid);
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is confirmed
    }
    if (!currentUser || !checkIsAdmin(currentUser.id)) {
      // If not loading, and user is not an admin, redirect.
      router.replace('/homeowner/dashboard'); // or a dedicated 403 page
    }
  }, [currentUser, loading, router]);


  if (loading || !currentUser || !checkIsAdmin(currentUser.id)) {
    // Show a loader while checking auth or before redirecting
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is false and user is an admin, render the layout
  return (
    <DashboardLayout role="admin">
        {children}
    </DashboardLayout>
  );
}

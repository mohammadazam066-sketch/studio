
'use client';

import { ProtectedRoute } from "@/components/protected-route";
import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/store";
import type { UserRole } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { UserNav } from "./user-nav";
import { NotificationsMenu } from "./notifications-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // A special role for admin to reuse layouts
  const effectiveRole = role === 'admin' ? 'shop-owner' : role;


  return (
    <ProtectedRoute role={effectiveRole}>
       <SidebarProvider>
        <Sidebar>
            {currentUser && <SidebarNav user={currentUser} />}
        </Sidebar>
        <SidebarInset>
             <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
                <SidebarTrigger className="md:hidden" />
                 <div className="flex items-center gap-4 ml-auto">
                    {currentUser && <NotificationsMenu userId={currentUser.id} />}
                    {currentUser && <UserNav user={currentUser} />}
                </div>
             </header>
            <main className="p-4 sm:p-6">
                {children}
            </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

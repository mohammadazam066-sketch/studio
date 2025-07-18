
'use client';

import { ProtectedRoute } from "@/components/protected-route";
import { SidebarNav } from "@/components/sidebar-nav";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/store";
import { Loader2 } from "lucide-react";


export default function ShopOwnerLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute role="shop-owner">
        <SidebarProvider>
            <Sidebar>
                {currentUser && <SidebarNav user={currentUser} />}
            </Sidebar>
            <SidebarInset>
                 <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2 md:hidden">
                    <SidebarTrigger />
                 </header>
                <main className="p-4 sm:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    </ProtectedRoute>
  );
}

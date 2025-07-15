
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/store.tsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function LayoutSkeleton() {
  return (
    <div className="flex h-screen w-full bg-muted/40">
      <aside className="hidden md:flex flex-col w-56 border-r bg-background">
        <div className="p-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex flex-col gap-2 p-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b md:hidden">
           <Skeleton className="h-8 w-32" />
           <Skeleton className="h-8 w-8 rounded-full" />
        </header>
        <main className="flex-1 p-6">
           <Skeleton className="h-8 w-1/4 mb-4" />
           <Skeleton className="h-32 w-full" />
        </main>
      </div>
    </div>
  );
}

export default function HomeownerLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect runs when loading state changes.
    // We only want to act when loading is finished.
    if (loading) {
      return; // Still loading, do nothing.
    }

    // If loading is finished and there's no user, or the user is not a homeowner, redirect.
    if (!currentUser || currentUser.role !== 'homeowner') {
      router.push('/auth-pages/login?role=homeowner');
    }
  }, [currentUser, loading, router]);
  
  // While loading, or if the user is not the correct role yet, show the skeleton.
  // This prevents a flash of content before the redirect can happen.
  if (loading || !currentUser || currentUser.role !== 'homeowner') {
    return <LayoutSkeleton />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav role="homeowner" />
        </SidebarContent>
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b md:hidden sticky top-0 bg-background z-10">
          <Logo />
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

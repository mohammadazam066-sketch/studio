

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
import { useRouter, usePathname } from 'next/navigation';
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


export default function ShopOwnerLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!currentUser) {
      router.push('/auth-pages/login?role=shop-owner');
      return;
    }
    
    // Allow access to shared pages
    const isSharedPage = ['/updates', '/notifications'].some(path => pathname.startsWith(path));
    
    if (currentUser.role !== 'shop-owner' && !isSharedPage) {
        router.push('/auth-pages/login?role=shop-owner');
    }

  }, [currentUser, loading, router, pathname]);

  if (loading || !currentUser) {
    return <LayoutSkeleton />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav role="shop-owner" />
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

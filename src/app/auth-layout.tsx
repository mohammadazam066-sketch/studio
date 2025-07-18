
'use client';

import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      if (currentUser.role === 'homeowner') {
        router.replace('/homeowner/dashboard');
      } else if (currentUser.role === 'shop-owner') {
        router.replace('/shop-owner/dashboard');
      }
    }
  }, [currentUser, loading, router]);

  if (loading || currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

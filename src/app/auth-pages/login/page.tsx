
'use client';

import { AuthForm } from '@/components/auth-form';
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const role: UserRole = roleParam === 'shop-owner' ? 'shop-owner' : 'homeowner';
  
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      const dashboardUrl = currentUser.role === 'homeowner' ? '/homeowner/dashboard' : '/shop-owner/dashboard';
      router.push(dashboardUrl);
    }
  }, [currentUser, loading, router]);
  
  if (loading || currentUser) {
     return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return <AuthForm mode="login" role={role} />;
}

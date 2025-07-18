
'use client';

import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '@/lib/types';

export function ProtectedRoute({ children, role }: { children: React.ReactNode, role: UserRole }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; 
    }
    if (!currentUser || currentUser.role !== role) {
      router.replace('/auth/login');
    }
  }, [currentUser, loading, router, role]);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

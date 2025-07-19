
'use client';

import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      if (!currentUser.role) {
        console.error("User object is missing role. Logging out.");
        logout();
        router.replace('/auth/login');
        return;
      }
      if (currentUser.role === 'homeowner') {
        router.replace('/homeowner/dashboard');
      } else if (currentUser.role === 'shop-owner') {
        router.replace('/shop-owner/dashboard');
      }
    }
  }, [currentUser, loading, router, logout]);

  // Only show the full-page loading spinner when the auth state is actively loading.
  // This prevents the spinner from showing incorrectly after logout.
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we are done loading but there's a user, they are being redirected.
  // We can show a spinner, but the critical part is that when `loading` is false
  // and `currentUser` is null (after logout), we proceed to render the children.
  if (!loading && currentUser) {
      return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
  }

  // If not loading and no user, show the login/register form.
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

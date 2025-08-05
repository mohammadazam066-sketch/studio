

'use client';

import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If done loading and we find a user, they don't belong on the login/register page.
    // Redirect them to their respective dashboard.
    if (!loading && currentUser) {
      if (currentUser.role === 'homeowner') {
        router.replace('/homeowner/dashboard');
      } else if (currentUser.role === 'shop-owner') {
        router.replace('/shop-owner/dashboard');
      } else if (currentUser.role === 'admin') {
        router.replace('/admin/dashboard');
      }
    }
  }, [currentUser, loading, router]);


  // Show a loading spinner ONLY during the initial auth check.
  // This prevents the loader from reappearing after logout or on normal navigation.
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not loading and no user, show the login/register form.
  // If a user *does* exist, this will be shown briefly before the redirect effect runs,
  // which is fine and avoids a "stuck" loader.
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

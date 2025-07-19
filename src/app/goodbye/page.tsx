
'use client';

import { useEffect } from 'react';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GoodbyePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Use the Next.js router to navigate to the welcome page.
      // This allows the welcome page's logic to handle auth state correctly.
      router.push('/');
    }, 2500); // Redirect after 2.5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4 text-center">
        <div className="mb-6">
            <Logo />
        </div>
        <div className="space-y-4">
            <h1 className="text-2xl font-bold font-headline">You have been logged out.</h1>
            <p className="text-lg text-muted-foreground">Do come back soon!</p>
            <div className="flex items-center justify-center pt-4">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <p className="text-sm text-muted-foreground">Redirecting to welcome page...</p>
            </div>
        </div>
    </div>
  );
}

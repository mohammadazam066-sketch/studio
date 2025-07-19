
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, Store, UserPlus } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
   const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if done loading and a user truly exists.
    if (!loading && currentUser) {
      const destination = currentUser.role === 'homeowner' ? '/homeowner/dashboard' : '/shop-owner/dashboard';
      router.replace(destination);
    }
  }, [currentUser, loading, router]);

  // If we are still performing the initial auth check, show a loader.
  // We no longer show a loader if a currentUser exists, to prevent flashes of it on redirect.
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we are done loading and there's a user, we will be redirected by the useEffect.
  // Returning null prevents the page content from flashing briefly before the redirect.
  if (currentUser) {
      return null;
  }

  // If not loading and no user, show the public welcome page.
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Logo />
         <Button asChild variant="outline">
            <Link href="/auth/login">Login</Link>
          </Button>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <section className="py-12 sm:py-20">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-headline font-bold text-primary tracking-tighter">
              Welcome to TradeFlow
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground">
              Connecting homeowners with trusted local material suppliers and construction professionals.
            </p>
             <p className="mt-2 max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground">
              Find the right materials for your site, post your exact needs with photos, and get competitive local quotes directly in one place—saving your time and money.
            </p>

            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link href="/auth/register">
                  <UserPlus className="mr-2" />
                  Get Started for Free
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <Home className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="font-headline text-xl sm:text-2xl">For Homeowners</CardTitle>
                  <CardDescription>
                    Post your construction material needs with site photos and preferred brands. Receive transparent, competitive quotes from verified local shop owners near you.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <Store className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="font-headline text-xl sm:text-2xl">For Shop Owners</CardTitle>
                  <CardDescription>
                    View real homeowner requirements, send your best quotations, and win local business while growing your customer base effortlessly
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} TradeFlow. All rights reserved.
      </footer>
    </div>
  );
}

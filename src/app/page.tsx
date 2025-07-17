
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, Store, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/store';

export default function HomePage() {
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
        <p className="mt-4 text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Logo />
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <section className="py-12 sm:py-20">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-headline font-bold text-primary tracking-tighter">
              Welcome to Bidarkart
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground">
              Connecting homeowners with trusted local material suppliers and construction professionals.
            </p>
             <p className="mt-2 max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground">
              Find the right materials for your site, post your exact needs with photos, and get competitive local quotes directly in one place—saving your time and money.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <Home className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="font-headline text-xl sm:text-2xl">For Homeowners</CardTitle>
                  <CardDescription>
                    Post your construction material needs with site photos and preferred brands. Receive transparent, competitive quotes from verified local shop owners near you.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/auth-pages/login?role=homeowner">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <Store className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="font-headline text-xl sm:text-2xl">For Shop Owners</CardTitle>
                  <CardDescription>
                    View real homeowner requirements, send your best quotations, and win local business while growing your customer base effortlessly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/auth-pages/login?role=shop-owner">Find Projects</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Bidarkart. All rights reserved.
      </footer>
    </div>
  );
}

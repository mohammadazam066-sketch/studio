
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Home, Store, UserPlus, Download, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import React from 'react';
import {useTranslations} from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Only redirect if done loading and a user truly exists.
    if (!loading && currentUser) {
      const destination = currentUser.role === 'homeowner' ? '/homeowner/dashboard' : '/shop-owner/dashboard';
      router.replace(destination);
    }
  }, [currentUser, loading, router]);

  // If we are performing the initial auth state check, show a loader.
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If a user exists, we will be redirected by the useEffect.
  // Returning null prevents the page content from flashing briefly.
  if (currentUser) {
      return null;
  }

  // If not loading and no user, show the public welcome page.
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Logo />
         <Button asChild variant="outline">
            <Link href="/auth/login">{t('login')}</Link>
          </Button>
      </header>
      <main className="flex-grow">
        <section className="bg-secondary/50 py-12 sm:py-20 text-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold text-primary tracking-tighter">
                  {t('title')}
                </h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground">
                    {t('description')}
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link href="/auth/login">
                      <UserPlus className="mr-2" />
                      {t('getStarted')}
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <a href="https://warehouse.appilix.com/uploads/app-apk-68cd1413ac0a6-1758270483.apk" target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2" />
                      {t('downloadApp')}
                    </a>
                  </Button>
                </div>
            </div>
        </section>

        <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline">{t('howItWorks')}</h2>
                    <p className="mt-2 text-muted-foreground">{t('howItWorksDescription')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                           <Home className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl sm:text-3xl">{t('forHomeowners')}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>{t('homeownerStep1')}</span>
                        </div>
                         <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>{t('homeownerStep2')}</span>
                        </div>
                         <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>{t('homeownerStep3')}</span>
                        </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Store className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl sm:text-3xl">{t('forShopOwners')}</CardTitle>
                      </div>
                    </CardHeader>
                     <CardContent className="space-y-4 text-muted-foreground">
                       <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>{t('shopOwnerStep1')}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>{t('shopOwnerStep2')}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>{t('shopOwnerStep3')}</span>
                        </div>
                    </CardContent>
                  </Card>
                </div>
            </div>
        </section>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t">
        <p>{t('footerRights', {year: new Date().getFullYear()})}</p>
        <div className="mt-2 space-x-4">
             <a href="https://sites.google.com/view/tradeflowkart/home" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{t('terms')}</a>
             <span>&bull;</span>
             <a href="mailto:tradeflow.kart@gmail.com" className="underline hover:text-primary">{t('contact')}</a>
        </div>
      </footer>
    </div>
  );
}

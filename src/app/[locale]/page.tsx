
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Home, Store, User, ArrowRight, Download, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function HomePage() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Logo />
         <Button asChild variant="outline">
            <Link href="/auth/login">Login / Sign Up</Link>
          </Button>
      </header>
      <main className="flex-grow">
        <section className="bg-secondary/50 py-12 sm:py-20 text-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold text-primary tracking-tighter">
                   Welcome to kanstruction
                </h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground">
                    Connecting homeowners with trusted local material suppliers. Find the right materials, post your needs with photos, and get competitive local quotes—all in one place.
                </p>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <Card className="text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Home className="h-8 w-8 text-primary" />
                                <CardTitle className="font-headline text-2xl">Homeowners</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>Browse, create requirements, and explore the app. Sign up only when you're ready to post.</CardDescription>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/homeowner/dashboard">
                                    Continue as Homeowner <ArrowRight className="ml-2" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                     <Card className="text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Store className="h-8 w-8 text-primary" />
                                <CardTitle className="font-headline text-2xl">Shop Owners</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>Log in or create your account to view requirements and submit quotations.</CardDescription>
                        </CardContent>
                        <CardFooter>
                             <Button asChild className="w-full" variant="secondary">
                                <Link href="/auth/login">
                                    Shop Owner Login <ArrowRight className="ml-2" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                 <div className="mt-12">
                     <Button asChild size="lg" variant="outline">
                        <a href="https://warehouse.appilix.com/uploads/app-apk-68ea264f5e254-1760175695.apk" target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2" />
                          Download the App
                        </a>
                      </Button>
                </div>
            </div>
        </section>

        <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline">How It Works</h2>
                    <p className="mt-2 text-muted-foreground">A seamless process for homeowners and shop owners.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                           <Home className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl sm:text-3xl">For Homeowners</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>Post your exact material needs with site photos and brand preferences.</span>
                        </div>
                         <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>Receive transparent, competitive quotes from verified local suppliers near you.</span>
                        </div>
                         <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>Choose the best offer and get your materials delivered, saving time and money.</span>
                        </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Store className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl sm:text-3xl">For Shop Owners</CardTitle>
                      </div>
                    </CardHeader>
                     <CardContent className="space-y-4 text-muted-foreground">
                       <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>Access a steady stream of genuine requirements from homeowners in your area.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>Send your best quotations directly to customers and win new business.</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                            <span>Grow your customer base and increase sales with zero marketing effort.</span>
                        </div>
                    </CardContent>
                  </Card>
                </div>
            </div>
        </section>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t">
        <p>© {new Date().getFullYear()} kanstruction. All rights reserved.</p>
        <div className="mt-2 space-x-4">
             <a href="https://sites.google.com/view/tradeflowkart/home" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Terms & Privacy</a>
             <span>&bull;</span>
             <a href="mailto:tradeflow.kart@gmail.com" className="underline hover:text-primary">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}

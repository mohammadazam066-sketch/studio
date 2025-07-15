import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, Store } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Logo />
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <section className="py-20 sm:py-32">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold text-primary tracking-tighter">
              Welcome to TradeFlow
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              The seamless connection between homeowners and skilled professionals. Find the right person for your job, or find your next project.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="text-left shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <Home className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="font-headline">For Homeowners</CardTitle>
                  <CardDescription>
                    Post your home improvement needs and receive competitive quotes from trusted local professionals.
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
                  <CardTitle className="font-headline">For Shop Owners</CardTitle>
                  <CardDescription>
                    Browse a live feed of homeowner requirements in your area. Find projects and grow your business.
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
        © {new Date().getFullYear()} TradeFlow. All rights reserved.
      </footer>
    </div>
  );
}

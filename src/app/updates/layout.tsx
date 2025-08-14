
'use client';

import { useAuth } from '@/lib/store';
import { Logo } from '@/components/logo';

// This layout ensures that pages within the /updates directory are publicly accessible
// and not wrapped by any authentication-requiring layouts.
export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  
  if (loading) {
     return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
     <div className="flex flex-col min-h-screen bg-secondary">
        <header className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-sm shadow-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <Logo />
            </div>
        </header>
        <main className="flex-1">
            <div className="container mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                 {children}
            </div>
        </main>
        <footer className="py-6 text-center text-muted-foreground text-sm bg-background">
            <p>© {new Date().getFullYear()} TradeFlow. All rights reserved.</p>
        </footer>
    </div>
  );
}

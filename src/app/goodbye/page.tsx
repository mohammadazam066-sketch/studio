
'use client';

import { Logo } from '@/components/logo';
import { HardHat, Wrench, Hammer } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GoodbyePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-accent p-4 text-center text-accent-foreground overflow-hidden relative">
        <div className="z-10 flex flex-col items-center justify-center">
            <div className="mb-6 bg-background/20 backdrop-blur-sm p-4 rounded-full">
                <Logo className="text-white" />
            </div>
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Thank You, Visit Again!</h1>
                <p className="text-lg text-accent-foreground/80">You have been successfully logged out.</p>
                <div className="pt-6">
                    <Button asChild variant="secondary">
                        <Link href="/auth/login">
                           Log Back In
                        </Link>
                    </Button>
                </div>
            </div>
        </div>

        {/* Animated Icons */}
        <div className="absolute top-0 left-0 w-full h-full z-0">
            <HardHat className="absolute top-[10%] left-[15%] h-16 w-16 text-white/10 animate-pulse" style={{ animationDelay: '0s' }} />
            <Wrench className="absolute top-[20%] right-[10%] h-20 w-20 text-white/10 animate-spin-slow" style={{ animationDelay: '0.5s' }} />
            <Hammer className="absolute bottom-[15%] left-[25%] h-12 w-12 text-white/10 animate-bounce" style={{ animationDuration: '4s' }} />
            <HardHat className="absolute bottom-[25%] right-[20%] h-24 w-24 text-white/10 animate-pulse" style={{ animationDelay: '1s' }} />
            <Wrench className="absolute top-[60%] left-[5%] h-16 w-16 text-white/10 animate-spin-slow" style={{ animationDirection: 'reverse', animationDelay: '0.2s' }} />
             <Hammer className="absolute top-[70%] right-[40%] h-16 w-16 text-white/10 animate-bounce" style={{ animationDuration: '5s' }} />
        </div>

        <style jsx>{`
            @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
                animation: spin-slow 15s linear infinite;
            }
        `}</style>
    </div>
  );
}

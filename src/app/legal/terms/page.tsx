
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-5xl flex flex-col h-[90vh]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
                <CardTitle className="font-headline text-2xl">Terms & Privacy Policy</CardTitle>
                <CardDescription>
                    Please review our policies before using the service.
                </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href="/auth/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <iframe
            src="https://sites.google.com/view/tradeflowkart/kanstruction-privacy-policy?embedded=true"
            className="w-full h-full border-0"
            allowFullScreen
          >
            Loading...
          </iframe>
        </CardContent>
      </Card>
    </div>
  );
}

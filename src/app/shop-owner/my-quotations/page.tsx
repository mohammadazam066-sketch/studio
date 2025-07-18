

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuotationsByShopOwner, getRequirementById } from '@/lib/store';
import type { Quotation, Requirement } from '@/lib/types';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { FileText, Calendar, Edit, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type QuotationWithRequirement = Quotation & { requirement: Requirement | undefined };

function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

function QuotationCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-1/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}


export default function MyQuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationWithRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    // Note: Since auth is removed, this page would ideally filter quotes
    // based on an identifier stored in localStorage. For now, it's empty.
    // To see quotes, you'd need to re-implement a filter.
    const userQuotations = await getQuotationsByShopOwner("public_user");

    const quotationsWithReqs = await Promise.all(
        userQuotations.map(async (quote) => {
            const requirement = await getRequirementById(quote.requirementId);
            return { ...quote, requirement };
        })
    );

    setQuotations(quotationsWithReqs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  if (loading) {
     return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Sent Quotations</h1>
                <p className="text-muted-foreground">View and manage all the quotes you have submitted.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                {[...Array(2)].map((_, i) => <QuotationCardSkeleton key={i} />)}
            </div>
        </div>
     )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Sent Quotations</h1>
        <p className="text-muted-foreground">View and manage all the quotes you have submitted.</p>
      </div>

      {quotations.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {quotations.map(quote => (
            <Card key={quote.id}>
              <CardHeader>
                <CardTitle className="text-xl">{quote.requirement?.title ?? 'Requirement Details Unavailable'}</CardTitle>
                <CardDescription>For: {quote.requirement?.homeownerName}</CardDescription>
                <div className="flex items-center text-lg font-semibold text-primary pt-2">
                    <span className="font-sans mr-1">Rs</span>
                    {quote.amount.toFixed(2)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-start gap-3 text-sm">
                    <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground line-clamp-2">{quote.terms}</p>
                  </div>
                   <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground">Expected by: {formatDate(quote.deliveryDate)}</p>
                  </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                 <Button asChild variant="outline" className="w-full">
                    <Link href={`/shop-owner/requirements/${quote.requirementId}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Requirement
                    </Link>
                  </Button>
                <Button asChild className="w-full">
                  <Link href={`/shop-owner/my-quotations/edit/${quote.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Quotation
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-10 sm:py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">No quotations sent yet</h2>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Find a requirement on your dashboard and send your first quote.</p>
           <Button asChild className="mt-4">
            <Link href="/shop-owner/dashboard">Browse Requirements</Link>
          </Button>
        </div>
      )}
    </div>
  );
}



'use client';

import { getRequirementById, getQuotationForRequirementByShop, useAuth } from '@/lib/store';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Wrench, Droplets, Tally5, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import type { Requirement, Quotation } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { QuotationForm } from '@/components/quotation-form';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

function PageSkeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-8 w-3/4" />
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 pt-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-28" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Skeleton className="h-40 w-full aspect-video rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-1">
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/2" />
            </CardHeader>
             <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RequirementDetailPageForShop() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { currentUser } = useAuth();
  
  const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);
  const [existingQuotation, setExistingQuotation] = useState<Quotation | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (typeof id !== 'string' || !currentUser) return;
    setLoading(true);

    const reqData = await getRequirementById(id);
    if (reqData) {
      setRequirement(reqData);
      const quoteData = await getQuotationForRequirementByShop(id, currentUser.id);
      setExistingQuotation(quoteData);
    } else {
        router.push('/shop-owner/dashboard');
    }
    
    setLoading(false);
  }, [id, currentUser, router]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  if (loading) {
    return <PageSkeleton />;
  }

  if (!requirement) {
    return <div>Requirement not found.</div>;
  }

  const isPurchased = requirement.status === 'Purchased';
  const hasQuoted = !!existingQuotation;


  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Requirement Details */}
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                    <Badge variant="secondary" className="mb-2">{requirement.category}</Badge>
                    <CardTitle className="font-headline text-2xl">{requirement.title}</CardTitle>
                    </div>
                    <div className={`text-sm font-medium flex items-center gap-2 ${isPurchased ? 'text-accent' : 'text-primary'}`}>
                        <span className={`h-2 w-2 rounded-full ${isPurchased ? 'bg-accent' : 'bg-primary'}`}></span>
                        {requirement.status}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {requirement.location}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted on {formatDate(requirement.createdAt)}</div>
                    <div className="flex items-center gap-1.5"><Wrench className="w-4 h-4" /> By {requirement.homeownerName}</div>
                </div>
                </CardHeader>
                <CardContent>
                    <p className="mb-6">{requirement.description}</p>
                    
                    {requirement.brands && requirement.brands.length > 0 && (
                        <div className="mb-6">
                            <Separator className="my-4" />
                            <h4 className="text-base font-semibold mb-3">Cement Details</h4>
                            <div className="space-y-2">
                                {requirement.brands.map(brand => (
                                    <div key={brand.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                        <span className="text-muted-foreground">{brand.id}</span>
                                    </div>
                                ))}
                            </div>
                            {requirement.flexibleBrand && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">User is open to alternative brands.</p>
                            )}
                            <Separator className="my-4" />
                        </div>
                    )}
                    
                    {requirement.steelDetails && requirement.steelDetails.length > 0 && (
                        <div className="mb-6">
                            <Separator className="my-4" />
                            <h4 className="text-base font-semibold mb-3">Steel (TMT Bar) Details</h4>
                            <div className="space-y-2">
                                {requirement.steelDetails.map(detail => (
                                    <div key={detail.size} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                        <span className="text-muted-foreground">{detail.size}mm</span>
                                        <span className="font-medium">{detail.quantity} rods</span>
                                    </div>
                                ))}
                            </div>
                            {requirement.steelBrands && requirement.steelBrands.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-2">Preferred Brands: {requirement.steelBrands.join(', ')}</p>
                            )}
                            {requirement.flexibleSteelBrand && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">User is open to alternative brands for steel.</p>
                            )}
                            <Separator className="my-4" />
                        </div>
                    )}

                    {requirement.electricalDetails && requirement.electricalDetails.length > 0 && (
                        <div className="mb-6">
                            <Separator className="my-4" />
                            <h4 className="text-base font-semibold mb-3">Electrical Details</h4>
                            <div className="space-y-2">
                                {requirement.electricalDetails.map(detail => (
                                    <div key={detail.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                        <span className="text-muted-foreground">{detail.id}</span>
                                        <span className="font-medium">{detail.quantity} pcs</span>
                                    </div>
                                ))}
                            </div>
                            {requirement.electricalBrands && requirement.electricalBrands.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-2">Preferred Brands: {requirement.electricalBrands.join(', ')}</p>
                            )}
                            {requirement.flexibleElectricalBrand && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">User is open to alternative brands for electrical items.</p>
                            )}
                            <Separator className="my-4" />
                        </div>
                    )}

                    {requirement.photos.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {requirement.photos.map((photo, index) => (
                            <div key={index} className="relative aspect-video">
                                <Image 
                                    src={photo} 
                                    alt={`${requirement.title} photo ${index + 1}`} 
                                    fill
                                    style={{objectFit: 'cover'}}
                                    className="rounded-lg"
                                    data-ai-hint="construction site" 
                                />
                            </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Quotation Form */}
        <div className="lg:col-span-1 lg:sticky lg:top-8">
            {isPurchased ? (
                <Card className="bg-muted">
                    <CardHeader>
                        <CardTitle>Requirement Closed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This requirement has been marked as purchased by the homeowner and is no longer accepting quotations.</p>
                    </CardContent>
                </Card>
            ) : hasQuoted ? (
                 <Card className="bg-secondary">
                    <CardHeader>
                        <CardTitle>Quotation Submitted</CardTitle>
                        <CardDescription>You have already provided a quote for this requirement. You can edit it from the "My Quotations" page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button asChild className="w-full">
                            <Link href="/shop-owner/my-quotations">View My Quotations</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <QuotationForm requirement={requirement} />
            )}
        </div>
    </div>
  );
}

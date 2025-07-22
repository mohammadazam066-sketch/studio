
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useAuth, getQuotationsByShopOwner, getRequirementById } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import type { Requirement, Quotation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, FileText, User } from "lucide-react";
import Image from 'next/image';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

type QuotationWithRequirement = Quotation & {
    requirement?: Requirement;
}

function QuotationListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div className="space-y-2">
                             <Skeleton className="h-6 w-3/4" />
                             <Skeleton className="h-4 w-1/2" />
                           </div>
                           <Skeleton className="h-6 w-20" />
                        </div>
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6 mt-2" />
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                         <Skeleton className="h-8 w-24" />
                         <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}


export default function MyQuotationsPage() {
    const { currentUser } = useAuth();
    const [quotations, setQuotations] = useState<QuotationWithRequirement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQuotations = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const userQuotations = await getQuotationsByShopOwner(currentUser.id);
        
        const quotationsWithRequirements = await Promise.all(
            userQuotations.map(async (quote) => {
                const requirement = await getRequirementById(quote.requirementId);
                return { ...quote, requirement };
            })
        );
        
        setQuotations(quotationsWithRequirements);
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">My Quotations</h1>
                <p className="text-muted-foreground">A history of all the quotations you have submitted.</p>
            </div>
            
            <div>
                 {loading ? (
                    <QuotationListSkeleton />
                 ) : quotations.length > 0 ? (
                    <div className="space-y-4">
                        {quotations.map(quote => {
                            const isPurchased = quote.requirement?.status === 'Purchased';
                            return (
                            <Card key={quote.id}>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                        <div>
                                            <CardTitle className="text-lg">Quote for: {quote.requirement?.title || 'N/A'}</CardTitle>
                                            <CardDescription>
                                                For {quote.requirement?.homeownerName} &bull; Submitted on {formatDate(quote.createdAt)}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={isPurchased ? 'default' : 'secondary'} className={isPurchased ? 'bg-accent text-accent-foreground' : ''}>
                                            {quote.requirement?.status || 'Status Unknown'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                   <div className="flex items-center text-lg font-semibold text-primary">
                                        <span className="font-sans mr-1.5">Rs</span>
                                        {quote.amount.toFixed(2)}
                                    </div>
                                    <div className="flex items-start gap-3 text-sm">
                                        <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                                        <p className="text-muted-foreground">{quote.terms}</p>
                                    </div>
                                    {quote.requirement?.homeownerId && (
                                        <div className="pt-2">
                                            <Button asChild variant="link" className="p-0 h-auto">
                                                <Link href={`/shop-owner/homeowner-profile/${quote.requirement.homeownerId}`}>
                                                    <User className="mr-2 h-4 w-4" />
                                                    View {isPurchased ? `${quote.requirement.homeownerName}'s Contact` : "Homeowner's Profile"}
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    {!isPurchased && (
                                         <Button asChild variant="outline" size="sm">
                                            <Link href={`/shop-owner/my-quotations/edit/${quote.id}`}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Quote
                                            </Link>
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )})}
                    </div>
                ) : (
                     <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <div className="mx-auto w-24 h-24 mb-4">
                            <Image src="https://placehold.co/100x100.png" width={100} height={100} alt="No quotations" data-ai-hint="empty box document" className="rounded-full" />
                        </div>
                        <h3 className="text-lg font-medium">No quotations submitted</h3>
                        <p className="text-muted-foreground mt-1">Visit the dashboard to find requirements to quote on.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

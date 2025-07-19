
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useAuth, getOpenRequirements, getQuotationsByShopOwner } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import type { Requirement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

function RequirementListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
                    <CardFooter className="flex justify-end">
                         <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export default function ShopOwnerOpenRequirementsPage() {
    const { currentUser } = useAuth();
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!currentUser?.id) return;
        setLoading(true);

        const [openReqs, userQuotations] = await Promise.all([
            getOpenRequirements(),
            getQuotationsByShopOwner(currentUser.id)
        ]);

        const quotedRequirementIds = new Set(userQuotations.map(q => q.requirementId));
        const requirementsToQuote = openReqs.filter(req => !quotedRequirementIds.has(req.id));
        
        setRequirements(requirementsToQuote);
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Open Requirements</h1>
                <p className="text-muted-foreground">All available homeowner requirements that you can quote on.</p>
            </div>
            
            <div>
                 {loading ? (
                    <RequirementListSkeleton />
                 ) : requirements.length > 0 ? (
                    <div className="space-y-4">
                        {requirements.map(req => (
                            <Card key={req.id}>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                        <div>
                                            <Badge variant="secondary" className="mb-1">{req.category}</Badge>
                                            <CardTitle className="text-lg">{req.title}</CardTitle>
                                            <CardDescription>By {req.homeownerName} &bull; Posted on {formatDate(req.createdAt)}</CardDescription>
                                        </div>
                                         <p className="text-sm text-muted-foreground font-medium">{req.location}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground line-clamp-2">{req.description}</p>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <Button asChild>
                                        <Link href={`/shop-owner/requirements/${req.id}`}>
                                            View & Quote
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                         <div className="mx-auto w-24 h-24 mb-4">
                            <Image src="https://placehold.co/100x100.png" width={100} height={100} alt="All caught up" data-ai-hint="celebration happy checklist" className="rounded-full" />
                        </div>
                        <h3 className="text-lg font-medium">All caught up!</h3>
                        <p className="text-muted-foreground mt-1">There are no new requirements to quote right now. Check back later!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

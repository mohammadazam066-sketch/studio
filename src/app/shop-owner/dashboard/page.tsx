
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Eye, FileText, CheckCircle, Clock, Droplets, Tally5 } from "lucide-react";
import { useAuth, getOpenRequirements, getQuotationsByShopOwner, getRequirementById } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import type { Requirement, Quotation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { MaterialCategoryGrid } from "@/components/material-category-grid";

function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

function RequirementListSkeleton() {
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
                    <CardFooter className="flex justify-end">
                         <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

type QuotationWithRequirement = Quotation & {
    requirement?: Requirement;
}

export default function ShopOwnerDashboard() {
    const { currentUser } = useAuth();
    const [openRequirements, setOpenRequirements] = useState<Requirement[]>([]);
    const [myQuotations, setMyQuotations] = useState<QuotationWithRequirement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!currentUser?.id) return;
        setLoading(true);
        const [openReqs, userQuotations] = await Promise.all([
            getOpenRequirements(),
            getQuotationsByShopOwner(currentUser.id)
        ]);
        
        const quotationsWithRequirements = await Promise.all(
            userQuotations.map(async (quote) => {
                const requirement = await getRequirementById(quote.requirementId);
                return { ...quote, requirement };
            })
        );

        setOpenRequirements(openReqs);
        setMyQuotations(quotationsWithRequirements);
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const submittedQuotesCount = myQuotations.length;
    // An accepted quote is one of yours where the associated requirement is 'Purchased'
    const acceptedQuotesCount = myQuotations.filter(q => q.requirement?.status === 'Purchased').length;
    const pendingReviewCount = submittedQuotesCount - acceptedQuotesCount;
    
    // Of the open requirements, filter out those the shop owner has already quoted on
    const quotedRequirementIds = new Set(myQuotations.map(q => q.requirementId));
    const openRequirementsToQuote = openRequirements.filter(
        req => !quotedRequirementIds.has(req.id)
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Shop Owner Dashboard</h1>
                <p className="text-muted-foreground">Find new business opportunities and manage your quotations.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Link href="/shop-owner/requirements" className="block">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Open Requirements</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{openRequirementsToQuote.length}</div>
                            <p className="text-xs text-muted-foreground">Opportunities available to quote</p>
                        </CardContent>
                    </Card>
                 </Link>
                <Link href="/shop-owner/my-quotations" className="block">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Quotes Submitted</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{submittedQuotesCount}</div>
                            <p className="text-xs text-muted-foreground">Quotations you have sent</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/shop-owner/my-quotations" className="block">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Accepted Quotes</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{acceptedQuotesCount}</div>
                             <p className="text-xs text-muted-foreground">Your quotes that were purchased</p>
                        </CardContent>
                    </Card>
                </Link>
                 <Link href="/shop-owner/my-quotations" className="block">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingReviewCount}</div>
                            <p className="text-xs text-muted-foreground">Quotes awaiting homeowner decision</p>
                        </CardContent>
                    </Card>
                 </Link>
            </div>
            
             <div className="space-y-4">
                <h2 className="text-xl font-bold font-headline">Browse by Category</h2>
                {currentUser && <MaterialCategoryGrid role={currentUser.role} />}
            </div>
            
            <div>
                 <h2 className="text-xl font-bold font-headline mb-4">Latest Available Requirements</h2>
                 {loading ? (
                    <RequirementListSkeleton />
                 ) : openRequirementsToQuote.length > 0 ? (
                    <div className="space-y-4">
                        {openRequirementsToQuote.slice(0, 5).map(req => ( // Show latest 5
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
                                    {req.brands && req.brands.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h4 className="text-sm font-semibold mb-2">Brand Details:</h4>
                                            <ul className="space-y-1">
                                                {req.brands.map(brand => (
                                                    <li key={brand.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Droplets className="w-4 h-4 text-primary/70" />
                                                        <span>{brand.id}: <strong>{brand.quantity || 'N/A'} bags</strong></span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                     {req.steelDetails && req.steelDetails.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h4 className="text-sm font-semibold mb-2">Steel Details:</h4>
                                            <ul className="space-y-1">
                                                {req.steelDetails.map(detail => (
                                                    <li key={detail.size} className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Tally5 className="w-4 h-4 text-primary/70" />
                                                        <span>{detail.size}mm: <strong>{detail.quantity || 'N/A'} units</strong></span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
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

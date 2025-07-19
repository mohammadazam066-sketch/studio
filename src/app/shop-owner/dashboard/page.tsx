
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Eye, FileText, CheckCircle, Clock } from "lucide-react";
import { useAuth, getAllRequirements, getQuotationsByShopOwner } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import type { Requirement, Quotation } from "@/lib/types";
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


export default function ShopOwnerDashboard() {
    const { currentUser } = useAuth();
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [myQuotations, setMyQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!currentUser?.id) return; // Guard against running before user is loaded
        setLoading(true);
        const allRequirements = await getAllRequirements();
        const userQuotations = await getQuotationsByShopOwner(currentUser.id);

        setRequirements(allRequirements);
        setMyQuotations(userQuotations);
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const submittedQuotesCount = myQuotations.length;
    // This is a simplified calculation. A more complex app might check if the *winning* quote was this user's.
    const acceptedQuotesCount = requirements.filter(r => r.status === 'Purchased' && myQuotations.some(q => q.requirementId === r.id)).length;
    
    // Filter to only requirements with 'Open' status
    const openRequirements = requirements.filter(r => r.status === 'Open');
    
    // Of the open requirements, filter out those the shop owner has already quoted on
    const openRequirementsToQuote = openRequirements.filter(
        req => !myQuotations.some(quote => quote.requirementId === req.id)
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Shop Owner Dashboard</h1>
                <p className="text-muted-foreground">Find new business opportunities and manage your quotations.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Requirements</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openRequirementsToQuote.length}</div>
                        <p className="text-xs text-muted-foreground">Opportunities available to quote</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quotes Submitted</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{submittedQuotesCount}</div>
                        <p className="text-xs text-muted-foreground">Quotations you have sent</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accepted Quotes</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{acceptedQuotesCount}</div>
                         <p className="text-xs text-muted-foreground">Your quotes that were purchased</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{submittedQuotesCount - acceptedQuotesCount}</div>
                        <p className="text-xs text-muted-foreground">Quotes awaiting homeowner decision</p>
                    </CardContent>
                </Card>
            </div>
            
            <div>
                 <h2 className="text-xl font-bold font-headline mb-4">Available Requirements</h2>
                 {loading ? (
                    <RequirementListSkeleton />
                 ) : openRequirementsToQuote.length > 0 ? (
                    <div className="space-y-4">
                        {openRequirementsToQuote.map(req => (
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


'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { PlusCircle, Eye, CheckSquare, List } from "lucide-react";
import { useAuth, getRequirementsByHomeowner, getQuotationsForRequirement } from "@/lib/store";
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
                    <CardFooter className="flex justify-between">
                         <Skeleton className="h-5 w-24" />
                         <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}


export default function HomeownerDashboard() {
    const { currentUser } = useAuth();
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [quotationCounts, setQuotationCounts] = useState<{[key: string]: number}>({});
    const [loading, setLoading] = useState(true);

    const fetchRequirements = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const userRequirements = await getRequirementsByHomeowner(currentUser.id);
        setRequirements(userRequirements);
        
        // Fetch quotation counts for each requirement
        const counts: {[key: string]: number} = {};
        for (const req of userRequirements) {
            const quotes = await getQuotationsForRequirement(req.id);
            counts[req.id] = quotes.length;
        }
        setQuotationCounts(counts);

        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchRequirements();
    }, [fetchRequirements]);
    
    const openRequirementsCount = requirements.filter(r => r.status === 'Open').length;
    const purchasedRequirementsCount = requirements.filter(r => r.status === 'Purchased').length;


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline tracking-tight">Homeowner Dashboard</h1>
                    <p className="text-muted-foreground">Manage your material requirements and view quotations.</p>
                </div>
                <Button asChild>
                    <Link href="/homeowner/requirements/new">
                        <PlusCircle className="mr-2" />
                        Post a New Requirement
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{requirements.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openRequirementsCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Purchased</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{purchasedRequirementsCount}</div>
                    </CardContent>
                </Card>
            </div>
            
            <div>
                 <h2 className="text-xl font-bold font-headline mb-4">Your Requirements</h2>
                 {loading ? (
                    <RequirementListSkeleton />
                 ) : requirements.length > 0 ? (
                    <div className="space-y-4">
                        {requirements.map(req => (
                            <Card key={req.id}>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                        <div>
                                            <CardTitle className="text-lg">{req.title}</CardTitle>
                                            <CardDescription>Posted on {formatDate(req.createdAt)} &bull; {req.location}</CardDescription>
                                        </div>
                                         <Badge variant={req.status === 'Purchased' ? 'default' : 'secondary'} className={req.status === 'Purchased' ? 'bg-accent text-accent-foreground' : ''}>
                                            {req.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground line-clamp-2">{req.description}</p>
                                </CardContent>
                                <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                     <div className="text-sm text-primary font-medium">
                                        {quotationCounts[req.id] || 0} Quotation(s) Received
                                    </div>
                                    <Button asChild>
                                        <Link href={`/homeowner/requirements/${req.id}`}>
                                            View Details & Quotes
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <div className="mx-auto w-24 h-24 mb-4">
                            <Image src="https://placehold.co/100x100.png" width={100} height={100} alt="No requirements" data-ai-hint="empty box document" className="rounded-full" />
                        </div>
                        <h3 className="text-lg font-medium">No requirements yet</h3>
                        <p className="text-muted-foreground mt-1">Click the button above to post your first material requirement.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

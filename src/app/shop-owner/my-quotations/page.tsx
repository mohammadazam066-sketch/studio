

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useAuth, getQuotationsByShopOwner } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import type { Requirement, Quotation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, FileText, User, CheckCircle, XCircle } from "lucide-react";
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
    const searchParams = useSearchParams();
    const router = useRouter();
    const filter = searchParams.get('filter') || 'all';

    const [allQuotations, setAllQuotations] = useState<QuotationWithRequirement[]>([]);
    const [filteredQuotations, setFilteredQuotations] = useState<QuotationWithRequirement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQuotations = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const userQuotations = await getQuotationsByShopOwner(currentUser.id);
        
        // Requirement data is already attached in getQuotationsByShopOwner
        setAllQuotations(userQuotations);
        setLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations]);

    useEffect(() => {
        let quotes = allQuotations;
        if (filter === 'accepted') {
            quotes = allQuotations.filter(q => q.requirement?.status === 'Purchased' && q.requirement.quotationId === q.id);
        } else if (filter === 'pending') {
            quotes = allQuotations.filter(q => q.requirement?.status !== 'Purchased');
        } else if (filter === 'not-selected') {
            quotes = allQuotations.filter(q => q.requirement?.status === 'Purchased' && q.requirement.quotationId !== q.id);
        }
        setFilteredQuotations(quotes);
    }, [filter, allQuotations]);

    const getStatus = (quote: QuotationWithRequirement): { text: string; variant: "default" | "secondary" | "destructive"; icon?: React.ElementType } => {
        const isPurchased = quote.requirement?.status === 'Purchased';
        
        if (isPurchased) {
            if (quote.requirement?.quotationId === quote.id) {
                return { text: "Accepted", variant: 'default', icon: CheckCircle };
            } else {
                return { text: "Not Selected", variant: 'destructive', icon: XCircle };
            }
        }
        return { text: "Pending Review", variant: 'secondary' };
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">My Quotations</h1>
                <p className="text-muted-foreground">A history of all the quotations you have submitted.</p>
            </div>

            <Tabs defaultValue={filter} onValueChange={(value) => router.push(`/shop-owner/my-quotations?filter=${value}`)}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="accepted">Accepted</TabsTrigger>
                    <TabsTrigger value="not-selected">Not Selected</TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div>
                 {loading ? (
                    <QuotationListSkeleton />
                 ) : filteredQuotations.length > 0 ? (
                    <div className="space-y-4">
                        {filteredQuotations.map(quote => {
                            const status = getStatus(quote);
                             const isEditable = quote.requirement?.status !== 'Purchased';

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
                                        <Badge variant={status.variant} className={status.variant === 'default' ? 'bg-accent text-accent-foreground' : ''}>
                                            {status.icon && <status.icon className="mr-1.5 h-3.5 w-3.5" />}
                                            {status.text}
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
                                    {quote.requirement?.homeownerId && status.text === 'Accepted' && (
                                        <div className="pt-2">
                                            <Button asChild variant="link" className="p-0 h-auto">
                                                <Link href={`/shop-owner/homeowner-profile/${quote.requirement.homeownerId}`}>
                                                    <User className="mr-2 h-4 w-4" />
                                                    View {quote.requirement.homeownerName}'s Contact
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    {isEditable && (
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
                        <h3 className="text-lg font-medium">No quotations found</h3>
                        <p className="text-muted-foreground mt-1">
                            {filter === 'all'
                                ? "You haven't submitted any quotations yet."
                                : `You have no ${filter.replace('-', ' ')} quotations.`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

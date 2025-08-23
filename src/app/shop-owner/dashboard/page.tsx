

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Eye, FileText, CheckCircle, Clock, Droplets, Tally5, Newspaper, Star } from "lucide-react";
import { useAuth, getOpenRequirements, getQuotationsByShopOwner, getReviewsByShopOwner } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import type { Requirement, QuotationWithRequirement, Review } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { MaterialCategoryGrid } from "@/components/material-category-grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";

function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

const locations = ["Bidar", "Kalaburagi", "Humnabad", "Basavakalyan", "Zaheerabad"];

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
    const [openRequirementsToQuote, setOpenRequirementsToQuote] = useState<Requirement[]>([]);
    const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([]);
    const [myQuotations, setMyQuotations] = useState<QuotationWithRequirement[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationFilter, setLocationFilter] = useState('all');

    const fetchData = useCallback(async () => {
        if (!currentUser?.id) return;
        setLoading(true);

        try {
            const [openReqs, userQuotations, userReviews] = await Promise.all([
                getOpenRequirements(),
                getQuotationsByShopOwner(currentUser.id),
                getReviewsByShopOwner(currentUser.id),
            ]);
            
            // Filter out requirements the shop owner has already quoted on
            const quotedRequirementIds = new Set(userQuotations.map(q => q.requirementId));
            const availableReqs = openReqs.filter(
                req => !quotedRequirementIds.has(req.id)
            );

            setOpenRequirementsToQuote(availableReqs);
            setMyQuotations(userQuotations);
            setReviews(userReviews);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }

    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (locationFilter === 'all') {
            setFilteredRequirements(openRequirementsToQuote);
        } else {
            setFilteredRequirements(openRequirementsToQuote.filter(req => req.location === locationFilter));
        }
    }, [locationFilter, openRequirementsToQuote]);
    
    const submittedQuotesCount = myQuotations.length;
    // An accepted quote is one of yours where the associated requirement is 'Purchased'
    const acceptedQuotesCount = myQuotations.filter(q => q.requirement?.status === 'Purchased').length;
    const pendingReviewCount = submittedQuotesCount - acceptedQuotesCount;
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Shop Owner Dashboard</h1>
                <p className="text-muted-foreground">Find new business opportunities and manage your quotations.</p>
            </div>

             <Card>
                <div className="p-4 sm:p-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base sm:text-xl">Community Updates</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Latest posts and insights from the community.</CardDescription>
                    </div>
                     <Button asChild size="sm">
                        <Link href="/updates">
                            <Newspaper className="mr-2 h-4 w-4" />
                            View
                        </Link>
                    </Button>
                </div>
            </Card>

            <Separator />

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
                <Link href="/shop-owner/my-quotations?filter=all" className="block">
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
                <Link href="/shop-owner/my-quotations?filter=accepted" className="block">
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
                 <Link href="/shop-owner/my-quotations?filter=pending" className="block">
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
            
             <Card>
                <CardHeader>
                    <CardTitle>Recent Customer Reviews</CardTitle>
                    <CardDescription>Latest feedback from your customers.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.slice(0, 3).map(review => (
                                <div key={review.id} className="flex gap-4">
                                    <Avatar>
                                        {review.customerPhotoURL && <AvatarImage src={review.customerPhotoURL} alt={review.customerName} />}
                                        <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm">{review.customerName}</p>
                                             <p className="text-xs text-muted-foreground">{formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true })}</p>
                                        </div>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                                    </div>
                                </div>
                            ))}
                             {reviews.length > 3 && (
                                <Button asChild variant="secondary" size="sm" className="w-full">
                                    <Link href="/shop-owner/profile">View All {reviews.length} Reviews</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">You have not received any reviews yet.</p>
                    )}
                </CardContent>
            </Card>

             <div className="space-y-4">
                <h2 className="text-xl font-bold font-headline">Browse by Category</h2>
                {currentUser && <MaterialCategoryGrid role={currentUser.role} />}
            </div>
            
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-headline">Latest Available Requirements</h2>
                     <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map(loc => (
                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 {loading ? (
                    <RequirementListSkeleton />
                 ) : filteredRequirements.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRequirements.slice(0, 5).map(req => ( // Show latest 5
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
                                            <h4 className="text-sm font-semibold mb-2">Cement Details:</h4>
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
                                                        <span>{detail.size}mm: <strong>{detail.quantity || 'NA'} rods</strong></span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {req.steelBrands && req.steelBrands.length > 0 && (
                                                <p className="text-xs text-muted-foreground mt-2">Preferred Brands: {req.steelBrands.join(', ')}</p>
                                            )}
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
                        <p className="text-muted-foreground mt-1">
                            {locationFilter === 'all'
                                ? "There are no new requirements to quote right now."
                                : `No new requirements found for ${locationFilter}.`}
                             Check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

    
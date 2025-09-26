

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { PlusCircle, Eye, CheckSquare, List, Droplets, Tally5, Edit, Newspaper, Zap } from "lucide-react";
import { useAuth, getRequirementsByHomeowner, getQuotationsForRequirement } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import type { Requirement, Quotation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { MaterialCategoryGrid } from "@/components/material-category-grid";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GettingStartedGuide } from "@/components/getting-started-guide";


function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

type RequirementWithQuoteCount = Requirement & {
    quoteCount: number;
};

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
                    <CardFooter className="flex justify-between">
                         <Skeleton className="h-5 w-24" />
                         <div className="flex gap-2">
                            <Skeleton className="h-10 w-24" />
                         </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}


export default function HomeownerDashboard() {
    const { currentUser } = useAuth();
    const [requirements, setRequirements] = useState<RequirementWithQuoteCount[]>([]);
    const [displayRequirements, setDisplayRequirements] = useState<RequirementWithQuoteCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationFilter, setLocationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Purchased'>('all');


    const fetchRequirements = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const userRequirements = await getRequirementsByHomeowner(currentUser.id);
            
            const requirementsWithCounts = await Promise.all(
                userRequirements.map(async (req) => {
                    const quotes = await getQuotationsForRequirement(req.id);
                    return { ...req, quoteCount: quotes.length };
                })
            );
            
            setRequirements(requirementsWithCounts);

        } catch (error) {
            console.error("Failed to fetch requirements:", error);
            // Optionally, show a toast or error message to the user
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchRequirements();
    }, [fetchRequirements]);
    
    useEffect(() => {
        let filtered = requirements;

        if (locationFilter !== 'all') {
            filtered = filtered.filter(req => req.location === locationFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(req => req.status === statusFilter);
        }
        
        setDisplayRequirements(filtered);
    }, [locationFilter, statusFilter, requirements]);

    const totalRequirementsCount = requirements.filter(r => locationFilter === 'all' || r.location === locationFilter).length;
    const openRequirementsCount = requirements.filter(r => r.status === 'Open' && (locationFilter === 'all' || r.location === locationFilter)).length;
    const purchasedRequirementsCount = requirements.filter(r => r.status === 'Purchased' && (locationFilter === 'all' || r.location === locationFilter)).length;


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline tracking-tight">Homeowner Dashboard</h1>
                    <p className="text-muted-foreground">Manage your material requirements and view quotations.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button asChild>
                        <Link href="/homeowner/requirements/new">
                            <PlusCircle className="mr-2" />
                            Post a New Requirement
                        </Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/updates">
                            <Newspaper className="mr-2" />
                            View Updates
                        </Link>
                    </Button>
                </div>
            </div>

             <div className="space-y-4">
                <h2 className="text-xl font-bold font-headline">Browse by Category</h2>
                {currentUser && <MaterialCategoryGrid role={currentUser.role} />}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card
                    onClick={() => setStatusFilter('all')}
                    className={cn("cursor-pointer transition-all", statusFilter === 'all' && "ring-2 ring-primary shadow-lg")}
                 >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRequirementsCount}</div>
                    </CardContent>
                </Card>
                <Card
                    onClick={() => setStatusFilter('Open')}
                    className={cn("cursor-pointer transition-all", statusFilter === 'Open' && "ring-2 ring-primary shadow-lg")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openRequirementsCount}</div>
                    </CardContent>
                </Card>
                <Card
                    onClick={() => setStatusFilter('Purchased')}
                    className={cn("cursor-pointer transition-all", statusFilter === 'Purchased' && "ring-2 ring-primary shadow-lg")}
                >
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
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-headline">Your Requirements</h2>
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
                 ) : requirements.length === 0 ? (
                    <GettingStartedGuide />
                 ) : displayRequirements.length > 0 ? (
                    <div className="space-y-4">
                        {displayRequirements.map(req => (
                            <Card key={req.id}>
                                <Link href={`/homeowner/requirements/${req.id}`} className="block hover:bg-muted/50 transition-colors rounded-t-lg">
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
                                                            <span>{detail.size}mm: <strong>{detail.quantity || 'N/A'} rods</strong></span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {req.steelBrands && req.steelBrands.length > 0 && (
                                                    <p className="text-xs text-muted-foreground mt-2">Preferred Brands: {req.steelBrands.join(', ')}</p>
                                                )}
                                            </div>
                                        )}

                                        {req.electricalDetails && req.electricalDetails.length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <h4 className="text-sm font-semibold mb-2">Electrical Details:</h4>
                                                <ul className="space-y-1">
                                                    {req.electricalDetails.map(detail => (
                                                        <li key={detail.id} className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <Zap className="w-4 h-4 text-primary/70" />
                                                            <span>{detail.id}: <strong>{detail.quantity || 'N/A'} pcs</strong></span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {req.electricalBrands && req.electricalBrands.length > 0 && (
                                                    <p className="text-xs text-muted-foreground mt-2">Preferred Brands: {req.electricalBrands.join(', ')}</p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Link>
                                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                     <div className="text-sm text-primary font-medium">
                                        {req.quoteCount} Quotation(s) Received
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild variant="outline">
                                            <Link href={`/homeowner/requirements/edit/${req.id}`}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Link>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <div className="mx-auto w-24 h-24 mb-4">
                            <Image src="https://placehold.co/100x100.png" width={100} height={100} alt="No requirements" data-ai-hint="empty box document" className="rounded-full" />
                        </div>
                        <h3 className="text-lg font-medium">No requirements found</h3>
                        <p className="text-muted-foreground mt-1">
                            No requirements found matching your filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

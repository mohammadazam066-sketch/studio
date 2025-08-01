
'use client';

import { useEffect, useState } from 'react';
import { getAllUsersByRole, getAllPurchases, getOpenRequirements, getQuotationsForRequirement } from '@/lib/store';
import type { User, Purchase, Requirement, Quotation } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from 'lucide-react';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return 'N/A';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP p');
}

type OpenRequirementWithResponses = Requirement & {
  responded: string[];
  notResponded: string[];
};

function AdminDashboardSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-1/4" />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


export default function AdminDashboardPage() {
    const [homeowners, setHomeowners] = useState<User[]>([]);
    const [shopOwners, setShopOwners] = useState<User[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [openRequirements, setOpenRequirements] = useState<OpenRequirementWithResponses[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [homeownerData, shopOwnerData, purchaseData, openReqsData] = await Promise.all([
                getAllUsersByRole('homeowner'),
                getAllUsersByRole('shop-owner'),
                getAllPurchases(),
                getOpenRequirements()
            ]);

            const allShopOwnerIds = shopOwnerData.map(so => so.id);

            const openRequirementsWithResponses = await Promise.all(
              openReqsData.map(async (req) => {
                const quotations = await getQuotationsForRequirement(req.id);
                const respondedShopOwnerIds = new Set(quotations.map(q => q.shopOwnerId));
                
                const notResponded = allShopOwnerIds.filter(id => !respondedShopOwnerIds.has(id));
                
                return { 
                  ...req, 
                  responded: Array.from(respondedShopOwnerIds), 
                  notResponded: notResponded,
                };
              })
            );

            setHomeowners(homeownerData);
            setShopOwners(shopOwnerData);
            setPurchases(purchaseData);
            setOpenRequirements(openRequirementsWithResponses);
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) {
        return <AdminDashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Platform overview and management.</p>
            </div>
            <Tabs defaultValue="open-requirements">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="open-requirements">Open Requirements</TabsTrigger>
                    <TabsTrigger value="purchases">Purchases</TabsTrigger>
                    <TabsTrigger value="homeowners">Homeowners</TabsTrigger>
                    <TabsTrigger value="shop-owners">Shop Owners</TabsTrigger>
                </TabsList>
                
                <TabsContent value="open-requirements">
                    <Card>
                        <CardHeader>
                            <CardTitle>Open Requirements</CardTitle>
                            <CardDescription>All requirements that are not yet marked as purchased.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Requirement</TableHead>
                                        <TableHead>Homeowner ID</TableHead>
                                        <TableHead>Responses</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {openRequirements.map(req => {
                                        const responseCount = req.responded.length;
                                        return (
                                        <TableRow key={req.id} className={responseCount < 2 ? 'bg-destructive/10' : ''}>
                                            <TableCell className="font-medium">{req.title}</TableCell>
                                            <TableCell>{req.homeownerId}</TableCell>
                                            <TableCell>
                                                <Badge variant={responseCount < 2 ? 'destructive' : 'secondary'}>{responseCount} response(s)</Badge>
                                            </TableCell>
                                            <TableCell>
                                               <Collapsible>
                                                    <CollapsibleTrigger asChild>
                                                        <button className="flex items-center text-sm font-medium text-primary hover:underline">
                                                            View Non-Responders <ChevronsUpDown className="h-4 w-4 ml-1" />
                                                        </button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="p-2 mt-2 bg-muted rounded-md space-y-2">
                                                            <div>
                                                                <h4 className="font-semibold text-xs mb-1">Responded:</h4>
                                                                {req.responded.length > 0 ? (
                                                                    <ul className="list-disc pl-4 text-xs">{req.responded.map(id => <li key={id}>{id}</li>)}</ul>
                                                                ) : <p className="text-xs text-muted-foreground">None</p>}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-xs mb-1">Did Not Respond:</h4>
                                                                {req.notResponded.length > 0 ? (
                                                                    <ul className="list-disc pl-4 text-xs">{req.notResponded.map(id => <li key={id}>{id}</li>)}</ul>
                                                                ) : <p className="text-xs text-muted-foreground">All shop owners have responded.</p>}
                                                            </div>
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="purchases">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Purchases</CardTitle>
                            <CardDescription>A log of all confirmed purchases on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Homeowner</TableHead>
                                        <TableHead>Shop Owner</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.material}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{p.homeownerName}</span>
                                                    <span className="text-xs text-muted-foreground">{p.homeownerId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{p.shopOwnerName}</span>
                                                    <span className="text-xs text-muted-foreground">{p.shopOwnerId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>Rs {p.amount.toFixed(2)}</TableCell>
                                            <TableCell>{formatDate(p.createdAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="homeowners">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Homeowners</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {homeowners.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.profile?.name || 'N/A'}</TableCell>
                                            <TableCell>{user.id}</TableCell>
                                            <TableCell>{(user.profile as HomeownerProfile)?.address || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shop-owners">
                     <Card>
                        <CardHeader>
                            <CardTitle>All Shop Owners</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shop Name</TableHead>
                                        <TableHead>Owner Name</TableHead>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shopOwners.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{(user.profile as ShopOwnerProfile)?.shopName || 'N/A'}</TableCell>
                                            <TableCell>{user.profile?.name || 'N/A'}</TableCell>
                                            <TableCell>{user.id}</TableCell>
                                            <TableCell>{(user.profile as ShopOwnerProfile)?.location || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );

    
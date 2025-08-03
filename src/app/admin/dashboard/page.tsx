

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
import { ChevronsUpDown, FileText, Calendar, Wallet, User as UserIcon, Phone, Droplets, Tally5 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return 'N/A';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP p');
}

function formatShortDate(date: Date | string | Timestamp) {
    if (!date) return 'N/A';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}


type ShopOwnerInfo = {
    id: string;
    name: string;
    phone: string;
}

type OpenRequirementWithDetails = Requirement & {
  quotations: Quotation[];
  notResponded: ShopOwnerInfo[];
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
    const [openRequirements, setOpenRequirements] = useState<OpenRequirementWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [homeownerData, shopOwnerData, purchaseData, openReqsData] = await Promise.all([
                getAllUsersByRole('homeowner'),
                getAllUsersByRole('shop-owner'),
                getAllPurchases(),
                getOpenRequirements()
            ]);

            const shopOwnerMap = new Map(shopOwnerData.map(so => [so.id, { id: so.id, name: so.profile?.name || so.id, phone: so.phoneNumber }]));

            const openRequirementsWithDetails = await Promise.all(
              openReqsData.map(async (req) => {
                const quotations = await getQuotationsForRequirement(req.id);
                const respondedShopOwnerIds = new Set(quotations.map(q => q.shopOwnerId));
                
                const notResponded: ShopOwnerInfo[] = [];

                shopOwnerMap.forEach((shopOwner, id) => {
                    if (!respondedShopOwnerIds.has(id)) {
                        notResponded.push(shopOwner);
                    }
                });
                
                return { 
                  ...req, 
                  quotations,
                  notResponded,
                };
              })
            );

            setHomeowners(homeownerData);
            setShopOwners(shopOwnerData);
            setPurchases(purchaseData);
            setOpenRequirements(openRequirementsWithDetails);
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
                                        const responseCount = req.quotations.length;
                                        return (
                                        <TableRow key={req.id} className={responseCount < 2 ? 'bg-destructive/10' : ''}>
                                            <TableCell>
                                                <div className="font-medium">{req.title}</div>
                                                <div className="text-sm text-muted-foreground">{req.category}</div>
                                            </TableCell>
                                            <TableCell>{req.homeownerId}</TableCell>
                                            <TableCell>
                                                <Badge variant={responseCount < 2 ? 'destructive' : 'secondary'}>{responseCount} response(s)</Badge>
                                            </TableCell>
                                            <TableCell>
                                               <Collapsible>
                                                    <CollapsibleTrigger asChild>
                                                        <button className="flex items-center text-sm font-medium text-primary hover:underline">
                                                            View Details <ChevronsUpDown className="h-4 w-4 ml-1" />
                                                        </button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="p-2 mt-2 bg-muted rounded-md space-y-4">
                                                            <div>
                                                                <h4 className="font-semibold text-xs mb-2">Requirement Specifications:</h4>
                                                                <div className="p-2 bg-background rounded-md border text-xs space-y-2">
                                                                    {req.brands && req.brands.length > 0 && (
                                                                        <div className="space-y-1">
                                                                            <h5 className="font-medium">Cement Details:</h5>
                                                                            {req.brands.map(brand => (
                                                                                <p key={brand.id} className="flex items-center gap-1.5 text-muted-foreground"><Droplets className="w-3 h-3 text-primary/70" /> {brand.id}: <strong>{brand.quantity || 'N/A'} bags</strong></p>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {req.steelDetails && req.steelDetails.length > 0 && (
                                                                         <div className="space-y-1">
                                                                            <h5 className="font-medium">Steel Details:</h5>
                                                                            {req.steelDetails.map(detail => (
                                                                                <p key={detail.size} className="flex items-center gap-1.5 text-muted-foreground"><Tally5 className="w-3 h-3 text-primary/70" /> {detail.size}mm: <strong>{detail.quantity || 'N/A'} rods</strong></p>
                                                                            ))}
                                                                             {req.steelBrands && req.steelBrands.length > 0 && (
                                                                                <p className="text-xs text-muted-foreground pt-1">Preferred: {req.steelBrands.join(', ')}</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {(!req.brands || req.brands.length === 0) && (!req.steelDetails || req.steelDetails.length === 0) && (
                                                                        <p className="text-muted-foreground">No specific brand or size details provided.</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="font-semibold text-xs mb-2">Responded:</h4>
                                                                {req.quotations.length > 0 ? (
                                                                    <div className="space-y-3">
                                                                        {req.quotations.map(quote => (
                                                                            <div key={quote.id} className="p-2 bg-background rounded-md border text-xs">
                                                                                <p className="font-bold">{quote.shopName}</p>
                                                                                <p className="text-muted-foreground">{quote.shopOwnerName}</p>
                                                                                <Separator className="my-1.5" />
                                                                                <div className="space-y-1">
                                                                                     <p className="flex items-center gap-1.5"><Wallet className="w-3 h-3" /> <span className="font-mono">Rs {quote.amount.toFixed(2)}</span></p>
                                                                                     <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {formatShortDate(quote.deliveryDate)}</p>
                                                                                     {quote.terms && <p className="flex items-start gap-1.5"><FileText className="w-3 h-3 mt-0.5" /> {quote.terms}</p>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : <p className="text-xs text-muted-foreground">None</p>}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-xs mb-1">Did Not Respond:</h4>
                                                                {req.notResponded.length > 0 ? (
                                                                    <ul className="list-disc pl-4 text-xs">{req.notResponded.map(so => <li key={so.id}>{so.name} ({so.phone})</li>)}</ul>
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
                                        <TableHead>Status</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.map(p => (
                                        <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/purchases/${p.id}`)}>
                                            <TableCell className="font-medium">{p.material}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{p.homeownerName}</span>
                                                    <span className="text-xs text-muted-foreground">{homeowners.find(h => h.id === p.homeownerId)?.phoneNumber || p.homeownerId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{p.shopOwnerName}</span>
                                                    <span className="text-xs text-muted-foreground">{shopOwners.find(s => s.id === p.shopOwnerId)?.phoneNumber || p.shopOwnerId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>Rs {p.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={p.status === 'Purchased' ? 'default' : 'secondary'} className={p.status === 'Purchased' ? 'bg-accent text-accent-foreground' : ''}>
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
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
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>User ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {homeowners.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.profile?.name || 'N/A'}</TableCell>
                                            <TableCell>{user.phoneNumber}</TableCell>
                                            <TableCell>{(user.profile as HomeownerProfile)?.address || 'N/A'}</TableCell>
                                            <TableCell>{user.id}</TableCell>
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
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>User ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shopOwners.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{(user.profile as ShopOwnerProfile)?.shopName || 'N/A'}</TableCell>
                                            <TableCell>{user.profile?.name || 'N/A'}</TableCell>
                                            <TableCell>{user.phoneNumber}</TableCell>
                                            <TableCell>{(user.profile as ShopOwnerProfile)?.location || 'N/A'}</TableCell>
                                            <TableCell>{user.id}</TableCell>
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
}

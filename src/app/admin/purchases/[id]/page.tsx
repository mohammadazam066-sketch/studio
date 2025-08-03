
'use client';

import { getPurchaseById } from '@/lib/store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import type { PurchaseWithDetails } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, User, Phone, Home, Store, FileText, Calendar, Wallet, MapPin, Building } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return 'N/A';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP p');
}

function PageSkeleton() {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-36" />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                           <Skeleton className="h-6 w-1/3" />
                           <Skeleton className="h-5 w-2/3" />
                           <Skeleton className="h-5 w-1/2" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
            </CardContent>
        </Card>
      </div>
    );
}

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [purchase, setPurchase] = useState<PurchaseWithDetails | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchPurchaseData = useCallback(async () => {
    if (typeof id !== 'string') return;
    setLoading(true);
    const data = await getPurchaseById(id);
    if (!data) {
      // TODO: Add toast notification
      router.push('/admin/dashboard');
      return;
    }
    setPurchase(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchPurchaseData();
  }, [fetchPurchaseData]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!purchase) {
    return <div>Purchase not found.</div>;
  }

  const { requirement, quotation, homeowner, shopOwner } = purchase;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        <div>
            <Button asChild variant="outline">
                <Link href="/admin/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-headline">Purchase Details</CardTitle>
                        <CardDescription>ID: {purchase.id}</CardDescription>
                    </div>
                     <Badge variant={purchase.status === 'Purchased' ? 'default' : 'secondary'} className={purchase.status === 'Purchased' ? 'bg-accent text-accent-foreground' : ''}>
                        {purchase.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-muted-foreground">Material</h4>
                        <p className="text-lg font-medium">{purchase.material}</p>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-muted-foreground">Final Amount</h4>
                        <p className="text-lg font-medium">Rs {purchase.amount.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-muted-foreground">Purchase Date</h4>
                        <p className="text-lg font-medium">{formatDate(purchase.createdAt)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="grid lg:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="text-primary"/> Homeowner Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/> {homeowner?.name}</p>
                    <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> {homeowner?.phoneNumber}</p>
                    {homeowner?.address && <p className="flex items-center gap-2"><Home className="w-4 h-4 text-muted-foreground"/> {homeowner.address}</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Store className="text-primary"/> Shop Owner Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground"/> {shopOwner?.shopName}</p>
                    <p className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/> {shopOwner?.name}</p>
                    <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> {shopOwner?.phoneNumber}</p>
                    {shopOwner?.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground"/> {shopOwner.address}</p>}
                </CardContent>
            </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Original Requirement</CardTitle></CardHeader>
                {requirement ? (
                     <CardContent className="space-y-4">
                        <p className="font-semibold text-primary">{requirement.title}</p>
                        <p className="text-sm text-muted-foreground">{requirement.description}</p>
                        <Separator/>
                        <div className="text-sm space-y-1">
                             <p><span className="font-semibold">Category:</span> {requirement.category}</p>
                             <p><span className="font-semibold">Location:</span> {requirement.location}</p>
                        </div>
                        {requirement.photos.length > 0 && (
                             <div className="grid grid-cols-3 gap-2 pt-2">
                                {requirement.photos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <Image src={photo} alt={`Requirement photo ${index+1}`} fill style={{objectFit: 'cover'}} className="rounded-md" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                ) : <CardContent><p>Requirement details not available.</p></CardContent>}
            </Card>

            <Card>
                <CardHeader><CardTitle>Winning Quotation</CardTitle></CardHeader>
                {quotation ? (
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between items-baseline p-3 bg-secondary rounded-lg">
                            <span className="font-semibold">Quoted Amount</span>
                            <span className="text-xl font-bold text-primary">Rs {quotation.amount.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                             <p className="flex items-start gap-2"><FileText className="w-4 h-4 mt-1 flex-shrink-0" /> <strong>Terms:</strong> <span className="text-muted-foreground">{quotation.terms || 'N/A'}</span></p>
                             <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <strong>Delivery by:</strong> <span className="text-muted-foreground">{formatDate(quotation.deliveryDate)}</span></p>
                        </div>
                    </CardContent>
                ) : <CardContent><p>Quotation details not available.</p></CardContent>}
            </Card>
        </div>
    </div>
  );
}


'use client';

import { getRequirementById, getQuotationsForRequirement, updateRequirementStatus, deleteRequirement } from '@/lib/store';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Wrench, FileText, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import type { Requirement, Quotation } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 pt-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Skeleton className="h-40 w-full aspect-video rounded-lg" />
          </div>
        </CardContent>
         <CardFooter className="border-t pt-4 flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
       <div>
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-48" />
                           <Skeleton className="h-4 w-32" />
                        </div>
                         <Skeleton className="h-8 w-24" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-start gap-3">
                        <Skeleton className="w-4 h-4 mt-1 rounded-full flex-shrink-0" />
                        <div className="w-full space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-3/4" />
                        </div>
                   </div>
                   <div className="flex items-start gap-3">
                        <Skeleton className="w-4 h-4 mt-1 rounded-full flex-shrink-0" />
                        <Skeleton className="h-4 w-1/2" />
                   </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                  <Skeleton className="h-10 w-full sm:w-1/2" />
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  )
}

export default function RequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const { toast } = useToast();
  
  const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);
  const [relatedQuotations, setRelatedQuotations] = useState<Quotation[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (typeof id !== 'string') return;
    setLoading(true);

    try {
        const reqData = await getRequirementById(id);

        if (!reqData) {
            toast({ variant: 'destructive', title: 'Not Found', description: 'This requirement could not be found.' });
            router.push('/homeowner/dashboard');
            return;
        }

        setRequirement(reqData);

        const quotesData = await getQuotationsForRequirement(id);
        setRelatedQuotations(quotesData);

    } catch (error) {
        console.error("Error fetching requirement details:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load requirement details.' });
    } finally {
        setLoading(false);
    }
  }, [id, router, toast]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePurchaseClick = (quote: Quotation) => {
    if (requirement?.status === 'Purchased') {
      toast({
        variant: "default",
        title: "Already Purchased",
        description: "You have already marked a quotation as purchased for this requirement.",
      });
      return;
    }
    setSelectedQuote(quote);
    setIsPurchaseDialogOpen(true);
  };
  
  const confirmPurchase = async () => {
    if (requirement && selectedQuote) {
        try {
            await updateRequirementStatus(requirement.id, 'Purchased');
            setRequirement(prev => prev ? { ...prev, status: 'Purchased' } : undefined);
            
            toast({
              title: "Purchase Confirmed!",
              description: `You have purchased the quotation from ${selectedQuote.shopOwnerName}.`,
              variant: 'default',
              className: 'bg-accent text-accent-foreground border-accent'
            });

        } catch (error) {
           toast({ variant: 'destructive', title: 'Error', description: 'Failed to update purchase status.' });
           console.error("Purchase confirmation error:", error);
        } finally {
            setSelectedQuote(null);
            setIsPurchaseDialogOpen(false);
        }
    }
  };

  const handleDeleteRequirement = async () => {
    if (!requirement) return;
    try {
        await deleteRequirement(requirement.id);
        toast({
            title: "Requirement Deleted",
            description: "Your requirement has been successfully removed.",
        });
        router.push('/homeowner/dashboard');
        router.refresh();
    } catch (error) {
        console.error("Failed to delete requirement:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete the requirement. Please try again.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
    }
  }


  if (loading) {
    return <PageSkeleton />;
  }

  if (!requirement) {
    return null; // Should have been redirected by the fetch logic
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Requirement Details */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <Badge variant="secondary" className="mb-2">{requirement.category}</Badge>
              <CardTitle className="font-headline text-2xl">{requirement.title}</CardTitle>
            </div>
            <div className={`text-sm font-medium flex items-center gap-2 ${requirement.status === 'Purchased' ? 'text-accent' : 'text-primary'}`}>
                <span className={`h-2 w-2 rounded-full ${requirement.status === 'Purchased' ? 'bg-accent' : 'bg-primary'}`}></span>
                {requirement.status}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {requirement.location}</div>
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted on {formatDate(requirement.createdAt)}</div>
            <div className="flex items-center gap-1.5"><Wrench className="w-4 h-4" /> By {requirement.homeownerName}</div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-6">{requirement.description}</p>
          {requirement.photos.length > 0 && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {requirement.photos.map((photo, index) => (
                <Image key={index} src={photo} alt={`${requirement.title} photo ${index + 1}`} width={300} height={200} className="rounded-lg object-cover" data-ai-hint="construction site" />
                ))}
            </div>
          )}
        </CardContent>
         {requirement.status !== 'Purchased' && (
          <CardFooter className="border-t pt-4 flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link href={`/homeowner/requirements/edit/${requirement.id}`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Quotations List */}
      <div>
        <h2 className="text-xl font-bold font-headline mb-4">Quotations Received</h2>
        {relatedQuotations.length > 0 ? (
          <div className="space-y-4">
            {relatedQuotations.map(quote => (
              <Card key={quote.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <Link href={`/homeowner/profile/${quote.shopOwnerId}`} className="hover:underline group">
                        <CardTitle className="text-lg group-hover:text-primary">{quote.shopName}</CardTitle>
                        <CardDescription>{quote.shopOwnerName}</CardDescription>
                    </Link>
                    <div className="flex items-center text-lg font-semibold text-primary">
                        <span className="font-sans mr-1">Rs</span>
                        {quote.amount.toFixed(2)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 text-sm">
                    <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground">{quote.terms}</p>
                  </div>
                   <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground">Expected by: {formatDate(quote.deliveryDate)}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground disabled:bg-gray-400"
                    onClick={() => handlePurchaseClick(quote)}
                    disabled={requirement.status === 'Purchased'}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {requirement.status === 'Purchased' ? 'Purchased' : 'Mark as Purchased'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium">No quotations yet</h3>
            <p className="text-muted-foreground mt-1">Check back soon for quotes from professionals.</p>
          </div>
        )}
      </div>

       {/* Purchase Confirmation Dialog */}
       <AlertDialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mark the quotation from <span className="font-bold">{selectedQuote?.shopOwnerName}</span> for <span className="font-bold">Rs{selectedQuote?.amount.toFixed(2)}</span> as purchased.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Confirm &amp; Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your requirement and all quotations associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequirement} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

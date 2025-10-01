

'use client';

import { getRequirementById, getQuotationsForRequirement, updateRequirementStatus, deleteRequirement, createPurchase, useAuth, getReviewByPurchase, addReview, getReviewsByShopOwner, updateReview, getHomeownerProfileById } from '@/lib/store';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Wrench, FileText, CheckCircle, Edit, Trash2, Droplets, Tally5, Star, Award, XCircle, Zap, IndianRupee, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import type { Requirement, Quotation, Review, HomeownerProfile } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}

const StarRating = ({ rating, size = "md", reviewCount }: { rating: number; size?: 'sm' | 'md' | 'lg', reviewCount?: number }) => {
    const starClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`${starClasses[size]} ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
            ))}
            {reviewCount !== undefined && (
                 <span className="text-muted-foreground text-xs ml-1">({reviewCount})</span>
            )}
        </div>
    );
};

type QuotationWithReviewData = Quotation & {
    averageRating: number;
    reviewCount: number;
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
  const { currentUser } = useAuth();
  
  const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);
  const [relatedQuotations, setRelatedQuotations] = useState<QuotationWithReviewData[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [existingReviews, setExistingReviews] = useState<Record<string, Review>>({});
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const [loading, setLoading] = useState(true);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReviewDialogOpen, setReviewDialogOpen] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

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
        
        const quotesWithReviewData = await Promise.all(
            quotesData.map(async (quote) => {
                const reviews = await getReviewsByShopOwner(quote.shopOwnerId);
                const reviewCount = reviews.length;
                const averageRating = reviewCount > 0
                    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviewCount
                    : 0;
                return { ...quote, averageRating, reviewCount };
            })
        );
        
        setRelatedQuotations(quotesWithReviewData);


        if (reqData.status === 'Purchased' && reqData.purchaseId && currentUser?.id) {
            const reviewsData: Record<string, Review> = {};
            for (const quote of quotesData) {
                const reviewData = await getReviewByPurchase(reqData.purchaseId, currentUser.id, quote.shopOwnerId);
                if (reviewData) {
                    reviewsData[quote.shopOwnerId] = reviewData;
                }
            }
            setExistingReviews(reviewsData);
        }

    } catch (error) {
        console.error("Error fetching requirement details:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load requirement details.' });
    } finally {
        setLoading(false);
    }
  }, [id, router, toast, currentUser?.id]);


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
            const purchaseRef = await createPurchase(requirement, selectedQuote);
            
            toast({
              title: "Purchase Confirmed!",
              description: `You have purchased the quotation from ${selectedQuote.shopOwnerName}.`,
              variant: 'default',
              className: 'bg-accent text-accent-foreground border-accent'
            });
            
            // Refresh data to get the new purchaseId and check for reviews
            fetchData();

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

  const handleReviewSubmit = async () => {
    if (!rating) {
        toast({ variant: 'destructive', title: 'Rating Required', description: 'Please select a star rating.' });
        return;
    }
    
    if (!currentUser?.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not submit review due to missing user information.' });
        return;
    }

    const homeownerProfile = await getHomeownerProfileById(currentUser.id);
     if (!homeownerProfile || !homeownerProfile.name) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not submit review due to missing user information.' });
        return;
    }
    
    if (!selectedQuote) {
        toast({ variant: 'destructive', title: 'Error', description: 'No quote selected for review.' });
        return;
    }

    try {
        if (editingReview) {
            // Update existing review
            await updateReview(editingReview.id, { rating, comment });
            toast({ title: 'Review Updated!', description: 'Your feedback has been updated.' });
        } else {
             if (!requirement?.purchaseId) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not submit review due to missing purchase information.' });
                return;
            }
            // Add new review
            const reviewData = {
                shopOwnerId: selectedQuote.shopOwnerId,
                customerId: currentUser.id,
                customerName: homeownerProfile.name,
                purchaseId: requirement.purchaseId,
                rating: rating,
                comment: comment,
                customerPhotoURL: homeownerProfile.photoURL || `https://placehold.co/100x100.png`
            };
            await addReview(reviewData);
            toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.', className: 'bg-accent text-accent-foreground border-accent' });
        }

        setReviewDialogOpen(false);
        fetchData(); // Refresh to show the latest review status
    } catch (error) {
        console.error("Review submission error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your review.' });
    }
  }

  const openReviewDialog = (quote: Quotation, review?: Review) => {
    setSelectedQuote(quote);
    if (review) {
        setEditingReview(review);
        setRating(review.rating);
        setComment(review.comment);
    } else {
        setEditingReview(null);
        setRating(0);
        setComment('');
    }
    setReviewDialogOpen(true);
  }


  if (loading) {
    return <PageSkeleton />;
  }

  if (!requirement) {
    return null; // Should have been redirected by the fetch logic
  }
  
  const isPurchased = requirement.status === 'Purchased';
  const winningQuotationId = requirement.quotationId;


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
            <div className={`text-sm font-medium flex items-center gap-2 ${isPurchased ? 'text-accent' : 'text-primary'}`}>
                <span className={`h-2 w-2 rounded-full ${isPurchased ? 'bg-accent' : 'bg-primary'}`}></span>
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
          
          {requirement.brands && requirement.brands.length > 0 && (
            <div className="mb-6">
                <Separator className="my-4" />
                <h4 className="text-base font-semibold mb-3">Cement Details</h4>
                <div className="space-y-2">
                    {requirement.brands.map(brand => (
                        <div key={brand.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                            <span className="text-muted-foreground">{brand.id}</span>
                            <span className="font-medium">{brand.quantity} bags</span>
                        </div>
                    ))}
                </div>
                {requirement.flexibleBrand && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">User is open to alternative brands.</p>
                )}
                 <Separator className="my-4" />
            </div>
          )}
          
          {requirement.steelDetails && requirement.steelDetails.length > 0 && (
            <div className="mb-6">
                <Separator className="my-4" />
                <h4 className="text-base font-semibold mb-3">Steel (TMT Bar) Details</h4>
                <div className="space-y-2">
                    {requirement.steelDetails.map(detail => (
                        <div key={detail.size} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                            <span className="text-muted-foreground">{detail.size}mm</span>
                            <span className="font-medium">{detail.quantity} rods</span>
                        </div>
                    ))}
                </div>
                 {requirement.steelBrands && requirement.steelBrands.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">Preferred Brands: {requirement.steelBrands.join(', ')}</p>
                )}
                {requirement.flexibleSteelBrand && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">User is open to alternative brands for steel.</p>
                )}
                <Separator className="my-4" />
            </div>
          )}

          {requirement.electricalDetails && requirement.electricalDetails.length > 0 && (
            <div className="mb-6">
                <Separator className="my-4" />
                <h4 className="text-base font-semibold mb-3">Electrical Details</h4>
                <div className="space-y-2">
                    {requirement.electricalDetails.map(detail => (
                        <div key={detail.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                            <span className="text-muted-foreground">{detail.id}</span>
                            <span className="font-medium">{detail.quantity} pcs</span>
                        </div>
                    ))}
                </div>
                 {requirement.electricalBrands && requirement.electricalBrands.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">Preferred Brands: {requirement.electricalBrands.join(', ')}</p>
                )}
                {requirement.flexibleElectricalBrand && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">User is open to alternative brands for electrical items.</p>
                )}
                <Separator className="my-4" />
            </div>
          )}


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
            {relatedQuotations.map(quote => {
                 const existingReview = existingReviews[quote.shopOwnerId];
                 const isWinningQuote = isPurchased && quote.id === winningQuotationId;
                 const isNotSelected = isPurchased && !isWinningQuote;

                 return (
              <Card key={quote.id} className={cn("transition-shadow hover:shadow-md", isWinningQuote && "border-2 border-accent shadow-lg", isNotSelected && "bg-muted/50")}>
                 {isWinningQuote && (
                    <div className="bg-accent text-accent-foreground text-xs font-bold p-2 text-center flex items-center justify-center gap-2 rounded-t-lg">
                        <Award className="w-4 h-4"/>
                        You purchased this quotation.
                    </div>
                 )}
                 {isNotSelected && (
                    <div className="bg-secondary text-secondary-foreground text-xs font-bold p-2 text-center flex items-center justify-center gap-2 rounded-t-lg">
                        <XCircle className="w-4 h-4"/>
                        Not Selected
                    </div>
                 )}
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <Link href={`/homeowner/profile/${quote.shopOwnerId}`} className="hover:underline group">
                        <CardTitle className="text-lg group-hover:text-primary">{quote.shopName}</CardTitle>
                        <CardDescription>{quote.shopOwnerName}</CardDescription>
                         {quote.reviewCount > 0 ? (
                            <div className="pt-1">
                                <StarRating rating={quote.averageRating} reviewCount={quote.reviewCount} size="sm" />
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground pt-1">No reviews yet</p>
                        )}
                    </Link>
                     <div className="flex flex-col items-end">
                        <div className="flex items-center text-lg font-semibold text-primary">
                            <IndianRupee className="w-4 h-4 mr-0.5" />
                            {(quote.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-xs text-muted-foreground">Total Amount</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-baseline gap-2">
                            <span className="text-muted-foreground">Materials:</span>
                            <span className="font-semibold flex items-center"><IndianRupee className="w-3 h-3 mr-0.5" />{(quote.materialAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                         <div className="flex items-baseline gap-2">
                            <span className="text-muted-foreground">Transport:</span>
                            <span className="font-semibold flex items-center"><IndianRupee className="w-3 h-3 mr-0.5" />{(quote.transportationCharges || 0).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <Separator />

                  <div className="flex items-start gap-3 text-sm">
                    <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground">{quote.terms}</p>
                  </div>
                   <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground">Expected by: {formatDate(quote.deliveryDate)}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center gap-2">
                  {!isPurchased ? (
                    <Button 
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                        onClick={() => handlePurchaseClick(quote)}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Purchased
                    </Button>
                  ) : (
                     isWinningQuote && (
                        <Button 
                            variant="default"
                            className="w-full" 
                            onClick={() => openReviewDialog(quote, existingReview)}
                        >
                            {existingReview ? 'Edit Review' : 'Leave a Review'}
                        </Button>
                    )
                  )}
                </CardFooter>
              </Card>
            )})}
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
              You are about to mark the quotation from <span className="font-bold">{selectedQuote?.shopOwnerName}</span> for a total of <span className="font-bold">Rs {(selectedQuote?.totalAmount || 0).toFixed(2)}</span> as purchased. This will create a permanent purchase record.
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
              This action cannot be undone. This will permanently delete this requirement.
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
      

      {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingReview ? 'Edit Your' : 'Leave a'} Review for {selectedQuote?.shopName}</DialogTitle>
                    <DialogDescription>
                        Share your experience to help other homeowners.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`h-8 w-8 cursor-pointer transition-colors ${
                                    (hoverRating || rating) > i ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                }`}
                                onMouseEnter={() => setHoverRating(i + 1)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(i + 1)}
                            />
                        ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea 
                        id="comment"
                        placeholder="Tell us about your experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleReviewSubmit}>{editingReview ? 'Update Review' : 'Submit Review'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}



    
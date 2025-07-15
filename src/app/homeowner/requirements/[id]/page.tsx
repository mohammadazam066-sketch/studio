'use client';

import { useRequirements, useQuotations } from '@/lib/store';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Wrench, FileText, CheckCircle, Mail, Phone, User } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { Requirement, Quotation } from '@/lib/types';
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

export default function RequirementDetailPage() {
  const params = useParams();
  const { id } = params;
  
  const { requirements, updateRequirementStatus } = useRequirements();
  const { getQuotationsForRequirement } = useQuotations();
  const { toast } = useToast();
  
  const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  useEffect(() => {
    if (id) {
      const foundRequirement = requirements.find(r => r.id === id);
      setRequirement(foundRequirement);
    }
  }, [id, requirements]);

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
  };
  
  const confirmPurchase = () => {
    if (requirement && selectedQuote) {
      updateRequirementStatus(requirement.id, 'Purchased');
      toast({
        title: "Purchase Confirmed!",
        description: `You have purchased the quotation from ${selectedQuote.shopOwnerName}.`,
      });
    }
  };

  if (!requirement) {
    return <div>Loading...</div>;
  }

  const relatedQuotations = getQuotationsForRequirement(requirement.id);

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
            <div className={`text-sm font-medium flex items-center gap-2 ${requirement.status === 'Purchased' ? 'text-accent' : 'text-blue-500'}`}>
                <span className={`h-2 w-2 rounded-full ${requirement.status === 'Purchased' ? 'bg-accent' : 'bg-blue-500'}`}></span>
                {requirement.status}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {requirement.location}</div>
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted on {format(new Date(requirement.createdAt), 'PPP')}</div>
            <div className="flex items-center gap-1.5"><Wrench className="w-4 h-4" /> By {requirement.homeownerName}</div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-6">{requirement.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {requirement.photos.map((photo, index) => (
              <Image key={index} src={photo} alt={`${requirement.title} photo ${index + 1}`} width={300} height={200} className="rounded-lg object-cover" data-ai-hint="construction site" />
            ))}
          </div>
        </CardContent>
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
                    <div>
                      <CardTitle className="text-lg">{quote.shopName}</CardTitle>
                      <CardDescription>{quote.shopOwnerName}</CardDescription>
                    </div>
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
                    <p className="text-muted-foreground">Expected by: {format(new Date(quote.deliveryDate), 'PPP')}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/homeowner/profile/${quote.shopOwnerId}`}>
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </Link>
                  </Button>
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

       {/* Confirmation Dialog */}
       <AlertDialog open={!!selectedQuote} onOpenChange={(isOpen) => !isOpen && setSelectedQuote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to purchase the quotation from <span className="font-bold">{selectedQuote?.shopOwnerName}</span> for <span className="font-bold">Rs{selectedQuote?.amount.toFixed(2)}</span>.
              <br/><br/>
              The shop owner will be notified. You can contact them directly:
              <div className="flex items-center gap-2 mt-2">
                <Mail className="h-4 w-4" /> <span>{selectedQuote?.shopOwnerEmail}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4" /> <span>{selectedQuote?.shopOwnerPhone}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Confirm & Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

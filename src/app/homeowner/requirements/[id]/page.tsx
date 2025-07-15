'use client';

import { useRequirements, useQuotations } from '@/lib/store';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Wrench, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { Requirement } from '@/lib/types';


export default function RequirementDetailPage() {
  const params = useParams();
  const { id } = params;
  
  const { requirements } = useRequirements();
  const { getQuotationsForRequirement } = useQuotations();
  
  const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);
  
  useEffect(() => {
    if (id) {
      const foundRequirement = requirements.find(r => r.id === id);
      setRequirement(foundRequirement);
    }
  }, [id, requirements]);

  if (!requirement) {
    // You can show a loading state here if you want
    return <div>Loading...</div>;
  }

  const relatedQuotations = getQuotationsForRequirement(requirement.id);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Requirement Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="secondary" className="mb-2">{requirement.category}</Badge>
              <CardTitle className="font-headline text-2xl">{requirement.title}</CardTitle>
            </div>
            <div className={`text-sm font-medium flex items-center gap-2 ${requirement.status === 'Purchased' ? 'text-accent' : 'text-blue-500'}`}>
                <span className={`h-2 w-2 rounded-full ${requirement.status === 'Purchased' ? 'bg-accent' : 'bg-blue-500'}`}></span>
                {requirement.status}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {requirement.location}</div>
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted on {format(new Date(requirement.createdAt), 'PPP')}</div>
            <div className="flex items-center gap-1.5"><Wrench className="w-4 h-4" /> By {requirement.homeownerName}</div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-6">{requirement.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{quote.shopOwnerName}</CardTitle>
                    <div className="flex items-center text-lg font-semibold text-primary">
                        <DollarSign className="w-5 h-5 mr-1" />
                        {quote.amount.toFixed(2)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 text-sm">
                    <FileText className="w-4 h-4 mt-1 text-muted-foreground" />
                    <p className="text-muted-foreground">{quote.terms}</p>
                  </div>
                   <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Expected by: {format(new Date(quote.deliveryDate), 'PPP')}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Purchased
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
    </div>
  );
}

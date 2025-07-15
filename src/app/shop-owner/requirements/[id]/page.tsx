'use client';

import { useRequirements } from '@/lib/store';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuotationForm } from '@/components/quotation-form';
import { MapPin, Calendar, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { Requirement } from '@/lib/types';


export default function ShopRequirementDetailPage() {
  const params = useParams();
  const { id } = params;

  const { requirements } = useRequirements();
  const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);

  useEffect(() => {
    if (id) {
        const foundRequirement = requirements.find(r => r.id === id);
        setRequirement(foundRequirement);
    }
  }, [id, requirements]);


  if (!requirement) {
    // You can add a loading skeleton or a message here
    return <div>Loading requirement...</div>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Requirement Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
            <Badge variant="secondary" className="mb-2 w-fit">{requirement.category}</Badge>
            <CardTitle className="font-headline text-2xl">{requirement.title}</CardTitle>
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
                <Image key={index} src={photo} alt={`${requirement.title} photo ${index + 1}`} width={300} height={200} className="rounded-lg object-cover" data-ai-hint="tools work" />
                ))}
            </div>
            </CardContent>
        </Card>
      </div>
      
      {/* Quotation Form */}
      <div className="lg:col-span-1">
        <QuotationForm requirement={requirement} />
      </div>
    </div>
  );
}

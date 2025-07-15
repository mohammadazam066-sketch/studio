
'use client';

import { getRequirementById } from '@/lib/store';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuotationForm } from '@/components/quotation-form';
import { MapPin, Calendar, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import type { Requirement } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';


function formatDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return format(dateObj, 'PPP');
}


export default function ShopRequirementDetailPage() {
  const params = useParams();
  const { id } = params;

  const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchRequirement = useCallback(async () => {
    if (typeof id !== 'string') return;
    setLoading(true);
    const foundRequirement = await getRequirementById(id);
    setRequirement(foundRequirement);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchRequirement();
  }, [fetchRequirement]);


  if (loading) {
    return <div>Loading requirement...</div>;
  }
  
  if (!requirement) {
    return <div>Requirement not found.</div>
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
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted on {formatDate(requirement.createdAt)}</div>
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

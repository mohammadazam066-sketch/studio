import { requirements } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuotationForm } from '@/components/quotation-form';
import { MapPin, Calendar, Wrench } from 'lucide-react';
import { format } from 'date-fns';

export default function ShopRequirementDetailPage({ params }: { params: { id: string } }) {
  const requirement = requirements.find(r => r.id === params.id);
  
  if (!requirement) {
    notFound();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Requirement Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
            <Badge variant="secondary" className="mb-2 w-fit">{requirement.category}</Badge>
            <CardTitle className="font-headline text-2xl">{requirement.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {requirement.location}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Posted on {format(requirement.createdAt, 'PPP')}</div>
                <div className="flex items-center gap-1.5"><Wrench className="w-4 h-4" /> By {requirement.homeownerName}</div>
            </div>
            </CardHeader>
            <CardContent>
            <p className="mb-6">{requirement.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

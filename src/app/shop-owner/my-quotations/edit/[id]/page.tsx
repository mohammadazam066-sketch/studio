
'use client';

import { useParams } from 'next/navigation';
import { getQuotationById } from '@/lib/store';
import { QuotationForm } from '@/components/quotation-form';
import type { Quotation, Requirement } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';
import { getRequirementById } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';


export default function EditQuotationPage() {
    const params = useParams();
    const { id } = params;
    
    const [quotation, setQuotation] = useState<Quotation | undefined>(undefined);
    const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const fetchQuotationAndRequirement = useCallback(async () => {
        if (typeof id !== 'string') return;
        setLoading(true);

        const quoteData = await getQuotationById(id);
        if (quoteData) {
            setQuotation(quoteData);
            const reqData = await getRequirementById(quoteData.requirementId);
            setRequirement(reqData);
        }

        setLoading(false);
    }, [id]);

    useEffect(() => {
        fetchQuotationAndRequirement();
    }, [fetchQuotationAndRequirement]);

    if (loading) {
        return (
            <div className="space-y-6">
                 <div>
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (!quotation || !requirement) {
        return <div>Quotation or Requirement not found.</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Edit Quotation</h1>
                <p className="text-muted-foreground">You are editing your quote for: <span className="font-semibold text-primary">{requirement.title}</span></p>
            </div>
            <QuotationForm 
                requirement={requirement} 
                existingQuotation={quotation}
            />
        </div>
    )
}

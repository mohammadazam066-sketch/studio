
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Requirement, Quotation } from '@/lib/types';
import { getQuotationCategory } from '@/lib/actions';
import type { CategorizeQuotationOutput } from '@/ai/flows/categorize-quotation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { addQuotation, updateQuotation } from '@/lib/store';
import { Timestamp } from 'firebase/firestore';

interface QuotationFormProps {
    requirement: Requirement;
    existingQuotation?: Quotation;
}

export function QuotationForm({ requirement, existingQuotation }: QuotationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const isEditMode = !!existingQuotation;

  const [amount, setAmount] = useState<number | string>(existingQuotation?.amount ?? '');
  const [date, setDate] = useState<Date | undefined>(existingQuotation?.deliveryDate ? (existingQuotation.deliveryDate as Timestamp).toDate() : undefined);
  const [terms, setTerms] = useState<string>(existingQuotation?.terms ?? '');
  const [shopOwnerName, setShopOwnerName] = useState<string>(existingQuotation?.shopOwnerName ?? '');
  const [shopName, setShopName] = useState<string>(existingQuotation?.shopName ?? '');
  
  const [loading, setLoading] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiResult, setAiResult] = useState<CategorizeQuotationOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleCategorize = async () => {
    if (!terms) {
      setAiError("Please enter some terms or a description for the AI to categorize.");
      return;
    }
    setIsCategorizing(true);
    setAiError(null);
    setAiResult(null);

    try {
      const result = await getQuotationCategory({
        quotationText: terms,
        requirementCategory: requirement.category,
      });
      setAiResult(result);
    } catch (error) {
      setAiError("AI categorization failed. Please try again.");
      console.error(error);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!date) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please select an expected delivery date.",
        });
        setLoading(false);
        return;
    }

    try {
        if (isEditMode) {
            const updatedQuotationData = {
                amount: Number(amount),
                terms,
                deliveryDate: Timestamp.fromDate(date),
                shopOwnerName,
                shopName,
            };
            await updateQuotation(existingQuotation.id, updatedQuotationData);
            toast({
                title: "Quotation Updated!",
                description: "Your changes have been saved successfully.",
            });
            router.push('/shop-owner/my-quotations');
        } else {
            const newQuotation: Omit<Quotation, 'id' | 'createdAt' | 'shopOwnerId'> = {
                requirementId: requirement.id,
                shopOwnerName,
                shopName,
                amount: Number(amount),
                terms: terms,
                deliveryDate: Timestamp.fromDate(date),
            };
            await addQuotation(newQuotation);
            toast({
                title: "Quotation Submitted!",
                description: "The homeowner has been notified of your quote.",
            });
            router.push('/shop-owner/dashboard');
        }
        router.refresh();
    } catch (error) {
        console.error(`Failed to ${isEditMode ? 'update' : 'submit'} quotation:`, error);
        toast({ variant: 'destructive', title: 'Error', description: `Failed to ${isEditMode ? 'update' : 'submit'} quotation.` });
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="sticky top-8">
        <CardHeader>
          <CardTitle className="font-headline">{isEditMode ? 'Edit Quotation' : 'Submit Quotation'}</CardTitle>
          <CardDescription>{isEditMode ? 'Update your quote for this project.' : 'Provide your quote for this project.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopOwnerName">Your Name</Label>
            <Input id="shopOwnerName" name="shopOwnerName" type="text" placeholder="e.g., Jane Smith" required disabled={loading} value={shopOwnerName} onChange={(e) => setShopOwnerName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input id="shopName" name="shopName" type="text" placeholder="e.g., Smith's Hardware" required disabled={loading} value={shopName} onChange={(e) => setShopName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Rs)</Label>
            <Input id="amount" name="amount" type="number" placeholder="e.g., 450.00" required disabled={loading} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryDate">Expected Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Description</Label>
            <Textarea 
              id="terms" 
              name="terms"
              placeholder="Describe the scope of work, payment terms, etc." 
              required
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <Button type="button" variant="outline" className="w-full" onClick={handleCategorize} disabled={isCategorizing || loading}>
              {isCategorizing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Categorize with AI
            </Button>
            {aiError && <p className="text-sm text-destructive">{aiError}</p>}
            {aiResult && (
               <Alert>
                 <Wand2 className="h-4 w-4" />
                 <AlertTitle>AI Suggestion</AlertTitle>
                 <AlertDescription>
                   Category: <span className="font-semibold">{aiResult.category}</span><br/>
                   Template: <span className="font-semibold">{aiResult.templateName}</span>
                 </AlertDescription>
               </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Submit Quotation'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

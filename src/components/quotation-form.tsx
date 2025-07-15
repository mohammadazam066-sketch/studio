
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
import type { Requirement, Quotation, ShopOwnerProfile } from '@/lib/types';
import { getQuotationCategory } from '@/lib/actions';
import type { CategorizeQuotationOutput } from '@/ai/flows/categorize-quotation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { addQuotation, getProfile, useAuth } from '@/lib/store';
import { Timestamp } from 'firebase/firestore';

export function QuotationForm({ requirement }: { requirement: Requirement }) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [date, setDate] = useState<Date>();
  const [terms, setTerms] = useState<string>('');
  const [profile, setProfile] = useState<ShopOwnerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiResult, setAiResult] = useState<CategorizeQuotationOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!currentUser) return;
    const existingProfile = await getProfile(currentUser.id);
    if (existingProfile) {
      setProfile(existingProfile as ShopOwnerProfile);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


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
    const formData = new FormData(e.currentTarget);

    if (!date) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please select an expected delivery date.",
        });
        setLoading(false);
        return;
    }
    
    if (!profile || !currentUser || !currentUser.email) {
        toast({
            variant: "destructive",
            title: "Profile Error",
            description: "Could not load shop owner profile. Please try again.",
        });
        setLoading(false);
        return;
    }

    const newQuotation: Omit<Quotation, 'id' | 'createdAt'> = {
        requirementId: requirement.id,
        shopOwnerId: currentUser.id,
        shopOwnerName: profile.name,
        shopName: profile.shopName,
        shopOwnerEmail: currentUser.email,
        shopOwnerPhone: profile.phoneNumber,
        amount: Number(formData.get('amount')),
        terms: formData.get('terms') as string,
        deliveryDate: Timestamp.fromDate(date),
    };

    try {
        await addQuotation(newQuotation);
        toast({
          title: "Quotation Submitted!",
          description: "The homeowner has been notified of your quote.",
        });
        router.push('/shop-owner/dashboard');
        router.refresh();
    } catch (error) {
        console.error("Failed to submit quotation:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit quotation.' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="sticky top-8">
        <CardHeader>
          <CardTitle className="font-headline">Submit Quotation</CardTitle>
          <CardDescription>Provide your quote for this project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Rs)</Label>
            <Input id="amount" name="amount" type="number" placeholder="e.g., 450.00" required disabled={loading} />
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
            Submit Quotation
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}



'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addQuotation, updateQuotation, useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Requirement, Quotation } from '@/lib/types';
import { useEffect } from 'react';

const quotationFormSchema = z.object({
  materialAmount: z.coerce.number().min(0, "Amount must be zero or more."),
  transportationCharges: z.coerce.number().min(0).optional(),
  deliveryDate: z.date({
    required_error: "An expected delivery date is required.",
  }),
  terms: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

interface QuotationFormProps {
    requirement: Requirement;
    existingQuotation?: Quotation;
}

export function QuotationForm({ requirement, existingQuotation }: QuotationFormProps) {
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    // Convert Firestore Timestamp to Date for the form, if editing
    const defaultDeliveryDate = existingQuotation?.deliveryDate
        ? new Date((existingQuotation.deliveryDate as any).seconds * 1000)
        : undefined;

    const form = useForm<QuotationFormValues>({
        resolver: zodResolver(quotationFormSchema),
        defaultValues: {
            materialAmount: existingQuotation?.materialAmount || undefined,
            transportationCharges: existingQuotation?.transportationCharges || undefined,
            terms: existingQuotation?.terms || '',
            deliveryDate: defaultDeliveryDate,
        }
    });
    
    const {formState: { isSubmitting }, watch} = form;

    const materialAmount = watch('materialAmount') || 0;
    const transportationCharges = watch('transportationCharges') || 0;
    const totalAmount = (Number(materialAmount) || 0) + (Number(transportationCharges) || 0);
    
    const title = existingQuotation ? 'Edit Your Quotation' : 'Submit Your Quotation';
    const description = existingQuotation ? 'Update the details of your quotation below.' : 'Fill out the form to send your quotation to the homeowner.';
    const buttonText = existingQuotation ? 'Save Changes' : 'Submit Quotation';


    async function onSubmit(data: QuotationFormValues) {
        if (!currentUser || !requirement) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit quotation. User or requirement data is missing.' });
            return;
        }

        const submissionData = {
          ...data,
          totalAmount: (data.materialAmount || 0) + (data.transportationCharges || 0),
        };

        try {
            if (existingQuotation) {
                // Update existing quotation
                await updateQuotation(existingQuotation.id, submissionData);
                 toast({
                    title: 'Quotation Updated!',
                    description: 'Your changes have been saved.',
                });
                router.push('/shop-owner/my-quotations');
            } else {
                // Add new quotation
                 await addQuotation({
                    ...submissionData,
                    requirementId: requirement.id,
                });
                toast({
                    title: 'Quotation Submitted!',
                    description: 'The homeowner has been notified.',
                    className: 'bg-accent text-accent-foreground'
                });
                router.push('/shop-owner/dashboard');
            }
             router.refresh();

        } catch (error) {
            console.error('Quotation submission error:', error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'An unexpected error occurred.' });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="materialAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Material Amount (Rs)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 45000"
                                            {...field}
                                            value={field.value ?? ''}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="transportationCharges"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transportation Charges (Rs)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g., 500"
                                            {...field}
                                            value={field.value ?? ''}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                     <FormDescription>
                                        Enter 0 if transport is free.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="p-4 bg-muted/80 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold">Total Quotation Amount (Rs)</span>
                                <span className="text-lg font-bold flex items-center">
                                    <IndianRupee className="w-4 h-4 mr-1"/>
                                    {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>


                         <FormField
                            control={form.control}
                            name="deliveryDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Expected Delivery Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={isSubmitting}
                                            >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0); // Set to the beginning of today
                                                    return date < today || isSubmitting;
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="terms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Terms & Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., 50% advance payment, delivery within 2 days of confirmation..." {...field} disabled={isSubmitting} rows={4} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {buttonText}
                        </Button>
                    </CardFooter>
                </form>
             </Form>
        </Card>
    );
}

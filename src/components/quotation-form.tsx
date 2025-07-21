
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addQuotation, updateQuotation, useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Requirement, Quotation } from '@/lib/types';

const quotationFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
  terms: z.string().optional(),
  deliveryDate: z.date({
    required_error: "An expected delivery date is required.",
  }),
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
            amount: existingQuotation?.amount || undefined,
            terms: existingQuotation?.terms || '',
            deliveryDate: defaultDeliveryDate,
        }
    });
    
    const {formState: { isSubmitting }} = form;
    
    const title = existingQuotation ? 'Edit Your Quotation' : 'Submit Your Quotation';
    const description = existingQuotation ? 'Update the details of your quotation below.' : 'Fill out the form to send your quotation to the homeowner.';
    const buttonText = existingQuotation ? 'Save Changes' : 'Submit Quotation';


    async function onSubmit(data: QuotationFormValues) {
        if (!currentUser || !requirement) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit quotation. User or requirement data is missing.' });
            return;
        }

        try {
            if (existingQuotation) {
                // Update existing quotation
                await updateQuotation(existingQuotation.id, {
                    ...data,
                });
                 toast({
                    title: 'Quotation Updated!',
                    description: 'Your changes have been saved.',
                });
                router.push('/shop-owner/my-quotations');
            } else {
                // Add new quotation
                 await addQuotation({
                    ...data,
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
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quotation Amount (Rs)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 50000" {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                                disabled={(date) => date < new Date() || isSubmitting}
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

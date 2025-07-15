'use server';

import { categorizeQuotation as categorizeQuotationFlow, type CategorizeQuotationInput } from '@/ai/flows/categorize-quotation';
import { z } from 'zod';

const ActionInputSchema = z.object({
  quotationText: z.string(),
  requirementCategory: z.string(),
});

export async function getQuotationCategory(input: CategorizeQuotationInput) {
  const parsedInput = ActionInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error('Invalid input');
  }

  try {
    const result = await categorizeQuotationFlow(parsedInput.data);
    return result;
  } catch (error) {
    console.error('Error in AI categorization flow:', error);
    throw new Error('Failed to categorize quotation.');
  }
}

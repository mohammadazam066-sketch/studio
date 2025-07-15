// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview AI agent that categorizes quotations from shop owners and uses appropriate templates.
 *
 * - categorizeQuotation - A function that handles the quotation categorization process.
 * - CategorizeQuotationInput - The input type for the categorizeQuotation function.
 * - CategorizeQuotationOutput - The return type for the categorizeQuotation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeQuotationInputSchema = z.object({
  quotationText: z
    .string()
    .describe('The quotation text to categorize, provided by the shop owner.'),
  requirementCategory: z
    .string()
    .describe('The category of the homeowner requirement.'),
});
export type CategorizeQuotationInput = z.infer<typeof CategorizeQuotationInputSchema>;

const CategorizeQuotationOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The categorized type of quotation.  For example: Plumbing, Electrical, Carpentry, or General Construction.'
    ),
  templateName: z
    .string()
    .describe(
      'The name of the template that should be used for this type of quotation.'
    ),
});
export type CategorizeQuotationOutput = z.infer<typeof CategorizeQuotationOutputSchema>;

export async function categorizeQuotation(input: CategorizeQuotationInput): Promise<CategorizeQuotationOutput> {
  return categorizeQuotationFlow(input);
}

const categorizeQuotationPrompt = ai.definePrompt({
  name: 'categorizeQuotationPrompt',
  input: {schema: CategorizeQuotationInputSchema},
  output: {schema: CategorizeQuotationOutputSchema},
  prompt: `You are an expert in understanding quotations and categorizing them based on their content and the related requirement category.

  Given the following quotation text and requirement category, determine the most appropriate category for the quotation and the name of the template to use.

  Quotation Text: {{{quotationText}}}
  Requirement Category: {{{requirementCategory}}}

  Return a JSON object with the category and templateName.
`,
});

const categorizeQuotationFlow = ai.defineFlow(
  {
    name: 'categorizeQuotationFlow',
    inputSchema: CategorizeQuotationInputSchema,
    outputSchema: CategorizeQuotationOutputSchema,
  },
  async input => {
    const {output} = await categorizeQuotationPrompt(input);
    return output!;
  }
);

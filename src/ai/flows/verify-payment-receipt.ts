'use server';

/**
 * @fileOverview This flow uses AI to verify the accuracy of tenant-submitted payment receipts.
 *
 * - verifyPaymentReceipt - A function that handles the payment receipt verification process.
 * - VerifyPaymentReceiptInput - The input type for the verifyPaymentReceipt function.
 * - VerifyPaymentReceiptOutput - The return type for the verifyPaymentReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyPaymentReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      'A photo of a payment receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  invoiceId: z.string().describe('The ID of the invoice being paid.'),
  expectedAmount: z.number().describe('The expected payment amount for the invoice.'),
  tenantName: z.string().describe('The name of the tenant submitting the payment.'),
  propertyName: z.string().describe('The name of the property the tenant is renting.'),
});
export type VerifyPaymentReceiptInput = z.infer<typeof VerifyPaymentReceiptInputSchema>;

const VerifyPaymentReceiptOutputSchema = z.object({
  isAccurate: z.boolean().describe('Whether the payment receipt is accurate and matches the expected amount.'),
  extractedAmount: z.number().optional().describe('The amount extracted from the receipt, if available.'),
  notes: z.string().describe('Any notes or discrepancies found in the receipt.'),
});
export type VerifyPaymentReceiptOutput = z.infer<typeof VerifyPaymentReceiptOutputSchema>;

export async function verifyPaymentReceipt(input: VerifyPaymentReceiptInput): Promise<VerifyPaymentReceiptOutput> {
  return verifyPaymentReceiptFlow(input);
}

const verifyPaymentReceiptPrompt = ai.definePrompt({
  name: 'verifyPaymentReceiptPrompt',
  input: {schema: VerifyPaymentReceiptInputSchema},
  output: {schema: VerifyPaymentReceiptOutputSchema},
  prompt: `You are an AI assistant helping property managers verify payment receipts submitted by tenants.\n\nYou will receive an image of a payment receipt, the expected payment amount, the invoice ID, tenant name, and property name. Your task is to determine if the receipt is accurate and matches the expected amount.\n\nAnalyze the receipt image and extract the payment amount. Compare the extracted amount with the expected amount. If they match, indicate that the receipt is accurate. If there are discrepancies, provide notes explaining the differences.\n\nHere is the information:\nTenant Name: {{{tenantName}}}\nProperty Name: {{{propertyName}}}\nInvoice ID: {{{invoiceId}}}\nExpected Amount: {{{expectedAmount}}}\nReceipt Image: {{media url=receiptDataUri}}\n\nRespond with whether the receipt is accurate, the extracted amount (if available), and any relevant notes.\n`,
});

const verifyPaymentReceiptFlow = ai.defineFlow(
  {
    name: 'verifyPaymentReceiptFlow',
    inputSchema: VerifyPaymentReceiptInputSchema,
    outputSchema: VerifyPaymentReceiptOutputSchema,
  },
  async input => {
    const {output} = await verifyPaymentReceiptPrompt(input);
    return output!;
  }
);

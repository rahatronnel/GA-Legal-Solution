// src/ai/flows/label-plot-uploads.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that analyzes newly uploaded plot images and suggests relevant labels.
 *
 * - `labelPlotUploads`:  The function that initiates the plot image analysis and label suggestion process.
 * - `LabelPlotUploadsInput`: The input type for the `labelPlotUploads` function, which includes the image data URI.
 * - `LabelPlotUploadsOutput`: The output type for the `labelPlotUploads` function, which includes a list of suggested labels.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LabelPlotUploadsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the plot, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});

export type LabelPlotUploadsInput = z.infer<typeof LabelPlotUploadsInputSchema>;

const LabelPlotUploadsOutputSchema = z.object({
  suggestedLabels: z
    .array(z.string())
    .describe('A list of suggested labels for the plot image.'),
});

export type LabelPlotUploadsOutput = z.infer<typeof LabelPlotUploadsOutputSchema>;

export async function labelPlotUploads(input: LabelPlotUploadsInput): Promise<LabelPlotUploadsOutput> {
  return labelPlotUploadsFlow(input);
}

const labelPlotUploadsPrompt = ai.definePrompt({
  name: 'labelPlotUploadsPrompt',
  input: {schema: LabelPlotUploadsInputSchema},
  output: {schema: LabelPlotUploadsOutputSchema},
  prompt: `Analyze the image of the plot and suggest relevant labels to categorize and describe its visual content.

   Image: {{media url=photoDataUri}}

   Provide a list of labels that are concise and descriptive.`,
});

const labelPlotUploadsFlow = ai.defineFlow(
  {
    name: 'labelPlotUploadsFlow',
    inputSchema: LabelPlotUploadsInputSchema,
    outputSchema: LabelPlotUploadsOutputSchema,
  },
  async input => {
    const {output} = await labelPlotUploadsPrompt(input);
    return output!;
  }
);

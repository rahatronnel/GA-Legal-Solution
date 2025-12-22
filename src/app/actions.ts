'use server';

import { labelPlotUploads } from '@/ai/flows/label-plot-uploads';
import { z } from 'zod';

const UploadSchema = z.object({
  photoDataUri: z.string().refine((uri) => uri.startsWith('data:image/'), {
    message: 'Invalid image data URI',
  }),
});

type FormState = {
  success: boolean;
  message: string;
  suggestedLabels?: string[];
};

export async function handleImageUpload(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const photoDataUri = formData.get('photoDataUri') as string;

  const validatedFields = UploadSchema.safeParse({ photoDataUri });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input. Please provide a valid image.',
    };
  }

  try {
    const result = await labelPlotUploads({
      photoDataUri: validatedFields.data.photoDataUri,
    });

    if (result.suggestedLabels && result.suggestedLabels.length > 0) {
      return {
        success: true,
        message: 'Analysis complete.',
        suggestedLabels: result.suggestedLabels,
      };
    } else {
      return {
        success: true,
        message: 'Analysis complete, but no specific labels were suggested.',
        suggestedLabels: [],
      };
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      success: false,
      message: 'An error occurred during AI analysis. Please try again.',
    };
  }
}

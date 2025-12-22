'use client';

import { handleImageUpload } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, Lightbulb, Loader, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Lightbulb className="mr-2 h-4 w-4" />
      )}
      Analyze with AI
    </Button>
  );
}

export function UploadPlotImage() {
  const initialState = { success: false, message: '', suggestedLabels: [] };
  const [state, formAction] = useFormState(handleImageUpload, initialState);
  const { toast } = useToast();

  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        // Automatically submit form when a file is selected
        setTimeout(() => formRef.current?.requestSubmit(), 0);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: state.message,
      });
    }
  }, [state, toast]);

  const handleDelete = () => {
    setPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    // In a real app, you would also call a server action to delete the image from storage.
    toast({
        title: 'Image Removed',
        description: 'The plot image has been removed.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plot Image Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div
            className="relative flex aspect-video w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/50 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <Image
                src={preview}
                alt="Plot preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12" />
                <p>Click to upload an image</p>
              </div>
            )}
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            name="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          {preview && <input type="hidden" name="photoDataUri" value={preview} />}

          {preview && (
            <div className="flex justify-between items-start gap-4">
                <div>
                    {state.suggestedLabels && state.suggestedLabels.length > 0 && (
                        <div className="space-y-2">
                        <h4 className="font-semibold">Suggested Labels:</h4>
                        <div className="flex flex-wrap gap-2">
                            {state.suggestedLabels.map((label) => (
                            <Badge key={label} variant="secondary">
                                {label}
                            </Badge>
                            ))}
                        </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <SubmitButton />
                    <Button variant="destructive" size="icon" onClick={handleDelete} type="button">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Image</span>
                    </Button>
                </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

const propertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(1, 'Price must be a positive number'),
  type: z.enum(['flat', 'plot'], {
    required_error: 'You need to select a property type.',
  }),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

export default function AddPropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
    },
  });

  const onSubmit = async (data: PropertyFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be signed in to add a property. Signing you in anonymously.',
      });
      initiateAnonymousSignIn(auth);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const propertiesCollection = collection(firestore, 'properties');
      
      // Awaiting here is fine as it's a user-triggered action, not a render effect.
      await addDocumentNonBlocking(propertiesCollection, {
        ...data,
        ownerId: user.uid,
        // Mocking some data that is not in the form
        imageIds: ['prop-1-1'],
        agent: { name: 'New Agent', phone: '555-555-5555', avatarId: 'agent-1' },
        details: { area: 1500 },
        isNearRoad: false,
      });

      toast({
        title: 'Property Added!',
        description: 'Your new property has been successfully listed.',
      });
      router.push('/');
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem adding your property.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Add a New Property</CardTitle>
          <CardDescription>
            Fill out the form below to list a new property.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Modern Downtown Flat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., A stunning 2-bedroom flat in the heart of the city."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="450000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="plot">Plot</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting || isUserLoading} className="w-full">
                {isSubmitting ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Property
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

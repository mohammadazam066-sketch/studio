
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addRequirement, updateRequirement, useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Requirement } from '@/lib/types';
import { Label } from '@/components/ui/label';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const requirementFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  category: z.string({ required_error: "Please select a category." }),
  location: z.string().min(2, { message: "Location is required." }),
  description: z.string().optional(),
});

type RequirementFormValues = z.infer<typeof requirementFormSchema>;
type PhotoState = { file: File, preview: string };

interface RequirementFormProps {
    existingRequirement?: Requirement;
}

export function RequirementForm({ existingRequirement }: RequirementFormProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(existingRequirement?.photos || []);


  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: {
      title: existingRequirement?.title || '',
      category: existingRequirement?.category || '',
      location: existingRequirement?.location || '',
      description: existingRequirement?.description || '',
    },
  });

  const { formState: { isSubmitting } } = form;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: PhotoState[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: "destructive", title: "File too large", description: `${file.name} is over 5MB.` });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: `Only JPG, PNG, and WEBP are accepted.` });
        return;
      }
      newPhotos.push({ file, preview: URL.createObjectURL(file) });
    });

    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = ''; // Reset file input
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingPhoto = (url: string) => {
    setExistingPhotos(prev => prev.filter(photoUrl => photoUrl !== url));
  }


  async function onSubmit(data: RequirementFormValues) {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    const newPhotosAsDataUrls = await Promise.all(
        photos.map(photo => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(photo.file);
            });
        })
    );

    try {
        if (existingRequirement) {
            // Update logic
             await updateRequirement(existingRequirement.id, data, newPhotosAsDataUrls, existingPhotos);
             toast({
                title: 'Requirement Updated!',
                description: 'Your requirement has been successfully updated.',
             });
             router.push(`/homeowner/requirements/${existingRequirement.id}`);

        } else {
            // Create logic
            await addRequirement(data, newPhotosAsDataUrls);
            toast({
                title: 'Requirement Posted!',
                description: 'Shop owners in your area will now be able to see your requirement.',
                className: 'bg-accent text-accent-foreground'
            });
            router.push('/homeowner/dashboard');
        }
        router.refresh();

    } catch (error) {
      console.error('Requirement submission error:', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'An unexpected error occurred.' });
    }
  }
  
  const title = existingRequirement ? 'Edit Your Requirement' : 'Post a New Requirement';
  const description = existingRequirement ? 'Update the details of your requirement below.' : 'Fill out the form to get quotations from local shop owners.';
  const buttonText = existingRequirement ? 'Save Changes' : 'Post Requirement';


  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold font-headline tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                <FormLabel>Requirement Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 80 bags of ACC cement and 80 10mm TMT rods" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a material category" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Cement">Cement</SelectItem>
                                            <SelectItem value="Steel">Steel (TMT Bars)</SelectItem>
                                            <SelectItem value="Bricks & Blocks">Bricks & Blocks</SelectItem>
                                            <SelectItem value="Sand & Aggregates">Sand & Aggregates</SelectItem>
                                            <SelectItem value="Plumbing">Plumbing & Sanitaryware</SelectItem>
                                            <SelectItem value="Electrical">Electrical Supplies</SelectItem>
                                            <SelectItem value="Paints & Finishes">Paints & Finishes</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Site Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Jayanagar, Bangalore" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                <FormLabel>Detailed Description (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Describe your requirement in detail. Include brands, quantities, and any specific needs." {...field} disabled={isSubmitting} rows={6} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2 md:col-span-2">
                            <Label>Site Photos (Optional)</Label>
                            <CardDescription>Add photos of your site or material specifications.</CardDescription>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {existingPhotos.map((url) => (
                                    <div key={url} className="relative group">
                                        <Image src={url} alt="Existing photo" width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeExistingPhoto(url)}
                                            disabled={isSubmitting}
                                            >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {photos.map((photo, index) => (
                                    <div key={photo.preview} className="relative group">
                                        <Image src={photo.preview} alt="Upload preview" width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removePhoto(index)}
                                            disabled={isSubmitting}
                                            >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg ${isSubmitting ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-secondary hover:bg-muted'}`}>
                                        <div className="flex flex-col items-center justify-center text-center p-2">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground"><span className="font-semibold">Add photos</span></p>
                                        </div>
                                        <Input id="dropzone-file" type="file" className="hidden" onChange={handlePhotoUpload} accept="image/png, image/jpeg, image/webp" multiple disabled={isSubmitting} />
                                    </label>
                                </div> 
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {buttonText}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}

    
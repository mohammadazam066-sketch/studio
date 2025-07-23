

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, addUpdate } from '@/lib/store';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const updateFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }),
});

type UpdateFormValues = z.infer<typeof updateFormSchema>;
type PhotoState = { file: File, preview: string };

interface UpdatePostFormProps {
    onPostSuccess?: () => void;
    className?: string;
}

export function UpdatePostForm({ onPostSuccess, className }: UpdatePostFormProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<PhotoState[]>([]);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const { formState: { isSubmitting }, reset } = form;

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
    const photoToRemove = photos[index];
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: UpdateFormValues) {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not signed in', description: 'You must be logged in to post an update.' });
      return;
    }
    
    let photosDataUrls: string[] = [];
    if (photos.length > 0) {
        photosDataUrls = await Promise.all(
            photos.map(photo => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(photo.file);
                });
            })
        );
    }

    try {
        await addUpdate({ title: data.title, content: data.content }, photosDataUrls);
        toast({
            title: "Post Published!",
            description: "Your update is now live for the community to see.",
            className: 'bg-accent text-accent-foreground border-accent'
        });
        reset();
        setPhotos([]);
        onPostSuccess?.();
    } catch (error) {
        console.error("Failed to post update:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to publish your post. Please try again."
        });
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New Eco-Friendly Bricks" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Share the details..." {...field} disabled={isSubmitting} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label htmlFor="photo">Images (Optional)</Label>
                <div className="grid grid-cols-3 gap-4">
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
             <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Post
                </Button>
            </div>
          </div>
      </form>
    </Form>
  );
}

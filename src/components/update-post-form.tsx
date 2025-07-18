
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, addUpdate } from '@/lib/store';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Upload, X, Newspaper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const updateFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }),
});

type UpdateFormValues = z.infer<typeof updateFormSchema>;
type PhotoState = { file: File, preview: string };

interface UpdatePostFormProps {
    onPostSuccess?: () => void;
}

export function UpdatePostForm({ onPostSuccess }: UpdatePostFormProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [photo, setPhoto] = useState<PhotoState | null>(null);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const { formState: { isSubmitting }, reset } = form;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: "destructive", title: "File too large", description: `${file.name} is over 5MB.` });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: `Only JPG, PNG, and WEBP are accepted.` });
        return;
      }
      setPhoto({ file, preview: URL.createObjectURL(file) });
      e.target.value = ''; // Reset file input
    }
  };

  const removePhoto = () => {
    if (photo) {
      URL.revokeObjectURL(photo.preview);
    }
    setPhoto(null);
  };

  async function onSubmit(data: UpdateFormValues) {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not signed in', description: 'You must be logged in to post an update.' });
      return;
    }
    
    let photoData: string | undefined;
    if (photo) {
        photoData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(photo.file);
        });
    }

    try {
        await addUpdate({ title: data.title, content: data.content }, photoData);
        toast({
            title: "Post Published!",
            description: "Your update is now live for the community to see.",
            className: 'bg-accent text-accent-foreground border-accent'
        });
        reset();
        removePhoto();
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
  
  if (!currentUser) {
      return (
         <Card>
            <CardHeader>
                <CardTitle>Join the Conversation</CardTitle>
                <CardDescription>Log in to share your knowledge and updates with the community.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full"><a href="/auth/login">Login or Sign Up</a></Button>
            </CardContent>
        </Card>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Newspaper className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Share an Update</CardTitle>
                <CardDescription>Post news, tips, or insights.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="photo">Image (Optional)</Label>
              {photo ? (
                <div className="relative group w-fit">
                    <Image src={photo.preview} alt="Upload preview" width={200} height={150} className="rounded-lg object-cover w-full aspect-video" />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={removePhoto}
                        disabled={isSubmitting}
                        >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
              ) : (
                 <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${isSubmitting ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-secondary hover:bg-muted'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                        </div>
                        <Input id="dropzone-file" type="file" className="hidden" onChange={handlePhotoUpload} accept="image/png, image/jpeg" disabled={isSubmitting} />
                    </label>
                </div> 
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish Post
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

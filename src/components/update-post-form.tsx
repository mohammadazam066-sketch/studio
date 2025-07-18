
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X, Newspaper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addUpdate, useAuth } from '@/lib/store';
import Image from 'next/image';

type PhotoState = { file: File, preview: string };

export function UpdatePostForm({ onPostSuccess }: { onPostSuccess: () => void }) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto({ file, preview: URL.createObjectURL(file) });
    }
  };

  const handleRemovePhoto = () => {
    if (photo) {
      URL.revokeObjectURL(photo.preview);
      setPhoto(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to post an update.'});
        return;
    }
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    let photoDataUrl: string | undefined;
    if (photo) {
        photoDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(photo.file);
        });
    }

    try {
        await addUpdate({
            title,
            content,
            imageUrl: photoDataUrl,
            authorId: currentUser.id,
            authorName: currentUser.username,
            authorRole: currentUser.role
        });
        toast({
          title: "Update Posted!",
          description: "Your post is now live in the updates feed.",
        });
        // Clear the form
        (e.target as HTMLFormElement).reset();
        setPhoto(null);
        // Notify parent component to refetch data
        onPostSuccess();
    } catch (error) {
        console.error("Failed to post update:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to post your update. Please try again."
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Newspaper className="h-6 w-6" />
            <div>
                <CardTitle>Create a New Post</CardTitle>
                <CardDescription>Share a news update or knowledge with the community.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="e.g., New Eco-Friendly Bricks Available" required disabled={loading} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" placeholder="Write your update here..." required disabled={loading} />
            </div>
            
            <div className="space-y-2">
                 <Label htmlFor="photo">Optional Image</Label>
                 {photo ? (
                    <div className="relative group w-fit">
                        <Image src={photo.preview} alt="Upload preview" width={200} height={150} className="rounded-lg object-cover w-full aspect-video" />
                        <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemovePhoto}
                        disabled={loading}
                        >
                        <X className="h-4 w-4" />
                        </Button>
                    </div>
                 ) : (
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${loading ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-secondary hover:bg-muted'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handlePhotoUpload} accept="image/png, image/jpeg" disabled={loading} />
                        </label>
                    </div> 
                 )}
            </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || !currentUser}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Update
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

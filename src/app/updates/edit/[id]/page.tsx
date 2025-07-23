

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUpdateById, updateUpdate, useAuth } from '@/lib/store';
import Image from 'next/image';
import type { Update } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


type PhotoState = { file: File, preview: string };

function EditUpdateSkeleton() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="space-y-2 mb-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
            </div>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-32 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    )
}

export default function EditUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [update, setUpdate] = useState<Update | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [newPhotos, setNewPhotos] = useState<PhotoState[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUpdate = useCallback(async () => {
    if (typeof id !== 'string') return;
    setLoading(true);
    const updateData = await getUpdateById(id);
    if (!updateData || !currentUser || updateData.authorId !== currentUser.id) {
        toast({ variant: "destructive", title: "Unauthorized", description: "You cannot edit this post." });
        router.push('/updates');
        return;
    }
    setUpdate(updateData);
    setTitle(updateData.title);
    setContent(updateData.content);
    setExistingImageUrls(updateData.imageUrls || []);
    setLoading(false);
  }, [id, currentUser, router, toast]);

  useEffect(() => {
    fetchUpdate();
  }, [fetchUpdate]);


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const photosToUpload: PhotoState[] = [];

    files.forEach(file => {
      photosToUpload.push({ file, preview: URL.createObjectURL(file) });
    });

    setNewPhotos(prev => [...prev, ...photosToUpload]);
    e.target.value = '';
  };

  const removeNewPhoto = (index: number) => {
    const photoToRemove = newPhotos[index];
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
   const removeExistingPhoto = (url: string) => {
    setExistingImageUrls(prev => prev.filter(photoUrl => photoUrl !== url));
  }


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!update) return;
    setSaving(true);
    
    const newPhotosAsDataUrls = await Promise.all(
        newPhotos.map(photo => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(photo.file);
            });
        })
    );


    try {
        await updateUpdate(update.id, { title, content }, newPhotosAsDataUrls, existingImageUrls);
        toast({
          title: "Update Saved!",
          description: "Your post has been successfully updated.",
        });
        router.push(`/updates/${update.id}`);
        router.refresh();
    } catch (error) {
        console.error("Failed to save update:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save your update. Please try again."
        });
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
    return <EditUpdateSkeleton />;
  }

  if (!update) {
    return null; // Should have been redirected
  }


  return (
    <div className="max-w-2xl mx-auto">
        <div className="mb-6">
            <h1 className="text-2xl font-bold font-headline tracking-tight">Edit Post</h1>
            <p className="text-muted-foreground">Make changes to your community update.</p>
        </div>
        <form onSubmit={handleSubmit}>
        <Card>
            <CardHeader>
                <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={saving} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea id="content" name="content" value={content} onChange={(e) => setContent(e.target.value)} required disabled={saving} rows={6} />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="photo">Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {existingImageUrls.map((url) => (
                            <div key={url} className="relative group">
                                <Image src={url} alt="Existing photo" width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeExistingPhoto(url)}
                                    disabled={saving}
                                    >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {newPhotos.map((photo, index) => (
                            <div key={photo.preview} className="relative group">
                                <Image src={photo.preview} alt="Upload preview" width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeNewPhoto(index)}
                                    disabled={saving}
                                    >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg ${saving ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-secondary hover:bg-muted'}`}>
                                <div className="flex flex-col items-center justify-center text-center p-2">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground"><span className="font-semibold">Add photos</span></p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" onChange={handlePhotoUpload} accept="image/png, image/jpeg, image/webp" multiple disabled={saving} />
                            </label>
                        </div> 
                    </div>
                </div>
            </CardContent>
            <CardFooter>
            <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
            </CardFooter>
        </Card>
        </form>
    </div>
  );
}

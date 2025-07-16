
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addRequirement } from '@/lib/store';
import type { Requirement } from '@/lib/types';
import React, { useState } from 'react';
import Image from 'next/image';

type PhotoState = { file: File, preview: string };

export function RequirementForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (photos.length + files.length > 5) {
        toast({
          variant: "destructive",
          title: "Upload Limit Exceeded",
          description: "You can upload a maximum of 5 photos.",
        });
        return;
      }
      const newPhotos: PhotoState[] = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(photos[index].preview);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const photoDataUrls = await Promise.all(
        photos.map(p => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(p.file);
            });
        })
    );

    const newRequirement: Omit<Requirement, 'id' | 'createdAt' | 'homeownerId' | 'homeownerName' | 'status'> = {
      title: formData.get('title') as string,
      category: category,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      photos: photoDataUrls.length > 0 ? photoDataUrls : ['https://placehold.co/600x400.png'],
    };

    try {
        await addRequirement(newRequirement);
        toast({
          title: "Requirement Posted!",
          description: "Professionals will now be able to view and quote your project.",
        });
        router.push('/homeowner/dashboard');
        router.refresh();
    } catch (error) {
        console.error("Failed to post requirement:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to post requirement. Please try again."
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Requirement Title</Label>
            <Input id="title" name="title" placeholder="e.g., Leaky Kitchen Faucet Repair" required disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select required name="category" onValueChange={setCategory} disabled={loading}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cements">Cements</SelectItem>
                <SelectItem value="steel">Steel</SelectItem>
                <SelectItem value="bricks">Bricks</SelectItem>
                <SelectItem value="plumbing-items">Plumbing items</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g., San Francisco, CA" required disabled={loading} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Describe your project in detail..." disabled={loading} />
          </div>

          <div className="space-y-4 md:col-span-2">
            <Label htmlFor="photos">Site Photos (Max 5)</Label>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <Image src={photo.preview} alt={`Upload preview ${index + 1}`} width={150} height={100} className="rounded-lg object-cover w-full aspect-video" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${loading || photos.length >= 5 ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-secondary hover:bg-muted'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" multiple onChange={handlePhotoUpload} accept="image/png, image/jpeg" disabled={loading || photos.length >= 5} />
                </label>
            </div> 
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Requirement
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}


'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRequirements } from '@/lib/store';
import type { Requirement } from '@/lib/types';
import React, { useState } from 'react';
import Image from 'next/image';

export function RequirementForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { addRequirement } = useRequirements();
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (readEvent) => {
          if (readEvent.target?.result) {
            newPhotos.push(readEvent.target.result as string);
            // Check if all files have been read
            if (newPhotos.length === files.length) {
              setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const newRequirement: Requirement = {
      id: `req-${Date.now()}`,
      homeownerId: 'user-1', // Mocked user ID
      homeownerName: 'Alice', // Mocked user name
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      photos: photos.length > 0 ? photos : ['https://placehold.co/600x400.png'], // Use uploaded photos or a placeholder
      createdAt: new Date(),
      status: 'Open',
    };

    addRequirement(newRequirement);

    toast({
      title: "Requirement Posted!",
      description: "Professionals will now be able to view and quote your project.",
    });
    router.push('/homeowner/dashboard');
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
            <Input id="title" name="title" placeholder="e.g., Leaky Kitchen Faucet Repair" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select required name="category">
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
            <Input id="location" name="location" placeholder="e.g., San Francisco, CA" required />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Describe your project in detail..." />
          </div>

          <div className="space-y-4 md:col-span-2">
            <Label htmlFor="photos">Site Photos</Label>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <Image src={photo} alt={`Upload preview ${index + 1}`} width={150} height={100} className="rounded-lg object-cover w-full aspect-video" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" multiple onChange={handlePhotoUpload} accept="image/png, image/jpeg, image/gif" />
                </label>
            </div> 
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit">Post Requirement</Button>
        </CardFooter>
      </Card>
    </form>
  );
}


'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProfile, updateProfile, useAuth } from '@/lib/store';
import type { ShopOwnerProfile } from '@/lib/types';
import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Skeleton } from '../ui/skeleton';

type PhotoState = string | { file: File, preview: string };

function ProfileFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-1" />
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2 md:col-span-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-24 w-full" /></div>
                <div className="space-y-2 md:col-span-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-32 w-full" /></div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
    )
}

export function ShopOwnerProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState<Partial<ShopOwnerProfile>>({});
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const existingProfile = await getProfile(currentUser.id);
    if (existingProfile) {
      setProfile(existingProfile);
      setPhotos(existingProfile.shopPhotos || []);
    } else if (currentUser.username) {
      setProfile({ 
        username: currentUser.username,
        email: currentUser.email,
        shopName: `${currentUser.username}'s Shop`,
        phoneNumber: '',
        address: '',
        location: '',
      });
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({...prev, [name]: value}));
  }

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
      const newPhotoFiles: PhotoState[] = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotoFiles]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const photoToRemove = photos[index];
    if (typeof photoToRemove !== 'string') {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
    }
    if (!profile.username || !profile.email || !profile.shopName || !profile.phoneNumber || !profile.location || !profile.address) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all required fields.' });
        return;
    }
    setSaving(true);
    
    try {
        await updateProfile({
            ...profile,
        } as Omit<ShopOwnerProfile, 'id'>, photos);

        toast({
            title: "Profile Updated!",
            description: "Your business information has been saved.",
        });
        router.push('/shop-owner/dashboard');
        router.refresh();
    } catch (error) {
        console.error("Failed to update profile", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
    } finally {
        setSaving(false);
    }
  };
  
  if (loading) {
    return <ProfileFormSkeleton />
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>This information will be visible to homeowners when you send a quotation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Your Name</Label>
            <Input id="username" name="username" placeholder="e.g., John Smith" required value={profile.username || ''} onChange={handleChange} disabled={saving}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input id="shopName" name="shopName" placeholder="e.g., Smith & Co. Plumbing" required value={profile.shopName || ''} onChange={handleChange} disabled={saving}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required value={profile.email || ''} onChange={handleChange} disabled={saving}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" placeholder="e.g., +91-9876543210" required value={profile.phoneNumber || ''} onChange={handleChange} disabled={saving}/>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">City / Area</Label>
            <Input id="location" name="location" placeholder="e.g., Bengaluru, Karnataka" required value={profile.location || ''} onChange={handleChange} disabled={saving}/>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Full Address</Label>
            <Textarea id="address" name="address" placeholder="Your complete shop address" required value={profile.address || ''} onChange={handleChange} disabled={saving}/>
          </div>


          <div className="space-y-4 md:col-span-2">
            <Label htmlFor="photos">Shop Photos (Max 5)</Label>
             {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <Image 
                      src={typeof photo === 'string' ? photo : photo.preview} 
                      alt={`Upload preview ${index + 1}`} 
                      width={150} 
                      height={100} 
                      className="rounded-lg object-cover w-full aspect-video" 
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(index)}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${saving || photos.length >= 5 ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-secondary hover:bg-muted'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" multiple onChange={handlePhotoUpload} accept="image/png, image/jpeg" disabled={saving || photos.length >= 5} />
                </label>
            </div>
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

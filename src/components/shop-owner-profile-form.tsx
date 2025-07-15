
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useShopOwnerProfiles } from '@/lib/store';
import type { ShopOwnerProfile } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function ShopOwnerProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { getProfile, updateProfile } = useShopOwnerProfiles();
  
  const shopOwnerId = 'user-2'; 
  
  const [profile, setProfile] = useState<ShopOwnerProfile>({
    id: shopOwnerId,
    name: 'Bob Builder', // Mocked user name
    shopName: '',
    phoneNumber: '',
    address: '',
    location: '',
    shopPhotos: [],
  });

  useEffect(() => {
    const existingProfile = getProfile(shopOwnerId);
    if (existingProfile) {
      setProfile(existingProfile);
    }
  }, [getProfile, shopOwnerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({...prev, [name]: value}));
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (readEvent) => {
          if (readEvent.target?.result) {
            newPhotos.push(readEvent.target.result as string);
            if (newPhotos.length === files.length) {
              setProfile(prev => ({ ...prev, shopPhotos: [...prev.shopPhotos, ...newPhotos] }));
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setProfile(prev => ({...prev, shopPhotos: prev.shopPhotos.filter((_, i) => i !== index)}));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateProfile(profile);
    toast({
      title: "Profile Updated!",
      description: "Your business information has been saved.",
    });
    router.push('/shop-owner/dashboard');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" name="name" placeholder="e.g., John Smith" required value={profile.name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input id="shopName" name="shopName" placeholder="e.g., Smith & Co. Plumbing" required value={profile.shopName} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" placeholder="e.g., +91-9876543210" required value={profile.phoneNumber} onChange={handleChange} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g., Bengaluru, Karnataka" required value={profile.location} onChange={handleChange} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Full Address</Label>
            <Textarea id="address" name="address" placeholder="Describe your full address..." required value={profile.address} onChange={handleChange} />
          </div>

          <div className="space-y-4 md:col-span-2">
            <Label htmlFor="photos">Shop Photos</Label>
             {profile.shopPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {profile.shopPhotos.map((photo, index) => (
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
                    <Input id="dropzone-file" type="file" className="hidden" multiple onChange={handlePhotoUpload} accept="image/png, image/jpeg, image/gif"/>
                </label>
            </div>
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit">Save Profile</Button>
        </CardFooter>
      </Card>
    </form>
  );
}

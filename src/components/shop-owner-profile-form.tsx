'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useShopOwnerProfiles } from '@/lib/store';
import type { ShopOwnerProfile } from '@/lib/types';
import { useEffect, useState } from 'react';

export function ShopOwnerProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { getProfile, updateProfile } = useShopOwnerProfiles();
  
  // In a real app, this would come from the logged-in user's session
  const shopOwnerId = 'user-2'; 
  
  const [profile, setProfile] = useState<ShopOwnerProfile>({
    id: shopOwnerId,
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="photos">Shop Photos</Label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" multiple />
                </label>
            </div> 
             {/* Note: Photo upload logic is mocked for this prototype */}
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit">Save Profile</Button>
        </CardFooter>
      </Card>
    </form>
  );
}

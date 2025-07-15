
'use client';

import { useShopOwnerProfiles } from '@/lib/store';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Mail, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ShopOwnerProfile } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

export default function ShopOwnerProfilePage() {
  const params = useParams();
  const { id } = params;

  const { getProfile } = useShopOwnerProfiles();
  const [profile, setProfile] = useState<ShopOwnerProfile | undefined>(undefined);

  useEffect(() => {
    if (id) {
        const foundProfile = getProfile(id as string);
        setProfile(foundProfile);
    }
  }, [id, getProfile]);

  if (!profile) {
    return (
        <div className="flex items-center justify-center h-full">
            <p>Loading profile...</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader className="text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <Building className="w-12 h-12 text-muted-foreground" />
            </div>
            <CardTitle className="font-headline text-3xl">{profile.shopName}</CardTitle>
            <CardDescription className="text-lg">
                <User className="inline-block w-4 h-4 mr-1.5 align-middle" />
                {profile.name}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center md:text-left">
                <div className="space-y-1">
                    <h3 className="font-semibold text-muted-foreground">Contact</h3>
                    <p className="flex items-center justify-center md:justify-start gap-2"><Mail className="w-4 h-4" /> bob@example.com</p>
                    <p className="flex items-center justify-center md:justify-start gap-2"><Phone className="w-4 h-4" /> {profile.phoneNumber}</p>
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-muted-foreground">Location</h3>
                    <p className="flex items-center justify-center md:justify-start gap-2"><MapPin className="w-4 h-4" /> {profile.location}</p>
                    <p className="text-sm text-muted-foreground">{profile.address}</p>
                </div>
            </div>
            <Separator />
             <div>
                <h3 className="font-semibold text-lg mb-4 text-center md:text-left">Shop Photos</h3>
                {profile.shopPhotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {profile.shopPhotos.map((photo, index) => (
                        <div key={index} className="relative group overflow-hidden rounded-lg">
                             <Image 
                                src={photo} 
                                alt={`${profile.shopName} photo ${index + 1}`} 
                                width={400} 
                                height={300} 
                                className="object-cover w-full h-full aspect-video transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint="hardware shop"
                             />
                        </div>
                        ))}
                    </div>
                ): (
                    <p className="text-muted-foreground text-center">No shop photos have been uploaded.</p>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

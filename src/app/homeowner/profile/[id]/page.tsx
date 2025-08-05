
'use client';

import { getProfile } from '@/lib/store';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building, Mail, Phone, User } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import type { ShopOwnerProfile } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { getUser } from '@/lib/store';
import type { User as AppUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function ProfileSkeleton() {
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
                <Skeleton className="w-24 h-24 mx-auto rounded-full mb-4" />
                <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
                <Skeleton className="h-6 w-1/3 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-3/4" />
                    </div>
                    <div className="space-y-2">
                         <Skeleton className="h-5 w-1/4" />
                         <Skeleton className="h-5 w-3/4" />
                         <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <Separator />
                <div>
                    <Skeleton className="h-6 w-1/4 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Skeleton className="h-40 w-full aspect-video" />
                        <Skeleton className="h-40 w-full aspect-video" />
                        <Skeleton className="h-40 w-full aspect-video" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function ShopOwnerProfilePage() {
  const params = useParams();
  const { id } = params;

  const [profile, setProfile] = useState<ShopOwnerProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const profileData = await getProfile(id as string);
    setProfile(profileData);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
        <div className="flex items-center justify-center h-full">
            <p>Profile not found.</p>
        </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader className="text-center items-center">
            <Avatar className="w-24 h-24 text-3xl mb-4">
                {profile.shopIconUrl && <AvatarImage src={profile.shopIconUrl} alt={profile.shopName} />}
                <AvatarFallback className="bg-muted">
                    <Building className="w-12 h-12 text-muted-foreground" />
                </AvatarFallback>
            </Avatar>
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
                    {/* Email is not on the public profile, so we remove it. */}
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

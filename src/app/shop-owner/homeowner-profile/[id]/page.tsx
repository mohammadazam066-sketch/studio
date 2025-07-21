
'use client';

import { getHomeownerProfileById } from '@/lib/store';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, User, Home } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import type { HomeownerProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function ProfileSkeleton() {
    return (
        <Card className="max-w-md mx-auto">
            <CardHeader className="text-center items-center">
                <Skeleton className="w-24 h-24 rounded-full mb-4" />
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-5 w-full" />
                </div>
            </CardContent>
        </Card>
    )
}

export default function HomeownerProfilePageForShop() {
  const params = useParams();
  const { id } = params;

  const [profile, setProfile] = useState<HomeownerProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const profileData = await getHomeownerProfileById(id as string);
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
        <div className="text-center py-10">
            <h2 className="text-xl font-medium">Homeowner Not Found</h2>
            <p className="text-muted-foreground mt-1">The profile could not be loaded.</p>
            <Button asChild variant="outline" className="mt-4">
                <Link href="/shop-owner/my-quotations">
                    Back to My Quotations
                </Link>
            </Button>
        </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
        <div>
            <h1 className="text-2xl font-bold font-headline tracking-tight">Homeowner Profile</h1>
            <p className="text-muted-foreground">Contact details for your new customer.</p>
        </div>
        <Card>
            <CardHeader className="text-center items-center">
                <Avatar className="w-24 h-24 text-3xl mb-4">
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline text-3xl">{profile.name}</CardTitle>
                <CardDescription className="text-base">Homeowner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="flex items-center gap-4 text-lg">
                    <Phone className="w-5 h-5 text-muted-foreground" /> 
                    <span>{profile.phoneNumber}</span>
                </div>
                 {profile.address && (
                    <div className="flex items-center gap-4 text-lg">
                        <Home className="w-5 h-5 text-muted-foreground" />
                        <span>{profile.address}</span>
                    </div>
                 )}
            </CardContent>
        </Card>
    </div>
  );
}



'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { updateUser, useAuth } from '@/lib/store';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { HomeownerProfile } from '@/lib/types';


export function UserProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, setCurrentUser } = useAuth(); 
  
  const [profile, setProfile] = useState<Partial<HomeownerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.profile) {
        setProfile(currentUser.profile as HomeownerProfile);
        setLoading(false);
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({...prev, [name]: value}));
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || !profile.username) return;
    setSaving(true);
    try {
        await updateUser(currentUser.id, { username: profile.username });
        
        if (setCurrentUser) {
          setCurrentUser(prevUser => prevUser ? {...prevUser, username: profile.username, profile: {...prevUser.profile, ...profile}} : null);
        }

        toast({
          title: "Profile Updated!",
          description: "Your personal information has been saved.",
        });
        router.push('/homeowner/dashboard');
        router.refresh();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
        console.error(error);
    } finally {
        setSaving(false);
    }
  };
  
  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>This information helps us personalize your experience.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Your Username</Label>
            <Input id="username" name="username" placeholder="e.g., alice" required value={profile.username || ''} onChange={handleChange} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required value={profile.email || ''} onChange={handleChange} disabled={true} title="Email address cannot be changed." />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

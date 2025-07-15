
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { updateUser, useAuth } from '@/lib/store';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';


export function UserProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, setCurrentUser } = useAuth(); // Assuming setCurrentUser is available from context to update UI
  
  const [user, setUser] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
        setUser({ name: currentUser.name, email: currentUser.email });
        setLoading(false);
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({...prev, [name]: value}));
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    try {
        const updatedDetails = { name: user.name }; // Email editing is disabled
        await updateUser(currentUser.id, updatedDetails);
        
        // Optimistically update the user in the context
        if (setCurrentUser) {
          setCurrentUser(prevUser => prevUser ? {...prevUser, ...updatedDetails} : null);
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
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" name="name" placeholder="e.g., Alice" required value={user.name || ''} onChange={handleChange} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="e.g., alice@example.com" required value={user.email || ''} onChange={handleChange} disabled={true} title="Email address cannot be changed." />
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

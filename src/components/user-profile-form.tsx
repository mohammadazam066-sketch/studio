'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/lib/store';
import type { User } from '@/lib/types';
import React, { useEffect, useState } from 'react';

export function UserProfileForm({ user: initialUser }: { user: Omit<User, 'password' | 'role'> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { updateUser, getUser } = useUsers();
  
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    const freshUser = getUser(initialUser.id);
    if(freshUser) {
        const { password, ...displayUser } = freshUser;
        setUser(displayUser);
    }
  }, [getUser, initialUser.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({...prev, [name]: value}));
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateUser(user.id, { name: user.name, email: user.email });
    toast({
      title: "Profile Updated!",
      description: "Your personal information has been saved.",
    });
    router.push('/homeowner/dashboard');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" name="name" placeholder="e.g., Alice" required value={user.name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="e.g., alice@example.com" required value={user.email} onChange={handleChange} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">Save Profile</Button>
        </CardFooter>
      </Card>
    </form>
  );
}

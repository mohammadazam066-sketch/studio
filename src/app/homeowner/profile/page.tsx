

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/store';
import type { HomeownerProfile } from '@/lib/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Upload, X, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PhotoState = { file: File, preview: string };


function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    )
}


export default function HomeownerProfilePage() {
  const { currentUser, loading: authLoading, updateUserProfile, logout, deleteUserAccount } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      address: '',
      occupation: '',
    },
  });

  useEffect(() => {
    if (currentUser?.profile) {
      const profile = currentUser.profile as HomeownerProfile;
      form.reset({
        name: profile.name || '',
        phoneNumber: currentUser.phoneNumber || '',
        address: profile.address || '',
        occupation: profile.occupation || '',
      });
    }
  }, [currentUser, form.reset]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto({ file, preview: URL.createObjectURL(file) });
      e.target.value = ''; // Reset file input
    }
  };

  const removePhoto = () => {
    if (photo) {
        URL.revokeObjectURL(photo.preview);
    }
    setPhoto(null);
  };


  async function onSubmit(data: ProfileFormValues) {
    setIsSaving(true);
    let newPhotoDataUrl: string[] = [];
    if (photo) {
        newPhotoDataUrl.push(await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(photo.file);
        }));
    }

    try {
        await updateUserProfile(data, newPhotoDataUrl);
        toast({
            title: "Profile Updated",
            description: "Your information has been successfully saved.",
        });
        setPhoto(null); // Clear staged photo
    } catch (error) {
        console.error("Failed to update profile:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "An error occurred while saving your profile.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await deleteUserAccount();
        toast({
            title: "Account Deleted",
            description: "Your account has been successfully deleted.",
        });
        await logout(); // Ensure user is logged out after deletion
    } catch (error: any) {
         console.error("Failed to delete account:", error);
         let description = "An error occurred while deleting your account.";
         if (error.code === 'auth/requires-recent-login') {
             description = "This is a sensitive operation. Please log out and log back in before deleting your account.";
         }
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: description,
        });
    } finally {
        setIsDeleting(false);
        setAlertOpen(false);
    }
  };
  
  if (authLoading) {
      return <ProfileSkeleton />;
  }

  const profile = currentUser?.profile as HomeownerProfile;
  const photoPreview = photo?.preview || profile?.photoURL;
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }


  return (
    <>
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-headline tracking-tight">Your Profile</h1>
                <p className="text-muted-foreground">Manage your personal information.</p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-20 w-20">
                                    {photoPreview ? (
                                        <AvatarImage src={photoPreview} alt={profile?.name} />
                                    ) : null}
                                    <AvatarFallback className="text-2xl">
                                        {getInitials(profile?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                {photo && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                                        onClick={removePhoto}
                                        disabled={isSaving}
                                        >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="photo-upload">Profile Photo (Optional)</Label>
                                    <Input id="photo-upload" type="file" onChange={handlePhotoUpload} accept="image/png, image/jpeg, image/webp" disabled={isSaving} className="max-w-xs" />
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., +1 234 567 890" {...field} disabled />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Address (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, Anytown, USA" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="occupation"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Occupation (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Engineer, Doctor" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Delete Account</CardTitle>
                    <CardDescription>
                         Permanently delete your account and all associated data. This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="destructive" onClick={() => setAlertOpen(true)} disabled={isDeleting}>
                        {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete My Account
                    </Button>
                </CardFooter>
            </Card>
        </div>
         <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} variant="destructive" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Yes, delete my account
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

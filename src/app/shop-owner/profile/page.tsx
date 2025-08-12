
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, getReviewsByShopOwner } from '@/lib/store';
import type { ShopOwnerProfile, Review } from '@/lib/types';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Building, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];


const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  shopName: z.string().min(3, { message: "Shop name must be at least 3 characters." }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  location: z.string().min(2, { message: "Location is required." }),
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
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
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
                     <div className="space-y-2 md:col-span-2">
                        <Skeleton className="h-5 w-24" />
                        <div className="grid grid-cols-3 gap-4">
                            <Skeleton className="h-24 w-full rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    )
}

const StarRating = ({ rating, size = "md" }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
    const starClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`${starClasses[size]} ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );
};


export default function ShopOwnerProfilePage() {
  const { currentUser, loading: authLoading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [icon, setIcon] = useState<PhotoState | null>(null);
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      shopName: '',
      phoneNumber: '',
      address: '',
      location: '',
    },
  });

  useEffect(() => {
    if (currentUser?.profile) {
      const profile = currentUser.profile as ShopOwnerProfile;
      form.reset({
        name: profile.name || '',
        shopName: profile.shopName || '',
        phoneNumber: currentUser.phoneNumber || '',
        address: profile.address || '',
        location: profile.location || '',
      });
      setExistingPhotos(profile.shopPhotos || []);
      
      const fetchReviews = async () => {
        setLoadingReviews(true);
        const userReviews = await getReviewsByShopOwner(currentUser.id);
        setReviews(userReviews);
        setLoadingReviews(false);
      }
      fetchReviews();

    }
  }, [currentUser, form]);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIcon({ file, preview: URL.createObjectURL(file) });
      e.target.value = '';
    }
  };

  const removeIcon = () => {
    if(icon) {
        URL.revokeObjectURL(icon.preview);
    }
    setIcon(null);
  }

 const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: PhotoState[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: "destructive", title: "File too large", description: `${file.name} is over 5MB.` });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({ variant: "destructive", title: "Invalid file type", description: `Only JPG, PNG, and WEBP are accepted.` });
        return;
      }
      newPhotos.push({ file, preview: URL.createObjectURL(file) });
    });

    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = ''; // Reset file input
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (url: string) => {
    setExistingPhotos(prev => prev.filter(photoUrl => photoUrl !== url));
  }


  async function onSubmit(data: ProfileFormValues) {
    setIsSaving(true);
    
    let newIconDataUrl: string | undefined = undefined;
    if (icon) {
      newIconDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(icon.file);
      });
    }
    
    const newPhotosAsDataUrls = await Promise.all(
        photos.map(photo => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(photo.file);
            });
        })
    );
    
    const profileUpdateData = {
        ...data,
        photosToKeep: existingPhotos,
        newIcon: newIconDataUrl
    };

    try {
        await updateUserProfile(profileUpdateData, newPhotosAsDataUrls);
        toast({
            title: "Profile Updated",
            description: "Your shop information has been successfully saved.",
        });
        setPhotos([]);
        setIcon(null);
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
  
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  if (authLoading) {
    return <ProfileSkeleton />;
  }
  
  const profile = currentUser?.profile as ShopOwnerProfile;
  const iconPreview = icon?.preview || profile?.shopIconUrl;

  return (
    <div className="space-y-8">
        <div className="mb-6">
            <h1 className="text-2xl font-bold font-headline tracking-tight">Shop Profile</h1>
            <p className="text-muted-foreground">This information will be visible to homeowners.</p>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Shop Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="relative">
                             <Avatar className="h-20 w-20">
                                {iconPreview ? (
                                    <AvatarImage src={iconPreview} alt={profile?.shopName} />
                                ) : null}
                                <AvatarFallback className="text-2xl bg-muted">
                                    <Building className="w-8 h-8 text-muted-foreground" />
                                </AvatarFallback>
                             </Avatar>
                             {icon && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                                    onClick={removeIcon}
                                    disabled={isSaving}
                                    >
                                    <X className="h-4 w-4" />
                                </Button>
                             )}
                           </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="icon-upload">Shop Icon (Optional)</Label>
                                <Input id="icon-upload" type="file" onChange={handleIconUpload} accept="image/png, image/jpeg, image/webp" disabled={isSaving} className="max-w-xs" />
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Your Name</FormLabel>
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
                                    <FormLabel>Contact Phone Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., +91 98765 43210" {...field} disabled />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="shopName"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                    <FormLabel>Shop Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Doe's Hardware & Supplies" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>City / Area</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Bangalore" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem  className="md:col-span-2">
                                    <FormLabel>Full Shop Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, Jayanagar, Bangalore" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                        <div className="space-y-2 md:col-span-2">
                            <Label>Shop Photos</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {existingPhotos.map((url) => (
                                    <div key={url} className="relative group">
                                        <Image src={url} alt="Existing photo" width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeExistingPhoto(url)}
                                            disabled={isSaving}
                                            >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {photos.map((photo, index) => (
                                    <div key={photo.preview} className="relative group">
                                        <Image src={photo.preview} alt="Upload preview" width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removePhoto(index)}
                                            disabled={isSaving}
                                            >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg ${isSaving ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer bg-secondary hover:bg-muted'}`}>
                                        <div className="flex flex-col items-center justify-center text-center p-2">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground"><span className="font-semibold">Add photos</span></p>
                                        </div>
                                        <Input id="dropzone-file" type="file" className="hidden" onChange={handlePhotoUpload} accept="image/png, image/jpeg, image/webp" multiple disabled={isSaving} />
                                    </label>
                                </div> 
                            </div>
                        </div>

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

         <Card>
            <CardHeader>
                <CardTitle>Your Customer Reviews</CardTitle>
                <CardDescription>This is the feedback homeowners have left for you.</CardDescription>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                        <StarRating rating={averageRating} />
                        <span className="text-muted-foreground text-sm">
                            <span className="font-bold">{averageRating.toFixed(1)}</span> average rating from <span className="font-bold">{reviews.length}</span> reviews.
                        </span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {loadingReviews ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="flex gap-4">
                                <Avatar>
                                    {review.customerPhotoURL && <AvatarImage src={review.customerPhotoURL} alt={review.customerName} />}
                                    <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{review.customerName}</p>
                                        <p className="text-xs text-muted-foreground">{format(review.createdAt.toDate(), 'PPP')}</p>
                                    </div>
                                    <StarRating rating={review.rating} size="sm" />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">You have not received any reviews yet.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

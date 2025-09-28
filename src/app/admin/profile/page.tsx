

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, Shield, Phone, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';

function AdminProfileSkeleton() {
    return (
        <Card className="max-w-md mx-auto">
            <CardHeader className="text-center items-center">
                <Skeleton className="w-24 h-24 rounded-full mb-4" />
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-5 w-40" />
                </div>
                 <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-5 w-40" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminProfilePage() {
    const { currentUser, loading, logout, deleteUserAccount } = useAuth();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setAlertOpen] = useState(false);

    if (loading || !currentUser) {
        return <AdminProfileSkeleton />;
    }

    const getInitials = (name?: string) => {
        if (!name) return 'A';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold font-headline tracking-tight">Admin Profile</h1>
                    <p className="text-muted-foreground">Your administrator account details.</p>
                </div>
                <Card className="max-w-md mx-auto">
                    <CardHeader className="text-center items-center">
                        <Avatar className="w-24 h-24 text-3xl mb-4">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(currentUser.profile?.name)}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="font-headline text-3xl">{currentUser.profile?.name || 'Admin'}</CardTitle>
                        <CardDescription className="text-base flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Administrator
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center gap-4 text-lg">
                            <UserIcon className="w-5 h-5 text-muted-foreground" /> 
                            <span>{currentUser.profile?.name || 'Admin User'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-lg">
                            <Phone className="w-5 h-5 text-muted-foreground" /> 
                            <span>{currentUser.phoneNumber}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-4 border-t pt-6 mt-6 border-destructive/20">
                         <div className="space-y-1">
                            <h3 className="font-semibold text-destructive">Delete Account</h3>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                        </div>
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
                            account and remove all your data from our servers.
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
    )
}

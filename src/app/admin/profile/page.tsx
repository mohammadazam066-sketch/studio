

'use client';

import React from 'react';
import { useAuth } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, Shield, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    const { currentUser, loading } = useAuth();

    if (loading || !currentUser) {
        return <AdminProfileSkeleton />;
    }

    const getInitials = (name?: string) => {
        if (!name) return 'A';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
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
            </Card>
        </div>
    )
}

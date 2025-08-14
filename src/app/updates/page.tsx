
'use client';

import { UpdatesFeed } from '@/components/updates-feed';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/store';
import { LayoutDashboard, PlusCircle, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CreateUpdateDialog } from '@/components/create-update-dialog';

export default function UpdatesPage() {
    const { currentUser } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

    const handlePostSuccess = () => {
        setRefreshKey(prevKey => prevKey + 1);
        setCreateDialogOpen(false); // Close the dialog on success
    }
    
    let backLink = '/';
    if(currentUser) {
        if (currentUser.role === 'homeowner') backLink = '/homeowner/dashboard';
        else if (currentUser.role === 'shop-owner') backLink = '/shop-owner/dashboard';
        else if (currentUser.role === 'admin') backLink = '/admin/dashboard';
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-background">
                <div>
                    <h1 className="text-2xl font-bold font-headline tracking-tight">Community Updates</h1>
                    <p className="text-muted-foreground">Latest news and knowledge from the TradeFlow community.</p>
                </div>
                <div className="flex gap-2">
                     {currentUser ? (
                         <>
                            <CreateUpdateDialog 
                                open={isCreateDialogOpen} 
                                onOpenChange={setCreateDialogOpen}
                                onPostSuccess={handlePostSuccess}
                            >
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Post
                                </Button>
                            </CreateUpdateDialog>
                            <Button asChild variant="outline">
                                <Link href={backLink}>
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Link>
                            </Button>
                         </>
                     ) : (
                        <Button asChild>
                            <Link href="/auth/login">
                                <LogIn className="mr-2 h-4 w-4" />
                                Login to Post
                            </Link>
                        </Button>
                     )}
                </div>
            </div>
            <UpdatesFeed refreshKey={refreshKey} />
        </div>
    );
}

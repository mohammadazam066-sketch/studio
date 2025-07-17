
'use client';

import { UpdatePostForm } from '@/components/update-post-form';
import { UpdatesFeed } from '@/components/updates-feed';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/store';
import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function UpdatesPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const { currentUser } = useAuth();

    const handlePostSuccess = () => {
        setRefreshKey(prevKey => prevKey + 1);
    }

    const dashboardUrl = currentUser?.role === 'homeowner' ? '/homeowner/dashboard' : '/shop-owner/dashboard';

    return (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 lg:sticky lg:top-8">
               <UpdatePostForm onPostSuccess={handlePostSuccess} />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-headline tracking-tight">Community Updates</h1>
                        <p className="text-muted-foreground">Latest news and knowledge from the Bidarkart community.</p>
                    </div>
                    {currentUser && (
                         <Button asChild variant="outline">
                            <Link href={dashboardUrl}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    )}
                </div>
                <UpdatesFeed refreshKey={refreshKey} />
            </div>
        </div>
    );
}

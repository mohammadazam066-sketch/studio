
'use client';

import { UpdatePostForm } from '@/components/update-post-form';
import { UpdatesFeed } from '@/components/updates-feed';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

export default function UpdatesPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handlePostSuccess = () => {
        setRefreshKey(prevKey => prevKey + 1);
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 lg:sticky lg:top-8">
               <UpdatePostForm onPostSuccess={handlePostSuccess} />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold font-headline tracking-tight">Community Updates</h1>
                    <p className="text-muted-foreground">Latest news and knowledge from the TradeFlow community.</p>
                </div>
                <UpdatesFeed refreshKey={refreshKey} />
            </div>
        </div>
    );
}


'use client';

import { UpdatesFeed } from '@/components/updates-feed';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/store';
import { PlusCircle } from 'lucide-react';
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
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline tracking-tight">Community Updates</h1>
                    <p className="text-muted-foreground">Latest posts and insights from the community.</p>
                </div>
                 {currentUser && (
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
                 )}
            </div>
            <UpdatesFeed refreshKey={refreshKey} />
        </div>
    );
}

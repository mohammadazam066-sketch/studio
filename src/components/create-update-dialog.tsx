
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UpdatePostForm } from "./update-post-form";

interface CreateUpdateDialogProps {
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPostSuccess: () => void;
}

export function CreateUpdateDialog({ children, open, onOpenChange, onPostSuccess }: CreateUpdateDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Create a New Post</DialogTitle>
                    <DialogDescription>
                        Share news, tips, or insights with the community. Click publish when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto">
                    <UpdatePostForm onPostSuccess={onPostSuccess} className="px-6 py-4" />
                </div>
            </DialogContent>
        </Dialog>
    )
}

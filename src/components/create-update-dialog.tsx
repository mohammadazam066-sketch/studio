
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create a New Post</DialogTitle>
                    <DialogDescription>
                        Share news, tips, or insights with the community. Click publish when you're done.
                    </DialogDescription>
                </DialogHeader>
                <UpdatePostForm onPostSuccess={onPostSuccess} />
            </DialogContent>
        </Dialog>
    )
}

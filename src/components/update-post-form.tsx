

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, addUpdate } from '@/lib/store';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const updateFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }),
});

type UpdateFormValues = z.infer<typeof updateFormSchema>;

interface UpdatePostFormProps {
    onPostSuccess?: () => void;
    className?: string;
}

export function UpdatePostForm({ onPostSuccess, className }: UpdatePostFormProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const { formState: { isSubmitting }, reset } = form;

  async function onSubmit(data: UpdateFormValues) {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not signed in', description: 'You must be logged in to post an update.' });
      return;
    }
    
    try {
        await addUpdate({ title: data.title, content: data.content });
        toast({
            title: "Post Published!",
            description: "Your update is now live for the community to see.",
            className: 'bg-accent text-accent-foreground border-accent'
        });
        reset();
        onPostSuccess?.();
    } catch (error) {
        console.error("Failed to post update:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to publish your post. Please try again."
        });
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New Eco-Friendly Bricks" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Share the details..." {...field} disabled={isSubmitting} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Post
                </Button>
            </div>
          </div>
      </form>
    </Form>
  );
}

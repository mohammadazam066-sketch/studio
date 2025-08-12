
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    rating: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function StarRating({ rating, size = "md", className }: StarRatingProps) {
    const starClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        starClasses[size],
                        i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                    )}
                />
            ))}
        </div>
    );
};

    
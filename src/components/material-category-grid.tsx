
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import Image from "next/image";
import { useEffect, useState } from "react";
import { getOpenRequirementsCountByCategory } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/lib/types";

const categories = [
    { id: 'Cement', label: 'Cement', imageHint: 'cement bag' },
    { id: 'Steel', label: 'Steel', imageHint: 'steel bars' },
    { id: 'Bricks & Blocks', label: 'Bricks & Blocks', imageHint: 'brick wall' },
    { id: 'Sand & Aggregates', label: 'Sand & Aggregates', imageHint: 'sand pile' },
    { id: 'Electrical', label: 'Electrical', imageHint: 'electrical wires' },
];

function CategoryGridSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
                <div key={category.id} className="space-y-2">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                </div>
            ))}
        </div>
    )
}

interface MaterialCategoryGridProps {
    role: UserRole;
}

export function MaterialCategoryGrid({ role }: MaterialCategoryGridProps) {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCounts() {
            setLoading(true);
            const categoryCounts = await getOpenRequirementsCountByCategory();
            setCounts(categoryCounts);
            setLoading(false);
        }
        if (role === 'shop-owner') {
            fetchCounts();
        } else {
            setLoading(false);
        }
    }, [role]);

    const getLinkHref = (category: string) => {
        if (role === 'homeowner') {
            return `/homeowner/requirements/new?category=${encodeURIComponent(category)}`;
        }
        // URL-encode the category to handle special characters like '&'
        return `/shop-owner/requirements/category/${encodeURIComponent(category)}`;
    }


    if (loading) {
        return <CategoryGridSkeleton />;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
                <Link href={getLinkHref(category.id)} key={category.id} className="group">
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                        <CardContent className="p-0 relative">
                            <Image
                                src={`https://placehold.co/200x200.png`}
                                alt={category.label}
                                width={200}
                                height={200}
                                className="object-cover w-full h-24"
                                data-ai-hint={category.imageHint}
                            />
                            {(role === 'shop-owner' && counts[category.id] > 0) && (
                                <Badge className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm text-primary-foreground">
                                    {counts[category.id]}
                                </Badge>
                            )}
                            <div className="p-3">
                                <h3 className="font-semibold text-sm truncate">{category.label}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

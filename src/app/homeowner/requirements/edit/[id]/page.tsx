
'use client';

import { RequirementForm } from "@/components/requirement-form";
import { getRequirementById, useAuth } from "@/lib/store";
import type { Requirement } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

function EditRequirementSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    )
}


export default function EditRequirementPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { currentUser } = useAuth();
    
    const [requirement, setRequirement] = useState<Requirement | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const fetchRequirement = useCallback(async () => {
        if (typeof id !== 'string') return;
        setLoading(true);
        const reqData = await getRequirementById(id);

        if (!reqData || !currentUser || reqData.homeownerId !== currentUser.id) {
            // Unauthorized or not found
            router.push('/homeowner/dashboard');
            return;
        }

        setRequirement(reqData);
        setLoading(false);
    }, [id, currentUser, router]);

    useEffect(() => {
        fetchRequirement();
    }, [fetchRequirement]);


    if (loading) {
        return <EditRequirementSkeleton />;
    }
    
    if (!requirement) {
        return null; // Should have been redirected
    }

    return (
        <RequirementForm existingRequirement={requirement} />
    )
}

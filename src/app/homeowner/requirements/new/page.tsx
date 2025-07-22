
'use client';

import { RequirementForm } from "@/components/requirement-form";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function NewRequirementContent() {
    const searchParams = useSearchParams();
    const category = searchParams.get('category');

    return (
        <RequirementForm initialCategory={category || undefined} />
    )
}


export default function NewRequirementPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewRequirementContent />
        </Suspense>
    )
}

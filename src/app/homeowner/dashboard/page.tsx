

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuotationsForRequirement, getRequirements, useAuth } from '@/lib/store';
import { PlusCircle, MessageSquare } from 'lucide-react';
import type { Requirement } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function RequirementCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </CardFooter>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}


export default function HomeownerDashboard() {
  const { currentUser } = useAuth();
  const [myRequirements, setMyRequirements] = useState<Requirement[]>([]);
  const [quoteCounts, setQuoteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    
    const reqs = await getRequirements({ homeownerId: currentUser.id });
    setMyRequirements(reqs);

    if (reqs.length > 0) {
      const quoteCountPromises = reqs.map(req => 
        getQuotationsForRequirement(req.id).then(quotes => ({ reqId: req.id, count: quotes.length }))
      );
      const countsResults = await Promise.all(quoteCountPromises);
      const counts: Record<string, number> = {};
      countsResults.forEach(result => {
        counts[result.reqId] = result.count;
      });
      setQuoteCounts(counts);
    }
    
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  if (loading) {
    return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-headline tracking-tight">Project Requirements</h1>
              <p className="text-muted-foreground">View and manage all project requirements.</p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/homeowner/requirements/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Requirement
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <RequirementCardSkeleton key={i} />)}
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight">Project Requirements</h1>
          <p className="text-muted-foreground">View and manage all project requirements.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/homeowner/requirements/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Requirement
          </Link>
        </Button>
      </div>

      {myRequirements.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {myRequirements.map((req) => (
            <Card key={req.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{req.title}</CardTitle>
                <CardDescription>{req.category} - {req.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{req.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <div className={`text-sm font-medium flex items-center gap-2 ${req.status === 'Purchased' ? 'text-accent' : 'text-primary'}`}>
                    <span className={`h-2 w-2 rounded-full ${req.status === 'Purchased' ? 'bg-accent' : 'bg-primary'}`}></span>
                    {req.status}
                  </div>
                 <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    {quoteCounts[req.id] ?? 0} Quotes
                  </div>
              </CardFooter>
               <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href={`/homeowner/requirements/${req.id}`}>View Details</Link>
                  </Button>
               </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">No requirements yet</h2>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Get started by posting the first requirement.</p>
          <Button asChild className="mt-4">
            <Link href="/homeowner/requirements/new">Post a Requirement</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

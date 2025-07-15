'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRequirements, useQuotations } from '@/lib/store';
import { PlusCircle, MessageSquare } from 'lucide-react';

export default function HomeownerDashboard() {
  const { requirements } = useRequirements();
  const { getQuotationsForRequirement } = useQuotations();
  
  // In a real app, you'd filter for the logged in user
  const myRequirements = requirements; 

  const getQuoteCount = (reqId: string) => {
    return getQuotationsForRequirement(reqId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight">My Requirements</h1>
          <p className="text-muted-foreground">View and manage all your project requirements.</p>
        </div>
        <Button asChild>
          <Link href="/homeowner/requirements/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Requirement
          </Link>
        </Button>
      </div>

      {myRequirements.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myRequirements.map((req) => (
            <Card key={req.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{req.title}</CardTitle>
                <CardDescription>{req.category} - {req.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{req.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <div className={`text-sm font-medium flex items-center gap-2 ${req.status === 'Purchased' ? 'text-accent' : 'text-blue-500'}`}>
                    <span className={`h-2 w-2 rounded-full ${req.status === 'Purchased' ? 'bg-accent' : 'bg-blue-500'}`}></span>
                    {req.status}
                  </div>
                 <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    {getQuoteCount(req.id)} Quotes
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
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">No requirements yet</h2>
          <p className="text-muted-foreground mt-2">Get started by posting your first requirement.</p>
          <Button asChild className="mt-4">
            <Link href="/homeowner/requirements/new">Post a Requirement</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

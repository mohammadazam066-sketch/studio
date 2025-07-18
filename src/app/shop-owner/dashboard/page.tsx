
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRequirements } from '@/lib/store';
import type { Requirement } from '@/lib/types';
import { MapPin, Calendar, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function formatFirebaseDate(date: Date | string | Timestamp) {
    if (!date) return '';
    const dateObj = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as string);
    return formatDistanceToNow(dateObj, { addSuffix: true });
}

function RequirementFeedSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}


export default function ShopOwnerDashboard() {
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchOpenRequirements = useCallback(async () => {
    setLoading(true);
    try {
        const reqs = await getRequirements({ status: 'Open' });
        setAllRequirements(reqs);
    } catch (error) {
        console.error("Failed to fetch requirements:", error);
        // Optionally, show a toast message to the user
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenRequirements();
  }, [fetchOpenRequirements]);


  const filteredRequirements = useMemo(() => {
    return allRequirements.filter(req => {
      const categoryMatch = categoryFilter === 'all' || req.category.toLowerCase() === categoryFilter.toLowerCase();
      const locationMatch = req.location.toLowerCase().includes(locationFilter.toLowerCase());
      return categoryMatch && locationMatch;
    });
  }, [allRequirements, categoryFilter, locationFilter]);

  const categories = useMemo(() => {
    const allCategories = allRequirements.map(r => r.category);
    // Return a sorted list of unique categories with 'all' at the beginning
    return ['all', ...Array.from(new Set(allCategories)).sort()];
  }, [allRequirements]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Available Requirements</h1>
        <p className="text-muted-foreground">Find your next project. Browse requirements posted by homeowners.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={loading || categories.length <= 1}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat === 'all' ? 'All Categories' : cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by location (e.g., city, state)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Requirements Feed */}
      {loading ? (
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <RequirementFeedSkeleton key={i} />)}
        </div>
      ) : filteredRequirements.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequirements.map(req => (
            <Card key={req.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{req.title}</CardTitle>
                <CardDescription>{req.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" /> {req.location}
                 </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Calendar className="h-4 w-4" /> Posted {formatFirebaseDate(req.createdAt)}
                 </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/shop-owner/requirements/${req.id}`}>View & Quote</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">No Matching Requirements</h2>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">There are no open requirements that match your current filters. Try adjusting them or check back later.</p>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRequirements } from '@/lib/store';
import type { Requirement } from '@/lib/types';
import { MapPin, Calendar, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ShopOwnerDashboard() {
  const { requirements } = useRequirements();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');

  const allRequirements = useMemo(() => requirements.filter(r => r.status === 'Open'), [requirements]);

  const filteredRequirements = useMemo(() => {
    return allRequirements.filter(req => {
      const categoryMatch = categoryFilter === 'all' || req.category.toLowerCase() === categoryFilter;
      const locationMatch = req.location.toLowerCase().includes(locationFilter.toLowerCase());
      return categoryMatch && locationMatch;
    });
  }, [allRequirements, categoryFilter, locationFilter]);

  const categories = useMemo(() => {
    const allCategories = allRequirements.map(r => r.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [allRequirements]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline tracking-tight">Available Requirements</h1>
        <p className="text-muted-foreground">Find your next project. Browse requirements posted by homeowners.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid sm:grid-cols-3 gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
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
            />
          </div>
        </CardContent>
      </Card>

      {/* Requirements Feed */}
      {filteredRequirements.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequirements.map(req => (
            <Card key={req.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{req.title}</CardTitle>
                <CardDescription>{req.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" /> {req.location}
                 </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Calendar className="h-4 w-4" /> Posted {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
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
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-medium">No matching requirements</h2>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );
}

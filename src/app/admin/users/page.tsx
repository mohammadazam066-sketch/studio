

'use client';

import { useEffect, useState } from 'react';
import { getAllUsersByRole } from '@/lib/store';
import type { User, UserRole, HomeownerProfile, ShopOwnerProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

type DisplayUser = {
    id: string;
    name: string;
    userType: UserRole;
    location: string;
    phone: string;
};

const locations = ["Bidar", "Kalaburagi", "Humnabad", "Basavakalyan", "Zaheerabad"];

function UserListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-10 w-1/4" />
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminUsersPage() {
    const [allUsers, setAllUsers] = useState<DisplayUser[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<DisplayUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [homeownerData, shopOwnerData] = await Promise.all([
                getAllUsersByRole('homeowner'),
                getAllUsersByRole('shop-owner'),
            ]);

            const combinedUsers: DisplayUser[] = [
                ...homeownerData.map(u => ({
                    id: u.id,
                    name: u.profile?.name || 'N/A',
                    userType: 'homeowner',
                    location: (u.profile as HomeownerProfile)?.address || 'N/A',
                    phone: u.phoneNumber,
                })),
                ...shopOwnerData.map(u => ({
                    id: u.id,
                    name: u.profile?.name || 'N/A',
                    userType: 'shop-owner',
                    location: (u.profile as ShopOwnerProfile)?.location || 'N/A',
                    phone: u.phoneNumber,
                })),
            ];

            setAllUsers(combinedUsers);
            setFilteredUsers(combinedUsers);
            setLoading(false);
        }
        fetchData();
    }, []);
    
    useEffect(() => {
        let users = allUsers;

        if (searchTerm) {
            users = users.filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (locationFilter !== 'all') {
            users = users.filter(user => user.location.toLowerCase().includes(locationFilter.toLowerCase()));
        }

        setFilteredUsers(users);

    }, [searchTerm, locationFilter, allUsers]);

    if (loading) {
        return <UserListSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Search and view all users on the platform.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-1/3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map(loc => (
                                    <SelectItem key={loc} value={loc.toLowerCase()}>{loc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Phone Number</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.userType === 'homeowner' ? 'secondary' : 'outline'}>
                                            {user.userType === 'homeowner' ? 'Homeowner' : 'Shop Owner'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.location}</TableCell>
                                    <TableCell>{user.phone}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {filteredUsers.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No users found matching your criteria.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

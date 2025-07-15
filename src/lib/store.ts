'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Requirement, Quotation, ShopOwnerProfile, User } from './types';

// Helper to get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const storedValue = window.localStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue);
    } catch (e) {
      console.error(`Error parsing localStorage item "${key}":`, e);
      return defaultValue;
    }
  }
  return defaultValue;
}

// Helper to set data to localStorage
function setToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Dispatch a storage event to sync tabs
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error(`Error setting localStorage item "${key}":`, e);
  }
}

// Custom hook to sync state with localStorage and across tabs
function useSyncedState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
    const [state, setState] = useState<T>(() => getFromStorage(key, defaultValue));

    const setSyncedState = useCallback((newValue: T) => {
        setToStorage(key, newValue);
        setState(newValue);
    }, [key]);

    useEffect(() => {
        const handleStorageChange = () => {
            setState(getFromStorage(key, defaultValue));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key, defaultValue]);

    return [state, setSyncedState];
}

// --- Hooks for data management ---

// Hooks for managing users
export function useUsers() {
  const [users, setUsers] = useSyncedState<User[]>('users', []);

  const addUser = (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
  };
  
  const getUser = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  const updateUser = (userId: string, updatedDetails: Partial<Omit<User, 'id' | 'role' | 'password'>>) => {
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, ...updatedDetails } : user
      );
      setUsers(updatedUsers);
  }

  return { users, addUser, getUser, updateUser };
}

// Hook for managing auth state
export function useAuth() {
  const [currentUser, setCurrentUser] = useSyncedState<User | null>('currentUser', null);
  
  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return { currentUser, login, logout };
}


// Hooks for managing requirements
export function useRequirements() {
  const [requirements, setRequirements] = useSyncedState<Requirement[]>('requirements', []);
  const { currentUser } = useAuth();

  const addRequirement = (newRequirement: Omit<Requirement, 'id' | 'createdAt' | 'homeownerId' | 'homeownerName' | 'status'>) => {
    if (!currentUser) return; // Should not happen if called from logged-in context
    
    const requirementToAdd: Requirement = {
      ...newRequirement,
      id: `req-${Date.now()}`,
      homeownerId: currentUser.id,
      homeownerName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'Open',
    };
    
    const updatedRequirements = [...requirements, requirementToAdd];
    setRequirements(updatedRequirements);
  };
  
  const updateRequirementStatus = (requirementId: string, status: 'Open' | 'Purchased') => {
    const updatedRequirements = requirements.map(req => 
      req.id === requirementId ? { ...req, status } : req
    );
    setRequirements(updatedRequirements);
  };

  return { requirements, addRequirement, updateRequirementStatus };
}

// Hooks for managing quotations
export function useQuotations() {
  const [quotations, setQuotations] = useSyncedState<Quotation[]>('quotations', []);

  const addQuotation = (newQuotation: Quotation) => {
    const updatedQuotations = [...quotations, newQuotation];
    setQuotations(updatedQuotations);
  };
  
  const getQuotationsForRequirement = (requirementId: string) => {
    return quotations.filter(q => q.requirementId === requirementId);
  };

  return { quotations, addQuotation, getQuotationsForRequirement };
}

// Hooks for managing shop owner profiles
export function useShopOwnerProfiles() {
  const [profiles, setProfiles] = useSyncedState<ShopOwnerProfile[]>('shopOwnerProfiles', []);

  const getProfile = (shopOwnerId: string): ShopOwnerProfile | undefined => {
    return profiles.find(p => p.id === shopOwnerId);
  };

  const updateProfile = (updatedProfile: ShopOwnerProfile) => {
    const exists = profiles.some(p => p.id === updatedProfile.id);
    let updatedProfiles;
    if (exists) {
      updatedProfiles = profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p);
    } else {
      updatedProfiles = [...profiles, updatedProfile];
    }
    setProfiles(updatedProfiles);
  };

  return { getProfile, updateProfile, profiles };
}

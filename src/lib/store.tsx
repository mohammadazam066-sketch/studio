
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, HomeownerProfile, ShopOwnerProfile } from './types';
import { db, storage, app as firebaseApp } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthChanged, loginUser, registerUser, logoutUser } from './auth';

// --- AUTH CONTEXT & PROVIDER ---

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email, password) => Promise<any>;
  register: (email, password, username, role) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (updatedProfile: Partial<HomeownerProfile | ShopOwnerProfile>, newPhotos?: { file: File, preview: string }[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return loginUser(email, password);
  };

  const register = async (email, password, username, role) => {
    return registerUser(email, password, username, role);
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };
  
  const updateUserProfile = async (updatedProfile, newPhotos) => {
     if (!currentUser) throw new Error("Not authenticated");
     // This function will be fleshed out later.
     console.log("Updating profile...", updatedProfile, newPhotos);
  };


  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

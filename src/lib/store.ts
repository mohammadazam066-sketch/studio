'use client';

import { useState, useEffect } from 'react';
import type { Requirement, Quotation } from './types';

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
  } catch (e) {
    console.error(`Error setting localStorage item "${key}":`, e);
  }
}

// Hooks for managing requirements
export function useRequirements() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    setRequirements(getFromStorage('requirements', []));
  }, []);

  const addRequirement = (newRequirement: Requirement) => {
    const updatedRequirements = [...requirements, newRequirement];
    setRequirements(updatedRequirements);
    setToStorage('requirements', updatedRequirements);
  };
  
  const updateRequirementStatus = (requirementId: string, status: 'Open' | 'Purchased') => {
    const updatedRequirements = requirements.map(req => 
      req.id === requirementId ? { ...req, status } : req
    );
    setRequirements(updatedRequirements);
    setToStorage('requirements', updatedRequirements);
  };

  return { requirements, addRequirement, updateRequirementStatus };
}

// Hooks for managing quotations
export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    setQuotations(getFromStorage('quotations', []));
  }, []);

  const addQuotation = (newQuotation: Quotation) => {
    const updatedQuotations = [...quotations, newQuotation];
    setQuotations(updatedQuotations);
    setToStorage('quotations', updatedQuotations);
  };
  
  const getQuotationsForRequirement = (requirementId: string) => {
    return quotations.filter(q => q.requirementId === requirementId);
  };

  return { quotations, addQuotation, getQuotationsForRequirement };
}
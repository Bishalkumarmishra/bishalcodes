

import { createContext, useContext } from 'react';
import { PathPage } from '../types';

export interface NavigationContextType {
  currentPage: PathPage;
  selectedId: string | null;
  // Fix: Add optional queryParams argument to align with implementation in App.tsx.
  navigate: (page: PathPage, id?: string, queryParams?: Record<string, string>) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within a NavigationProvider");
  return context;
};

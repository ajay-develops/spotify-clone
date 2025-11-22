'use client';

import { PropsWithChildren, createContext, useContext, useState } from 'react';
import { createClient } from '@/libs/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

interface SupabaseProviderProps extends PropsWithChildren {}

const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const [supabase] = useState(() => createClient());

  return (
    <Context.Provider value={{ supabase: supabase as any }}>
      {children}
    </Context.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
};

export default SupabaseProvider;

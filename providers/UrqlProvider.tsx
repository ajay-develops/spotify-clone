'use client';

import { PropsWithChildren, useMemo } from 'react';
import { Provider } from 'urql';
import { createClientUrqlClient } from '@/libs/urqlClient';
import { useSupabase } from './SupabaseProvider';
import { useEffect, useState } from 'react';

const UrqlProvider = ({ children }: PropsWithChildren) => {
  const { supabase } = useSupabase();
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  // Get access token from Supabase session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAccessToken(session?.access_token);
    };

    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Create urql client with current access token
  const client = useMemo(
    () => createClientUrqlClient(accessToken),
    [accessToken],
  );

  return <Provider value={client}>{children}</Provider>;
};

export default UrqlProvider;


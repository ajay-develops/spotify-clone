import { useState, createContext, useEffect, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import { useSupabase } from '@/providers/SupabaseProvider';
import { UserDetails } from '@/types';

type UserContextType = {
  accessToken: string | null;
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
};

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

export interface Props {
  [propName: string]: any;
}

export const MyUserContextProvider = (props: Props) => {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoadingUser(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoadingUser(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const getUserDetails = () => supabase.from('users').select('*').single();

  useEffect(() => {
    const fetchData = async () => {
      if (user && !isLoadingData && !userDetails) {
        setIsLoadingData(true);

        const userDetailsResult = await getUserDetails();

        if (userDetailsResult.data) {
          // Convert database row to UserDetails type
          // Database has full_name, but UserDetails expects first_name and last_name
          const dbData = userDetailsResult.data;
          const fullName = dbData.full_name || '';
          const nameParts = fullName.split(' ');
          setUserDetails({
            id: dbData.id,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            full_name: fullName || undefined,
            avatar_url: dbData.avatar_url || undefined,
          } as UserDetails);
        }

        setIsLoadingData(false);
      } else if (!user && !isLoadingUser && !isLoadingData) {
        setUserDetails(null);
      }
    };

    fetchData();
    // * Don't need to over fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoadingUser]);

  const value = {
    accessToken,
    user,
    userDetails,
    isLoading: isLoadingUser || isLoadingData,
  };

  return <UserContext.Provider value={value} {...props} />;
};

export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error(`useUser must be used within a MyUserContextProvider`);
  }

  return context;
};

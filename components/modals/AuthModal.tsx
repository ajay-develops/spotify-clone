'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { toast } from 'react-hot-toast';
import { BsIncognito } from 'react-icons/bs';

import useAuthModal from '@/hooks/useAuthModal';

import Modal from './Modal';

const AuthModal = () => {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const { onClose, isOpen } = useAuthModal();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  useEffect(() => {
    if (session) {
      router.refresh();
      onClose();
    }
  }, [session, router, onClose]);

  const handleAnonLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        if (error.message.includes('disabled')) {
          toast.error(
            'Anonymous sign-ins are disabled. Please enable it in Supabase Dashboard > Authentication > Providers > Anonymous',
            { duration: 6000 }
          );
        } else {
          toast.error(error.message);
        }
        console.error('Anonymous sign-in error:', error);
      } else {
        toast.success('Logged In Anonymously');
        router.refresh();
      }
    } catch (err: any) {
      toast.error('Failed to sign in anonymously. Please try again.');
      console.error('Anonymous sign-in exception:', err);
    }
  };

  return (
    <Modal
      title='Welcome!'
      description='Login or Signup'
      isOpen={isOpen}
      onChange={onChange}
    >
      <div
        className='w-full flex flex-row justify-center items-center gap-x-2 
        bg-gradient-to-r from-slate-600 via-gray-500 to-slate-600
        py-[0.6rem] rounded-lg cursor-pointer'
        onClick={handleAnonLogin}
      >
        <BsIncognito className='text-black' />
        <p className='text-black text-base'>Sign in Anonymously (Demo)</p>
      </div>
      <Auth
        theme='dark'
        providers={['github']}
        magicLink
        supabaseClient={supabase as any}
        appearance={{
          theme: ThemeSupa,
          style: {
            button: {
              borderRadius: '10px',
              borderColor: 'rgba(0,0,0,0)',
            },
            input: {
              borderRadius: '10px',
              borderColor: 'rgba(0,0,0,0)',
            },
          },
          variables: {
            default: {
              colors: {
                brand: '#404040',
                brandAccent: '#334155',
              },
            },
          },
        }}
      />
    </Modal>
  );
};

export default AuthModal;

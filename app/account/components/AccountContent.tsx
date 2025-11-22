'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useUser } from '@/hooks/useUser';

const AccountContent = () => {
  const router = useRouter();
  const { isLoading, user, userDetails } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  return (
    <div className='mb-7 px-6'>
      <div className='flex flex-col gap-y-4'>
        <div>
          <h2 className='text-2xl font-semibold mb-4'>Account Information</h2>
          <div className='flex flex-col gap-y-2'>
            {userDetails?.full_name && (
              <div>
                <p className='text-neutral-400 text-sm'>Name</p>
                <p className='text-white'>{userDetails.full_name}</p>
              </div>
            )}
            {user?.email && (
              <div>
                <p className='text-neutral-400 text-sm'>Email</p>
                <p className='text-white'>{user.email}</p>
              </div>
            )}
            {!userDetails?.full_name && !user?.email && (
              <p className='text-neutral-400'>No account information available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountContent;

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import qs from 'query-string';

import useDebounce from '@/hooks/useDebounce';

import Input from './Input';

const SearchInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial query from URL
  const initialQuery = searchParams.get('query') || '';
  const [value, setValue] = useState(initialQuery);
  const debouncedValue = useDebounce(value, 500);

  // Update URL when debounced value changes
  useEffect(() => {
    const query = debouncedValue.trim() ? { query: debouncedValue.trim() } : {};
    const url = qs.stringifyUrl({ url: '/search', query: query });

    // Only update URL if it's different from current
    const currentQuery = searchParams.get('query') || '';
    if (debouncedValue.trim() !== currentQuery) {
      router.replace(url, { scroll: false });
    }
  }, [debouncedValue, router, searchParams]);

  return (
    <Input
      placeholder='Search for a song by name or artist'
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

export default SearchInput;

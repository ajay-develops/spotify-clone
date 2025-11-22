import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/libs/supabaseServer';

export const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const supabase = await createMiddlewareClient(req, res);

  await supabase.auth.getSession();

  return res;
};

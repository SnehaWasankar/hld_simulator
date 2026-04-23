import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/backend/utils/auth';

export async function GET(req: Request) {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: 'Protected route accessed',
    user,
  });
}
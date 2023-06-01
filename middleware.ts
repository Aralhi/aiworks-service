import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/crypto';
 
// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200
    })
  }
  try {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const plaintext = request.headers.get('x-salai-plaintext');
    if (!auth(authToken || '', plaintext || '')) {
      return new NextResponse(
        JSON.stringify({ status: 'failed', message: 'authentication failed' }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      );
    } else {
      console.log('middleware...next');
      const response = NextResponse.next();
      return response;
    }
  } catch (e) {
    console.error('authorization failed', e);
    return new NextResponse(
      JSON.stringify({ status: 'failed', message: 'authorization failed' }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    );
  }
}

export const config = {
  matcher: '/api/:function*',
};

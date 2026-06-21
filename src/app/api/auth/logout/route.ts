// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out successfully' });

  // Clear the session cookie by setting its value to empty and maxAge to 0
  res.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // This tells the browser to expire the cookie immediately
    path: '/',
  });

  return res;
}
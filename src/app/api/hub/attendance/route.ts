// src/app/api/hub/attendance/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // This route is specifically for students to view their own attendance.
  if (session.role !== Role.STUDENT) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: session.userId,
      },
      include: {
        lecture: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        lecture: {
          dateTime: 'desc',
        },
      },
    });

    return NextResponse.json({ attendance: attendanceRecords });

  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}
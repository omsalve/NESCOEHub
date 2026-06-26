// src/app/api/hub/grades/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // This route is specifically for students to view their own grades.
  if (session.role !== Role.STUDENT) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const submissions = await prisma.submission.findMany({
      where: {
        studentId: session.userId,
        grade: {
          not: null, // Only fetch submissions that have been graded
        },
      },
      include: {
        assignment: {
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
        assignment: {
          dueDate: 'desc',
        },
      },
    });

    return NextResponse.json({ submissions });

  } catch (error) {
    console.error('Failed to fetch grades:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}
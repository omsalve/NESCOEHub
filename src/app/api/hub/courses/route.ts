// src/app/api/hub/courses/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';

// Define a detailed type for our payload
export type CourseWithFaculty = Prisma.CourseGetPayload<{
  include: {
    faculty: {
      include: {
        user: {
          select: { name: true };
        };
      };
    };
  };
}>;

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    let courses: CourseWithFaculty[] = [];

    const userWithDept = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { departmentId: true },
    });
    
    if (!userWithDept?.departmentId) {
        return NextResponse.json({ courses: [] });
    }

    const queryArgs = {
      include: {
        faculty: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        name: 'asc' as const,
      },
    };

    // --- NEW ROLE-BASED LOGIC ---

    if (session.role === Role.STUDENT) {
      // Students see courses from their department AND common first-year Applied Sciences courses.
      const appliedSciencesDept = await prisma.department.findFirst({
        where: { name: 'Applied Sciences' },
      });

      courses = await prisma.course.findMany({
        where: {
          OR: [
            { departmentId: userWithDept.departmentId },
            { departmentId: appliedSciencesDept?.id },
          ],
        },
        ...queryArgs,
      });

    } else if (session.role === Role.HOD) {
      // HODs see ALL courses in their department.
      courses = await prisma.course.findMany({
        where: { departmentId: userWithDept.departmentId },
        ...queryArgs,
      });

    } else if (session.role === Role.PROFESSOR) {
      // Professors see only the courses they are assigned to teach.
      courses = await prisma.course.findMany({
        where: { facultyId: session.userId },
        ...queryArgs,
      });
    }

    return NextResponse.json({ courses });

  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

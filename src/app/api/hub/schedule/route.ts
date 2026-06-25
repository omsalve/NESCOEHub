// src/app/api/hub/schedule/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import * as z from 'zod';

const lectureSchema = z.object({
  courseId: z.number(),
  dateTime: z.string().datetime(),
  duration: z.number().int().positive(),
  location: z.string().optional(),
});

// We'll define a more detailed type for our payload
type LectureWithDetails = Prisma.LectureGetPayload<{
  include: {
    faculty: {
      include: {
        user: {
          select: { name: true }
        }
      }
    },
    course: {
      select: { name: true, code: true }
    }
  }
}>;

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    let lectures: LectureWithDetails[] = [];
    const includeDetails = {
      faculty: {
        include: {
          user: { select: { name: true } },
        },
      },
      course: {
        select: { name: true, code: true },
      },
    };

    if (session.role === Role.STUDENT) {
      const userWithDept = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { departmentId: true },
      });

      if (!userWithDept?.departmentId) {
        return NextResponse.json({ lectures: [] });
      }

      lectures = await prisma.lecture.findMany({
        where: { departmentId: userWithDept.departmentId },
        include: includeDetails,
        orderBy: { dateTime: 'asc' },
      });

    } else if (session.role === Role.PROFESSOR || session.role === Role.HOD) {
      lectures = await prisma.lecture.findMany({
        where: { facultyId: session.userId },
        include: includeDetails,
        orderBy: { dateTime: 'asc' },
      });
    }

    return NextResponse.json({ lectures });

  } catch (error) {
    console.error("Failed to fetch schedule:", error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || (session.role !== Role.PROFESSOR && session.role !== Role.HOD)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { courseId, dateTime, duration, location } = lectureSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.departmentId) {
      return NextResponse.json({ error: 'User is not associated with a department' }, { status: 400 });
    }

    const newLecture = await prisma.lecture.create({
      data: {
        courseId,
        dateTime: new Date(dateTime),
        duration,
        location,
        facultyId: session.userId,
        departmentId: user.departmentId,
      },
      include: {
        faculty: {
          include: {
            user: { select: { name: true } },
          },
        },
        course: {
          select: { name: true, code: true },
        },
      },
    });

    return NextResponse.json({ lecture: newLecture }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to create lecture:", error);
    return NextResponse.json({ error: 'Failed to create lecture' }, { status: 500 });
  }
}
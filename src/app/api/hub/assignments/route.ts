// src/app/api/hub/assignments/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import * as z from 'zod';

export type AssignmentWithDetails = Prisma.AssignmentGetPayload<{
  include: {
    submissions: true;
    course: true;
  };
}>;

// Zod schema for creating new assignments
const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  courseId: z.number(),
});

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    let assignments: AssignmentWithDetails[] = [];

    if (session.role === Role.STUDENT) {
      const userWithDept = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { departmentId: true },
      });

      if (userWithDept?.departmentId) {
        assignments = await prisma.assignment.findMany({
          where: { departmentId: userWithDept.departmentId },
          include: {
            submissions: {
              where: { studentId: session.userId },
            },
            course: true,
          },
          orderBy: { dueDate: 'asc' },
        });
      }
    } else if (session.role === Role.PROFESSOR || session.role === Role.HOD) {
      assignments = await prisma.assignment.findMany({
        where: { facultyId: session.userId },
        include: {
          submissions: true,
          course: true,
        },
        orderBy: { dueDate: 'asc' },
      });
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || session.role !== Role.PROFESSOR) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, dueDate, courseId } = assignmentSchema.parse(body);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { department: true },
    });

    if (!course || course.facultyId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to create an assignment for this course' },
        { status: 403 }
      );
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        title,
        description: description || '',
        dueDate: new Date(dueDate),
        course: { connect: { id: courseId } },
        faculty: { connect: { id: session.userId } },
        department: { connect: { id: course.departmentId } },
      },
      include: {
        course: true,
        submissions: true, // <-- THIS IS THE FIX
      },
    });

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('Failed to create assignment:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
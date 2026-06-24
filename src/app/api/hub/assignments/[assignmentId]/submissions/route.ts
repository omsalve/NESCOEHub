// src/app/api/hub/assignments/[assignmentId]/submissions/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const session = await getSession();
  const { assignmentId: assignmentIdParam } = await params;
  const assignmentId = parseInt(assignmentIdParam);

  // 1. Check for a valid session and assignmentId
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (isNaN(assignmentId)) {
    return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
  }

  try {
    // 2. Fetch the assignment to verify ownership/department
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { facultyId: true, departmentId: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const isAuthorized =
      // Rule for Professors: Must be the faculty assigned to the assignment
      (session.role === Role.PROFESSOR && session.userId === assignment.facultyId) ||
      // Rule for HODs: Must be in the same department as the assignment
      (session.role === Role.HOD && session.departmentId === assignment.departmentId);

    // 3. Enforce authorization
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to view these submissions' }, { status: 403 });
    }

    // 4. If authorized, fetch the submissions
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: assignmentId },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return NextResponse.json({ submissions });

  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
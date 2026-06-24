// src/app/api/hub/submissions/[submissionId]/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import * as z from 'zod';

// Zod schema for validating the request body
const gradeSchema = z.object({
  grade: z.number().min(0, "Grade cannot be negative.").max(100, "Grade cannot be more than 100."),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const session = await getSession();
  const { submissionId: submissionIdParam } = await params;
  const submissionId = parseInt(submissionIdParam);

  // 1. Authentication & Basic Authorization Checks
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (isNaN(submissionId)) {
    return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
  }
  
  const isAuthorizedToGrade =
    session.role === Role.PROFESSOR ||
    session.role === Role.HOD ||
    session.role === Role.PRINCIPAL;

  if (!isAuthorizedToGrade) {
    return NextResponse.json({ error: 'Not authorized to grade submissions' }, { status: 403 });
  }

  try {
    // 2. Validate the request body
    const body = await req.json();
    const { grade } = gradeSchema.parse(body);

    // 3. Verify that the user is authorized for this specific submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // 4. Detailed Authorization Logic
    const isOwner = session.userId === submission.assignment.facultyId;
    const isHOD = session.role === Role.HOD && session.departmentId === submission.assignment.departmentId;
    const isPrincipal = session.role === Role.PRINCIPAL;

    if (!isOwner && !isHOD && !isPrincipal) {
      return NextResponse.json({ error: 'You are not authorized to grade this submission' }, { status: 403 });
    }

    // 5. Update the grade in the database
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { grade },
    });

    // 6. Respond with success
    return NextResponse.json({ message: 'Grade updated successfully', submission: updatedSubmission });
  } catch (error) {
    console.error('Error grading submission:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

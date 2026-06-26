// src/app/api/hub/department/students/[studentId]/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getSession();
  const { studentId: studentIdParam } = await params;
  const studentId = parseInt(studentIdParam);

  // 1. Authentication & Authorization
  // MODIFICATION: Allow PRINCIPAL to access this route.
  if (!session || (session.role !== Role.HOD && session.role !== Role.PRINCIPAL)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  if (isNaN(studentId)) {
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  try {
    // 2. Fetch student details
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: Role.STUDENT },
      include: { student: true, department: { select: { name: true } } },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 3. HOD Authorization Check (Principal bypasses this)
    if (session.role === Role.HOD && session.departmentId !== student.departmentId) {
      return NextResponse.json({ error: 'Not authorized to view this student' }, { status: 403 });
    }

    // 4. Fetch Academic Records
    const attendance = await prisma.attendance.findMany({
      where: { studentId: studentId },
      include: { lecture: { include: { course: true } } },
    });

    const submissions = await prisma.submission.findMany({
      where: { studentId: studentId },
      include: { assignment: { include: { course: true } } },
    });

    // 5. Return all data
    return NextResponse.json({
      student,
      attendance,
      submissions,
    });

  } catch (error) {
    console.error(`Failed to fetch data for student ${studentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch student data' }, { status: 500 });
  }
}
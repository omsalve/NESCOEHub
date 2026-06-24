// src/app/api/hub/courses/[courseId]/students/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession();
  const { courseId: courseIdParam } = await params;
  const courseId = parseInt(courseIdParam);

  // 1. Authentication & Basic Validation
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (isNaN(courseId)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    // 2. Fetch the course to verify ownership and department
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { department: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // 3. Authorization Check
    const isProfessor = session.role === Role.PROFESSOR && session.userId === course.facultyId;
    const isHod = session.role === Role.HOD && session.departmentId === course.departmentId;
    const isPrincipal = session.role === Role.PRINCIPAL;

    if (!isProfessor && !isHod && !isPrincipal) {
      return NextResponse.json({ error: 'Not authorized to view this roster' }, { status: 403 });
    }

    // 4. Fetch the correct list of students
    let students;
    if (course.department.name === 'Applied Sciences') {
      // For first-year common courses, fetch all students from the relevant departments
      const groupADepartments = ['Computer Engineering', 'Electrical Engineering', 'AI & Data Science'];
      students = await prisma.student.findMany({
        where: {
          year: 1,
          user: {
            department: { name: { in: groupADepartments } },
          },
        },
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: 'asc' } },
      });
    } else {
      // For department-specific courses, fetch students from that course's department
      students = await prisma.student.findMany({
        where: { user: { departmentId: course.departmentId } },
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: 'asc' } },
      });
    }

    return NextResponse.json({ course, students });

  } catch (error) {
    console.error('Failed to fetch student roster:', error);
    return NextResponse.json({ error: 'Failed to fetch student roster' }, { status: 500 });
  }
}
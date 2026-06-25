// src/app/api/hub/lectures/[lectureId]/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client'; // Import Prisma type

export async function GET(req: Request, { params }: { params: Promise<{ lectureId: string }> }) {
  const session = await getSession();
  const { lectureId: lectureIdParam } = await params;
  const lectureId = parseInt(lectureIdParam);

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (isNaN(lectureId)) {
    return NextResponse.json({ error: 'Invalid lecture ID' }, { status: 400 });
  }

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: { select: { name: true, code: true } },
        department: { select: { name: true } }, // Include department name
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    // Security check: Ensure the professor is assigned to this lecture
    if (session.role === Role.PROFESSOR && lecture.facultyId !== session.userId) {
       return NextResponse.json({ error: 'Not authorized for this lecture' }, { status: 403 });
    }

    let students;
    
    // --- NEW LOGIC ---
    // If the lecture is for a common First-Year (Applied Sciences) course
    if (lecture.department?.name === 'Applied Sciences') {
        // Fetch all first-year students from Group A departments
        const groupADepartmentNames = ['Computer Engineering', 'Electrical Engineering', 'AI & Data Science'];
        
        students = await prisma.student.findMany({
            where: {
                year: 1, // First year students
                user: {
                    department: {
                        name: {
                            in: groupADepartmentNames,
                        },
                    },
                },
            },
            include: {
                user: {
                    select: { name: true },
                },
            },
            orderBy: {
                user: { name: 'asc' },
            },
        });

    } else {
        // --- ORIGINAL LOGIC ---
        // For department-specific courses, fetch students from that department
        students = await prisma.student.findMany({
            where: {
                user: {
                departmentId: lecture.departmentId,
                },
            },
            include: {
                user: {
                select: { name: true },
                },
            },
            orderBy: {
                user: { name: 'asc' },
            },
        });
    }

    return NextResponse.json({ lecture: { ...lecture, students } });

  } catch (error) {
    console.error('Failed to fetch lecture details:', error);
    return NextResponse.json({ error: 'Failed to fetch lecture details' }, { status: 500 });
  }
}
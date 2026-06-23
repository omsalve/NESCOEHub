// src/app/api/hub/dashboard/upcoming-lectures/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const now = new Date();
  // Base query to find lectures that are in the future
  const whereClause: Prisma.LectureWhereInput = {
    dateTime: { gte: now },
  };

  // --- LOGIC CORRECTION FOR STUDENTS ---
  if (session.role === Role.STUDENT) {
    const user = await prisma.user.findUnique({ 
      where: { id: session.userId },
      include: { department: true } 
    });
    
    if (user?.departmentId) {
      // Find the "Applied Sciences" department ID
      const appliedSciencesDept = await prisma.department.findFirst({
        where: { name: 'Applied Sciences' },
        select: { id: true }
      });
      
      // Students should see lectures from their own department AND from Applied Sciences
      whereClause.OR = [
        { departmentId: user.departmentId },
      ];

      if (appliedSciencesDept) {
        whereClause.OR.push({ departmentId: appliedSciencesDept.id });
      }
    }
  } else if (session.role === Role.PROFESSOR || session.role === Role.HOD) {
    // Logic for faculty remains the same
    whereClause.facultyId = session.userId;
  }

  try {
    const lectures = await prisma.lecture.findMany({
      where: whereClause,
      take: 3, // Limit to the next 3 upcoming lectures
      orderBy: { dateTime: 'asc' },
      include: {
        course: { select: { code: true, name: true } },
      },
    });
    return NextResponse.json({ lectures });
  } catch (error: unknown) {
    console.error("Failed to fetch upcoming lectures:", error);
    return NextResponse.json({ error: 'Failed to fetch upcoming lectures' }, { status: 500 });
  }
}
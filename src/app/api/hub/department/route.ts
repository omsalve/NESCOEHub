import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== Role.HOD) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    // First, get the HOD's department ID
    const hodUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { departmentId: true, department: { select: { name: true } } },
    });

    if (!hodUser?.departmentId) {
      return NextResponse.json({ error: 'HOD is not assigned to a department' }, { status: 400 });
    }

    const departmentId = hodUser.departmentId;

    // Fetch all students in that department
    const students = await prisma.user.findMany({
      where: {
        departmentId: departmentId,
        role: Role.STUDENT,
      },
      include: {
        student: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Fetch all faculty (professors) in that department
    const faculty = await prisma.user.findMany({
      where: {
        departmentId: departmentId,
        role: Role.PROFESSOR,
      },
      include: {
        faculty: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      departmentName: hodUser.department?.name,
      students,
      faculty,
    });

  } catch (error) {
    console.error('Failed to fetch department data:', error);
    return NextResponse.json({ error: 'Failed to fetch department data' }, { status: 500 });
  }
}


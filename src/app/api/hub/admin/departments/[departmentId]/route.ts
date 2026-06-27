import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  const session = await getSession();
  const { departmentId: departmentIdParam } = await params;
  const departmentId = parseInt(departmentIdParam);

  // Authorization: Only Principal can access this
  if (!session || session.role !== Role.PRINCIPAL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  if (isNaN(departmentId)) {
    return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
  }

  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    const students = await prisma.user.findMany({
      where: { departmentId: departmentId, role: Role.STUDENT },
      include: { student: true },
      orderBy: { name: 'asc' },
    });

    // FIX: Include both PROFESSOR and HOD roles in the faculty list
    const faculty = await prisma.user.findMany({
      where: { 
        departmentId: departmentId,
        OR: [
            { role: Role.PROFESSOR },
            { role: Role.HOD }
        ]
      },
      include: { faculty: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      departmentName: department.name,
      students,
      faculty,
    });

  } catch (error) {
    console.error(`Failed to fetch data for department ${departmentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch department data' }, { status: 500 });
  }
}
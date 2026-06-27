import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== Role.PRINCIPAL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const students = await prisma.user.findMany({
      where: {
        role: Role.STUDENT,
      },
      include: {
        student: true,
        department: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({ error: 'Failed to fetch students data' }, { status: 500 });
  }
}

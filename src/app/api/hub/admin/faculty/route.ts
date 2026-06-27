import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  const session = await getSession();

  // 🔒 Authorization: Only principal can view all faculty
  if (!session || session.role !== Role.PRINCIPAL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    // 📦 Fetch all professors and HODs with department info
    const faculty = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.PROFESSOR, Role.HOD],
        },
      },
      include: {
        faculty: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error('❌ Failed to fetch faculty:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty data' },
      { status: 500 }
    );
  }
}

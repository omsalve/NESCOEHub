// src/app/api/hub/lectures/[lectureId]/attendance/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import * as z from 'zod';

const attendanceSchema = z.object({
  attendance: z.array(z.object({
    studentId: z.number(),
    status: z.boolean(),
  })),
});

export async function POST(req: Request, { params }: { params: Promise<{ lectureId: string }> }) {
  const session = await getSession();
  const { lectureId: lectureIdStr } = await params;
  const lectureId = parseInt(lectureIdStr);

  if (!session || (session.role !== Role.PROFESSOR && session.role !== Role.HOD)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  if (isNaN(lectureId)) {
    return NextResponse.json({ error: 'Invalid lecture ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { attendance } = attendanceSchema.parse(body);

    // Use a transaction to ensure all attendance is created at once
    const attendanceRecords = attendance.map(att => ({
      lectureId,
      studentId: att.studentId,
      status: att.status,
    }));

    // This will create all attendance records in a single database query
    await prisma.attendance.createMany({
      data: attendanceRecords,
      skipDuplicates: true, // If attendance for this lecture was already taken, it won't throw an error
    });

    return NextResponse.json({ message: 'Attendance saved successfully' }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Failed to save attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
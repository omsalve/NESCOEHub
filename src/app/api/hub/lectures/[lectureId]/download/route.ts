// src/app/api/hub/attendance/[lectureId]/download/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import * as XLSX from 'xlsx';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  const session = await getSession();
  const { lectureId: lectureIdParam } = await params;
  const lectureId = parseInt(lectureIdParam, 10);

  // --- 1. Authorization Check ---
  const validRoles: Role[] = [Role.PROFESSOR, Role.HOD, Role.PRINCIPAL];
  const userRole = session?.role as Role;

  if (!session || !validRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (isNaN(lectureId)) {
    return NextResponse.json({ error: 'Invalid lecture ID' }, { status: 400 });
  }

  try {
    // --- 2. Fetch Lecture + Attendance Data ---
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: { select: { name: true, code: true } },
        attendances: {
          include: {
            student: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
          orderBy: {
            student: { user: { name: 'asc' } },
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    // --- 3. Format Data for Excel ---
    const dataForSheet = lecture.attendances.map((att) => ({
      'Roll No': att.student.rollNo,
      'Student Name': att.student.user.name,
      'Status': att.status ? 'Present' : 'Absent',
    }));

    // --- 4. Create Workbook + Sheet ---
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);

    worksheet['!cols'] = [
      { wch: 15 }, // Roll No
      { wch: 30 }, // Student Name
      { wch: 10 }, // Status
    ];

    const sheetName = lecture.course.code.replace(/ /g, '_');
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // --- 5. Generate Excel Buffer ---
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // --- 6. Return File Response ---
    const formattedDate = new Date(lecture.dateTime)
      .toISOString()
      .split('T')[0];
    const fileName = `Attendance_${lecture.course.code}_${formattedDate}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Failed to generate attendance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

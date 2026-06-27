// src/app/api/hub/admin/overview/route.ts

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
    // 1. Get aggregate college-wide stats
    const [studentCount, facultyCount, departmentCount, totalLectures, presentLectures] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: { in: [Role.PROFESSOR, Role.HOD] } } }),
      prisma.department.count(),
      prisma.lecture.count({ where: { dateTime: { lte: new Date() } } }),
      prisma.attendance.count({ where: { status: true, lecture: { dateTime: { lte: new Date() } } } })
    ]);
    const overallAttendance = totalLectures > 0 ? Math.round((presentLectures / totalLectures) * 100) : 0;

    // 2. Get details for each department with attendance calculation
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { 
            users: { where: { role: Role.STUDENT } },
          },
        },
        users: {
          where: { role: Role.HOD },
          select: { name: true }
        },
        lectures: { // Include lectures to calculate attendance
          where: { dateTime: { lte: new Date() } },
          include: {
            _count: {
              select: { attendances: { where: { status: true } } }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const departmentDetails = departments.map(dept => {
      const totalDepartmentLectures = dept.lectures.length;
      const totalPresentRecords = dept.lectures.reduce((sum, lecture) => sum + lecture._count.attendances, 0);
      
      const averageAttendance = totalDepartmentLectures > 0 
        ? Math.round((totalPresentRecords / (totalDepartmentLectures * dept._count.users)) * 100) 
        : 0;

      return {
        id: dept.id,
        name: dept.name,
        hod: dept.users.find(u => u.name)?.name || 'N/A',
        studentCount: dept._count.users,
        averageAttendance: isNaN(averageAttendance) ? 0 : averageAttendance, // Ensure no NaN values
      };
    });

    return NextResponse.json({
      stats: {
        studentCount,
        facultyCount,
        departmentCount,
        overallAttendance,
      },
      departments: departmentDetails,
    });

  } catch (error) {
    console.error('Failed to fetch admin overview data:', error);
    return NextResponse.json({ error: 'Failed to fetch admin overview data' }, { status: 500 });
  }
}
// src/app/api/hub/calendar/events/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import * as z from 'zod';

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().datetime(),
  type: z.enum(['HOLIDAY', 'EVENT', 'EXAM']),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.departmentId) {
      return NextResponse.json({ events: [] });
    }

    const lectures = await prisma.lecture.findMany({
      where: { departmentId: user.departmentId },
      include: { course: true },
    });

    const assignments = await prisma.assignment.findMany({
      where: { departmentId: user.departmentId },
    });
    
    const generalEvents = await prisma.event.findMany({
       where: {
        OR: [
          { departmentId: null }, // College-wide events
          { departmentId: user.departmentId }, // Department-specific events
        ],
      },
    });

    // Format data for FullCalendar
    const formattedLectures = lectures.map(l => ({
      id: `lecture-${l.id}`,
      title: `${l.course.code}: ${l.course.name}`,
      start: l.dateTime,
      end: new Date(new Date(l.dateTime).getTime() + l.duration * 60000), // duration in minutes
      backgroundColor: '#3b82f6', // blue-500
      borderColor: '#3b82f6',
    }));
    
    const formattedAssignments = assignments.map(a => ({
      id: `assignment-${a.id}`,
      title: `Due: ${a.title}`,
      start: a.dueDate,
      allDay: true,
      backgroundColor: '#f97316', // orange-500
      borderColor: '#f97316',
    }));

    const formattedEvents = generalEvents.map(e => ({
       id: `event-${e.id}`,
       title: e.title,
       start: e.date,
       allDay: true,
       backgroundColor: e.type === 'HOLIDAY' ? '#16a34a' : '#9333ea', // green-600 for holidays, purple-600 for others
       borderColor: e.type === 'HOLIDAY' ? '#16a34a' : '#9333ea',
    }));

    const allEvents = [...formattedLectures, ...formattedAssignments, ...formattedEvents];
    
    return NextResponse.json({ events: allEvents });

  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || (session.role !== Role.PROFESSOR && session.role !== Role.HOD)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.departmentId) {
      return NextResponse.json({ error: 'User not in a department' }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, date, type } = eventSchema.parse(body);

    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || '',
        date: new Date(date),
        type,
        departmentId: user.departmentId,
      },
    });

    return NextResponse.json({ event: newEvent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

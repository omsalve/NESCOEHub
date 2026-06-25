"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Clock, MapPin, User, PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Role } from '@prisma/client';
import { CourseWithFaculty } from '@/app/api/hub/courses/route';
import { AddLectureForm } from '../components/AddLectureForm';

interface Lecture {
  id: number;
  dateTime: string;
  course: {
    name: string;
    code: string;
  };
  faculty: {
    user: {
      name: string;
    };
  };
  location?: string | null;
}

const groupLecturesByDay = (lectures: Lecture[]) => {
  const days: Record<string, Lecture[]> = {};
  lectures.forEach(lecture => {
    const dayName = new Date(lecture.dateTime).toLocaleString('en-US', { weekday: 'long' });
    if (!days[dayName]) {
      days[dayName] = [];
    }
    days[dayName].push(lecture);
  });
  // Sort lectures within each day by time
  for (const day in days) {
    days[day].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }
  return days;
};

const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SchedulePage() {
  const [scheduleData, setScheduleData] = useState<Record<string, Lecture[]>>({});
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [professorCourses, setProfessorCourses] = useState<CourseWithFaculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingLectureToDay, setAddingLectureToDay] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleRes, sessionRes] = await Promise.all([
          fetch('/api/hub/schedule'),
          fetch('/api/session'),
        ]);

        if (!scheduleRes.ok) throw new Error('Failed to fetch schedule data');
        if (!sessionRes.ok) throw new Error('Failed to fetch user session');
        
        const scheduleJson = await scheduleRes.json();
        const sessionJson = await sessionRes.json();
        const role = sessionJson.session?.role || null;

        setScheduleData(groupLecturesByDay(scheduleJson.lectures));
        setUserRole(role);

        if (role === Role.PROFESSOR || role === Role.HOD) {
          const coursesRes = await fetch('/api/hub/courses');
          if (coursesRes.ok) {
            const coursesJson = await coursesRes.json();
            setProfessorCourses(coursesJson.courses);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddLecture = async (newLectureData: { courseId: number; dateTime: string; location?: string, duration: number }) => {
    const res = await fetch('/api/hub/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLectureData),
    });

    if (!res.ok) {
      const { error: resError } = await res.json();
      throw new Error(resError || 'Failed to create lecture.');
    }

    const { lecture: newLecture } = await res.json();
    
    setScheduleData(prevData => {
      const dayName = new Date(newLecture.dateTime).toLocaleString('en-US', { weekday: 'long' });
      const updatedDayLectures = [...(prevData[dayName] || []), newLecture];
      updatedDayLectures.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      return { ...prevData, [dayName]: updatedDayLectures };
    });

    setAddingLectureToDay(null);
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
    hover: { y: -5, transition: { type: 'spring', stiffness: 300 } }
  };

  if (isLoading) return <div className="p-8 text-center">Loading your schedule...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">Error: {error}</div>;

  const isProfessorOrHod = userRole === Role.PROFESSOR || userRole === Role.HOD;

  return (
    <motion.div className="max-w-7xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-8 text-gray-900">
        Weekly Schedule
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {orderedDays.map((day) => {
          const classes = scheduleData[day] || [];
          return (
          <motion.div key={day} variants={itemVariants} whileHover="hover" className="bg-white rounded-xl shadow-md flex flex-col min-h-[300px] transition-shadow duration-300">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-br from-white to-gray-50 rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-800">{day}</h2>
              {isProfessorOrHod && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAddingLectureToDay(addingLectureToDay === day ? null : day)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors"
                  aria-label={`Add lecture to ${day}`}
                >
                  <PlusCircle className="w-5 h-5" />
                </motion.button>
              )}
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <AnimatePresence>
                {addingLectureToDay === day && (
                  <AddLectureForm
                    courses={professorCourses}
                    day={day}
                    onAddLecture={handleAddLecture}
                    onCancel={() => setAddingLectureToDay(null)}
                  />
                )}
              </AnimatePresence>
              
              <AnimatePresence>
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    key={cls.id} 
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all cursor-default"
                  >
                    <p className="font-bold text-gray-900">{cls.course.name}</p>
                    <p className="text-sm text-gray-500 font-mono tracking-tight">{cls.course.code}</p>
                    <div className="mt-3 space-y-1.5 text-sm text-gray-700">
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2.5 flex-shrink-0 text-gray-400" />
                            <span>{new Date(cls.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-2.5 flex-shrink-0 text-gray-400" />
                            <span>{cls.faculty.user.name}</span>
                        </div>
                         <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2.5 flex-shrink-0 text-gray-400" />
                            <span>{cls.location || 'TBA'}</span>
                        </div>
                    </div>
                    {isProfessorOrHod && (
                        <div className="mt-4">
                             <Link href={`/hub/attendance/${cls.id}`}>
                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-full text-center px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                                >
                                    Take Attendance
                                </motion.button>
                            </Link>
                        </div>
                    )}
                  </motion.div>
                ))
              ) : (
                 addingLectureToDay !== day && (
                    <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-gray-400 text-center px-4"
                    >
                        <CalendarIcon className="w-12 h-12 mb-3"/>
                        <p className="text-sm font-semibold">No classes scheduled.</p>
                    </motion.div>
                )
              )}
              </AnimatePresence>
            </div>
          </motion.div>
        )})}
      </div>
    </motion.div>
  );
}


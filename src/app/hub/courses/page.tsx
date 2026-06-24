// src/app/hub/courses/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book, User } from 'lucide-react';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { CourseWithFaculty } from '../../api/hub/courses/route';

export default function CoursesPage() {
  const [coursesData, setCoursesData] = useState<CourseWithFaculty[]>([]);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, sessionRes] = await Promise.all([
          fetch('/api/hub/courses', { cache: 'no-store' }),
          fetch('/api/session'),
        ]);

        if (!coursesRes.ok) throw new Error('Failed to fetch course data');
        const coursesData = await coursesRes.json();
        setCoursesData(coursesData.courses);
        
        if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            setUserRole(sessionData.session?.role || null);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const isFacultyOrAdmin = userRole === Role.PROFESSOR || userRole === Role.HOD || userRole === Role.PRINCIPAL;

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } };

  if (isLoading) return <div className="p-8">Loading courses...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-6 text-gray-900">
        Your Courses
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesData.map((course) => {
          const courseCard = (
            <motion.div
              key={course.id}
              variants={itemVariants}
              className={`bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between ${isFacultyOrAdmin ? 'hover:shadow-xl hover:border-blue-500 border-2 border-transparent transition-all cursor-pointer' : ''}`}
            >
              <div>
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <Book className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-blue-700">{course.code}</p>
                    <p className="font-semibold text-gray-800">{course.name}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-4">
                  <User className="w-4 h-4 mr-2" />
                  <span>{course.faculty?.user?.name || 'Not Assigned'}</span>
                </div>
              </div>
            </motion.div>
          );

          return isFacultyOrAdmin ? (
            <Link href={`/hub/courses/${course.id}`} key={course.id}>
              {courseCard}
            </Link>
          ) : (
            courseCard
          );
        })}
      </div>
    </motion.div>
  );
}
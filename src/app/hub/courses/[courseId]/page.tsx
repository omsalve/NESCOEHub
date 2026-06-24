// src/app/hub/courses/[courseId]/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, BookOpen } from 'lucide-react';
import { Student, Course, User as UserType } from '@prisma/client';

// Define the types for our data
type StudentWithUser = Student & { user: { name: string } };
type CourseWithDetails = Course & { department: { name: string } };

export default function CourseRosterPage({ params }: { params: Promise<{ courseId: string }> }) {
  const [course, setCourse] = useState<CourseWithDetails | null>(null);
  const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setCourseId(p.courseId));
  }, [params]);

  useEffect(() => {
    if (!courseId) return;
    const fetchRoster = async () => {
      try {
        const res = await fetch(`/api/hub/courses/${courseId}/students`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch roster');
        }
        const data = await res.json();
        setCourse(data.course);
        setStudents(data.students);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoster();
  }, [courseId]);

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (isLoading) return <div className="p-8">Loading student roster...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!course) return <div className="p-8">Course not found.</div>;

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
        <p className="text-gray-500">{course.code}</p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg">
        <ul className="divide-y divide-gray-200">
          {students.map(student => (
            <li key={student.id} className="p-4 flex items-center">
              <User className="w-6 h-6 mr-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-800">{student.user.name}</p>
                <p className="text-sm text-gray-500">{student.rollNo}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
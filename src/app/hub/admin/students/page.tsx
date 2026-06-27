"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { User as UserType, Student, Department } from '@prisma/client';

type StudentWithDetails = UserType & { 
  student: Student | null;
  department: { name: string } | null;
};

export default function AllStudentsPage() {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/hub/admin/students');
        if (!res.ok) throw new Error('Failed to fetch students');
        const data = await res.json();
        // FIX: Ensure data.students is an array before setting state
        setStudents(data.students || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (isLoading) return <div className="p-8">Loading all students...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-8 text-gray-900">
        All Students
      </motion.h1>
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(student => (
          <Link href={`/hub/department/students/${student.id}`} key={student.id}>
            <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl shadow-md border hover:shadow-lg hover:border-blue-500 cursor-pointer">
              <p className="font-semibold text-gray-800">{student.name}</p>
              <p className="text-sm text-gray-500">{student.student?.rollNo}</p>
              <p className="text-sm text-gray-500">{student.department?.name}</p>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  );
}


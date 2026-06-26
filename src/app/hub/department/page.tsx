"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GraduationCap } from 'lucide-react';
import { User as UserType, Student, Faculty } from '@prisma/client';
import Link from 'next/link'; // Import Link

type StudentWithDetails = UserType & { student: Student | null };
type FacultyWithDetails = UserType & { faculty: Faculty | null };

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export default function DepartmentPage() {
  const [departmentName, setDepartmentName] = useState<string>('');
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [faculty, setFaculty] = useState<FacultyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'faculty'>('students');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/hub/department');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'You are not authorized to view this page.');
        }
        const data = await res.json();
        setDepartmentName(data.departmentName);
        setStudents(data.students);
        setFaculty(data.faculty);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading department details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-2 text-gray-900">
        {departmentName}
      </motion.h1>
      <motion.p variants={itemVariants} className="text-gray-500 mb-8">
        Department Overview
      </motion.p>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="mb-6 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-3 text-sm font-semibold flex items-center transition-colors ${
            activeTab === 'students'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          <User className="w-5 h-5 mr-2" />
          Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('faculty')}
          className={`px-6 py-3 text-sm font-semibold flex items-center transition-colors ${
            activeTab === 'faculty'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          <GraduationCap className="w-5 h-5 mr-2" />
          Faculty ({faculty.length})
        </button>
      </motion.div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'students' && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {students.map(user => (
                <Link key={user.id} href={`/hub/department/students/${user.id}`}>
                    <motion.div 
                      variants={itemVariants} 
                      className="bg-white p-4 rounded-xl shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all"
                    >
                      <p className="font-semibold text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.student?.rollNo}</p>
                      <p className="text-sm text-gray-500">Year: {user.student?.year} | Section: {user.student?.section}</p>
                    </motion.div>
                </Link>
              ))}
            </motion.div>
          )}
          {activeTab === 'faculty' && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {faculty.map(user => (
                <motion.div key={user.id} variants={itemVariants} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.faculty?.designation}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}


"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GraduationCap } from 'lucide-react';
import { User as UserType, Student, Faculty } from '@prisma/client';
import Link from 'next/link';

type StudentWithDetails = UserType & { student: Student | null };
type FacultyWithDetails = UserType & { faculty: Faculty | null };

const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export default function AdminDepartmentDetailPage({ params }: { params: Promise<{ departmentId: string }> }) {
  const [departmentName, setDepartmentName] = useState<string>('');
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [faculty, setFaculty] = useState<FacultyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'faculty'>('students');
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setDepartmentId(p.departmentId));
  }, [params]);

  useEffect(() => {
    if (!departmentId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/hub/admin/departments/${departmentId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch department data.');
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
  }, [departmentId]);

  if (isLoading) return <div className="p-8 text-center">Loading department details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <motion.div className="max-w-7xl mx-auto" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-8 text-gray-900">{departmentName}</motion.h1>
      
      <motion.div variants={itemVariants} className="mb-6 flex border-b border-gray-200">
        <button onClick={() => setActiveTab('students')} className={`px-6 py-3 text-sm font-semibold flex items-center transition-colors ${activeTab === 'students' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
          <User className="w-5 h-5 mr-2" /> Students ({students.length})
        </button>
        <button onClick={() => setActiveTab('faculty')} className={`px-6 py-3 text-sm font-semibold flex items-center transition-colors ${activeTab === 'faculty' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
          <GraduationCap className="w-5 h-5 mr-2" /> Faculty ({faculty.length})
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'students' && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {students.map(user => (
                <Link key={user.id} href={`/hub/department/students/${user.id}`}>
                  <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl shadow-md border hover:shadow-lg hover:border-blue-500 cursor-pointer">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.student?.rollNo}</p>
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
                <motion.div key={user.id} variants={itemVariants} className="bg-white p-4 rounded-xl shadow-md border">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.faculty?.designation}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
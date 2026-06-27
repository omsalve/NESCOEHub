"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as UserType, Faculty, Department } from '@prisma/client';

type FacultyWithDetails = UserType & { 
  faculty: Faculty | null;
  department: { name: string } | null;
};

export default function AllFacultyPage() {
  const [faculty, setFaculty] = useState<FacultyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await fetch('/api/hub/admin/faculty');
        if (!res.ok) throw new Error('Failed to fetch faculty');
        const data = await res.json();
        setFaculty(data.faculty);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (isLoading) return <div className="p-8">Loading all faculty...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-8 text-gray-900">
        All Faculty
      </motion.h1>
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map(member => (
          <motion.div key={member.id} variants={itemVariants} className="bg-white p-4 rounded-xl shadow-md border">
            <p className="font-semibold text-gray-800">{member.name}</p>
            <p className="text-sm text-gray-500">{member.faculty?.designation}</p>
            <p className="text-sm text-gray-500">{member.department?.name}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
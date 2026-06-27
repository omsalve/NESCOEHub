"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, GraduationCap, Briefcase, Percent, Send } from 'lucide-react';
import { SendNotificationModal } from '../../components/SendNotificationModal';

// Define types for our data
interface Stats {
  studentCount: number;
  facultyCount: number;
  departmentCount: number;
  overallAttendance: number;
}
interface Department {
  id: number;
  name: string;
  hod: string;
  studentCount: number;
  averageAttendance: number;
}

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
  <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 ${color} hover:shadow-xl transition-shadow duration-200 cursor-pointer`}>
    {icon}
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium opacity-80">{label}</p>
    </div>
  </div>
);

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/hub/admin/overview', { cache: 'no-store' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch overview data.');
        }
        const data = await res.json();
        setStats(data.stats);
        setDepartments(data.departments);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (isLoading) return <div className="p-8">Loading College Overview...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <>
      <SendNotificationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
                Admin Overview
            </h1>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
                <Send className="w-4 h-4 mr-2" />
                Send Notification
            </button>
        </motion.div>

        {/* Clickable Stat Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/hub/admin/students">
            <StatCard 
                icon={<Users className="w-10 h-10"/>} 
                label="Total Students" 
                value={stats?.studentCount ?? 0}
                color="bg-blue-500 text-white"
            />
          </Link>
          <Link href="/hub/admin/faculty">
            <StatCard 
                icon={<GraduationCap className="w-10 h-10"/>} 
                label="Total Faculty" 
                value={stats?.facultyCount ?? 0}
                color="bg-green-500 text-white"
            />
          </Link>
           <StatCard 
              icon={<Briefcase className="w-10 h-10"/>} 
              label="Departments" 
              value={stats?.departmentCount ?? 0}
              color="bg-yellow-500 text-white"
          />
        </motion.div>

        {/* Department Performance Table */}
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Department Performance</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Department</div>
              <div className="text-center">Students</div>
              <div className="text-center">Avg. Attendance</div>
            </div>
            <div className="divide-y divide-gray-200">
              {departments.map(dept => (
                <Link href={`/hub/admin/departments/${dept.id}`} key={dept.id} className="grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors duration-150">
                  <div className="col-span-2">
                    <p className="font-semibold text-lg text-gray-800">{dept.name}</p>
                    <p className="text-sm text-gray-500">HOD: {dept.hod}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-800">{dept.studentCount}</p>
                  </div>
                  <div className="text-center">
                     <p className={`font-bold text-lg ${dept.averageAttendance > 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {dept.averageAttendance}%
                     </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

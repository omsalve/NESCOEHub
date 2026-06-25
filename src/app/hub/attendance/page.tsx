"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, X } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Role } from '@prisma/client';


// Define the type for a single attendance record, including nested lecture and course info
interface AttendanceRecord {
  id: number;
  status: boolean;
  lecture: {
    id: number;
    dateTime: string;
    course: {
      code: string;
      name: string;
    };
  };
}

// Group attendance records by course code
const groupAttendanceByCourse = (records: AttendanceRecord[]) => {
  return records.reduce((acc, record) => {
    const courseCode = record.lecture.course.code;
    if (!acc[courseCode]) {
      acc[courseCode] = {
        name: record.lecture.course.name,
        records: [],
        present: 0,
        absent: 0,
      };
    }
    acc[courseCode].records.push(record);
    if (record.status) {
      acc[courseCode].present++;
    } else {
      acc[courseCode].absent++;
    }
    return acc;
  }, {} as Record<string, { name: string; records: AttendanceRecord[]; present: number; absent: number }>);
};

// Helper function to format percentages
const formatPercentage = (present: number, total: number) => {
    if (total === 0) return 'N/A';
    const percentage = (present / total) * 100;
    return percentage % 1 === 0 ? percentage.toString() : percentage.toFixed(1);
}


export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<Record<string, { name: string; records: AttendanceRecord[]; present: number; absent: number }>>({});
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const [attendanceRes, sessionRes] = await Promise.all([
            fetch('/api/hub/attendance'),
            fetch('/api/session')
        ]);
        
        if (!attendanceRes.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            setUserRole(sessionData.session?.role || null);
        }

        const data = await attendanceRes.json();
        
        // Ensure we only calculate attendance for past lectures
        const now = new Date();
        const pastRecords = data.attendance.filter((record: AttendanceRecord) => new Date(record.lecture.dateTime) <= now);

        setAllRecords(pastRecords);
        setAttendanceData(groupAttendanceByCourse(pastRecords));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  const totalClasses = allRecords.length;
  const presentClasses = allRecords.filter(r => r.status).length;
  const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
  const isStudent = userRole === Role.STUDENT;

  if (isLoading) {
    return <div className="p-8">Loading attendance records...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-6 text-gray-900">
        Your Attendance
      </motion.h1>

      {isStudent && (
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg p-6 mb-8 flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Overall Attendance</h2>
                <p className="text-gray-600">You have attended {presentClasses} out of {totalClasses} classes.</p>
            </div>
            <div style={{ width: 100, height: 100 }}>
                <CircularProgressbar
                    value={overallPercentage}
                    text={`${overallPercentage}%`}
                    styles={buildStyles({
                        textColor: '#15803d',
                        pathColor: '#22c55e',
                        trailColor: '#d1fae5',
                    })}
                />
            </div>
        </motion.div>
      )}

      <div className="space-y-8">
        {Object.entries(attendanceData).map(([courseCode, courseInfo]) => {
          const total = courseInfo.present + courseInfo.absent;
          const percentage = formatPercentage(courseInfo.present, total);

          return (
            <motion.div
              key={courseCode}
              variants={itemVariants}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-blue-100 rounded-full mr-4">
                    <BookOpen className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{courseInfo.name} ({courseCode})</h2>
                    <p className="text-gray-600">
                      Attendance: <span className="font-semibold">{percentage}%</span> ({courseInfo.present} / {total} classes)
                    </p>
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-gray-200">
                {courseInfo.records.map((record) => (
                  <li key={record.id} className="px-6 py-4 flex items-center justify-between">
                    <p className="text-gray-700">
                      {new Date(record.lecture.dateTime).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    {record.status ? (
                      <span className="flex items-center text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                        <Check className="w-4 h-4 mr-1" />
                        Present
                      </span>
                    ) : (
                      <span className="flex items-center text-sm font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                        <X className="w-4 h-4 mr-1" />
                        Absent
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}


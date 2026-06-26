// src/app/hub/department/students/[studentId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, CheckCircle, BarChart2 } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

// Define complex types for the fetched data
interface Attendance {
  status: boolean;
  lecture: {
    course: {
      code: string;
      name: string;
    };
  };
}

interface Submission {
  grade: number | null;
  assignment: {
    course: {
      code: string;
      name: string;
    };
  };
}

interface StudentProfile {
  student: {
    id: number;
    name: string;
    email: string;
    student: { rollNo: string; year: number; section: string } | null;
    department: { name: string } | null;
  };
  attendance: Attendance[];
  submissions: Submission[];
}

// Helper to calculate and group stats
const processAcademicData = (data: StudentProfile) => {
    const courses: Record<string, { name: string; attendance: { present: number; total: number }; grades: number[] }> = {};

    data.attendance.forEach(att => {
        const courseCode = att.lecture.course.code;
        if (!courses[courseCode]) {
            courses[courseCode] = { name: att.lecture.course.name, attendance: { present: 0, total: 0 }, grades: [] };
        }
        courses[courseCode].attendance.total++;
        if (att.status) {
            courses[courseCode].attendance.present++;
        }
    });

    data.submissions.forEach(sub => {
        const courseCode = sub.assignment.course.code;
        if (!courses[courseCode]) {
            // This case handles courses where a student has a grade but no attendance record yet
            courses[courseCode] = { name: sub.assignment.course.name, attendance: { present: 0, total: 0 }, grades: [] };
        }
        if (sub.grade !== null) {
            courses[courseCode].grades.push(sub.grade);
        }
    });

    return courses;
};


export default function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courseStats, setCourseStats] = useState<ReturnType<typeof processAcademicData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setStudentId(p.studentId));
  }, [params]);

  useEffect(() => {
    if (!studentId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/hub/department/students/${studentId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch student data.');
        }
        const data: StudentProfile = await res.json();
        setProfile(data);
        setCourseStats(processAcademicData(data));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  if (isLoading) return <div className="p-8 text-center">Loading student profile...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!profile) return <div className="p-8 text-center">Student not found.</div>;
  
  const overallAttendance = Object.values(courseStats).reduce((acc, course) => {
    acc.present += course.attendance.present;
    acc.total += course.attendance.total;
    return acc;
  }, {present: 0, total: 0});

  const overallPercentage = overallAttendance.total > 0 ? Math.round((overallAttendance.present / overallAttendance.total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
      {/* Student Header */}
      <div className="flex items-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mr-6">
          <User className="w-10 h-10 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{profile.student.name}</h1>
          <p className="text-gray-500">{profile.student.student?.rollNo} - {profile.student.department?.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center">
            <h3 className="font-bold text-lg mb-4 text-green-700">Overall Attendance</h3>
            <div style={{ width: 100, height: 100 }}>
              <CircularProgressbar
                value={overallPercentage}
                text={`${overallPercentage}%`}
                styles={buildStyles({ textColor: '#15803d', pathColor: '#22c55e', trailColor: '#d1fae5' })}
              />
            </div>
          </div>
          {/* Add more summary cards here if needed */}
      </div>

      {/* Course-wise breakdown */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Course Breakdown</h2>
      <div className="space-y-4">
        {Object.entries(courseStats).map(([code, stats]) => {
          const attendancePercentage = stats.attendance.total > 0 ? Math.round((stats.attendance.present / stats.attendance.total) * 100) : 0;
          const avgGrade = stats.grades.length > 0 ? (stats.grades.reduce((a, b) => a + b, 0) / stats.grades.length).toFixed(1) : 'N/A';
          return (
            <div key={code} className="bg-white p-4 rounded-xl shadow-md">
                <h4 className="font-bold text-lg text-gray-800">{stats.name} ({code})</h4>
                <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-500"/>
                        <p className="text-sm text-gray-600">Attendance: <span className="font-semibold">{attendancePercentage}%</span> ({stats.attendance.present}/{stats.attendance.total})</p>
                    </div>
                    <div className="flex items-center">
                        <BarChart2 className="w-5 h-5 mr-2 text-blue-500"/>
                        <p className="text-sm text-gray-600">Avg. Grade: <span className="font-semibold">{avgGrade}</span></p>
                    </div>
                </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  );
}

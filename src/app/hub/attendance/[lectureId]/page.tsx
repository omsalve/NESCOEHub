// src/app/hub/attendance/[lectureId]/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Check, Download } from 'lucide-react';

// (Interface definitions remain the same)
interface Student {
  id: number;
  rollNo: string;
  user: {
    name: string;
  };
}

interface LectureDetails {
  id: number;
  dateTime: string;
  course: {
    name: string;
    code: string;
  };
  students: Student[];
}


export default function TakeAttendancePage({ params }: { params: Promise<{ lectureId: string }> }) {
  const router = useRouter();
  const [lecture, setLecture] = useState<LectureDetails | null>(null);
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lectureId, setLectureId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setLectureId(p.lectureId));
  }, [params]);


  useEffect(() => {
    // This effect remains the same
    if (!lectureId) return;
    
    const fetchLectureDetails = async () => {
      try {
        const res = await fetch(`/api/hub/lectures/${lectureId}`);
        if (!res.ok) throw new Error('Failed to fetch lecture details');
        const data = await res.json();
        setLecture(data.lecture);
        const initialAttendance = data.lecture.students.reduce((acc: Record<number, boolean>, student: Student) => {
          acc[student.id] = true;
          return acc;
        }, {});
        setAttendance(initialAttendance);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLectureDetails();
  }, [lectureId]);

  // (handleToggleAttendance and handleSelectAll functions remain the same)
  const handleToggleAttendance = (studentId: number) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };
  
  const handleSelectAll = (status: boolean) => {
    const newAttendance = { ...attendance };
    lecture?.students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    // This function remains the same
    setIsSaving(true);
    setError(null);
    try {
        const payload = Object.entries(attendance).map(([studentId, status]) => ({
            studentId: parseInt(studentId),
            status,
        }));

        const res = await fetch(`/api/hub/lectures/${lectureId}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attendance: payload }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to save attendance');
        }
        
        router.push('/hub/schedule');
        router.refresh();

    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
        setIsSaving(false);
    }
  };

  // --- THIS IS THE FIX ---
  const handleDownload = async () => {
    if (!lectureId) return;
    // Correct the URL from /attendance/ to /lectures/
    window.location.href = `/api/hub/lectures/${lectureId}/download`;
  };
  // --- END OF FIX ---


  if (isLoading) return <div className="p-8">Loading student list...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!lecture) return <div className="p-8">Lecture not found.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{lecture.course.name}</h1>
        <p className="text-gray-500">
          {new Date(lecture.dateTime).toLocaleString()}
        </p>
      </div>
      
      <div className="flex justify-end gap-2 mb-4">
        <button 
          onClick={handleDownload}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center"
        >
            <Download className="w-4 h-4 mr-2"/>
            Download Report
        </button>
        <button onClick={() => handleSelectAll(true)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Mark All Present</button>
        <button onClick={() => handleSelectAll(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Mark All Absent</button>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <ul className="divide-y divide-gray-200">
          {lecture.students.map((student) => (
            <li
              key={student.id}
              onClick={() => handleToggleAttendance(student.id)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <User className="w-6 h-6 mr-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">{student.user.name}</p>
                  <p className="text-sm text-gray-500">{student.rollNo}</p>
                </div>
              </div>
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                  attendance[student.id] ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                {attendance[student.id] && <Check className="w-4 h-4 text-white" />}
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={isSaving}
        className="w-full mt-6 px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400"
      >
        {isSaving ? 'Saving...' : 'Save Attendance'}
      </button>

    </motion.div>
  );
}
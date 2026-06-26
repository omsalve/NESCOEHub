// src/app/hub/grades/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle } from 'lucide-react';

// Define the type for a submission, including nested assignment and course info
interface GradedSubmission {
  id: number;
  grade: number | null;
  assignment: {
    id: number;
    title: string;
    course: {
      code: string;
      name: string;
    };
  };
}

// Group submissions by course code
const groupSubmissionsByCourse = (submissions: GradedSubmission[]) => {
  return submissions.reduce((acc, submission) => {
    const courseCode = submission.assignment.course.code;
    if (!acc[courseCode]) {
      acc[courseCode] = {
        name: submission.assignment.course.name,
        submissions: [],
      };
    }
    acc[courseCode].submissions.push(submission);
    return acc;
  }, {} as Record<string, { name: string; submissions: GradedSubmission[] }>);
};

export default function GradesPage() {
  const [gradedSubmissions, setGradedSubmissions] = useState<Record<string, { name: string; submissions: GradedSubmission[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await fetch('/api/hub/grades');
        if (!res.ok) {
          throw new Error('Failed to fetch grades');
        }
        const data = await res.json();
        setGradedSubmissions(groupSubmissionsByCourse(data.submissions));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  if (isLoading) {
    return <div className="p-8">Loading your grades...</div>;
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
        Your Grades
      </motion.h1>

      <div className="space-y-8">
        {Object.keys(gradedSubmissions).length > 0 ? (
          Object.entries(gradedSubmissions).map(([courseCode, courseInfo]) => (
            <motion.div
              key={courseCode}
              variants={itemVariants}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full mr-4">
                    <BookOpen className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{courseInfo.name} ({courseCode})</h2>
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-gray-200">
                {courseInfo.submissions.map((submission) => (
                  <li key={submission.id} className="px-6 py-4 flex items-center justify-between">
                    <p className="font-medium text-gray-700">{submission.assignment.title}</p>
                    <span className="flex items-center text-lg font-bold text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {submission.grade}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))
        ) : (
          <motion.p variants={itemVariants} className="text-gray-500 text-center p-8">
            No grades have been posted yet.
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
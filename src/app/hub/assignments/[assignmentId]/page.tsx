// src/app/hub/assignments/[assignmentId]/page.tsx

"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { User, FileText, CheckCircle, Save } from 'lucide-react';
import Link from 'next/link';

// Define the types for our data based on the API response
interface Submission {
  id: number;
  fileUrl: string;
  submittedAt: string;
  grade: number | null;
  student: {
    user: {
      name: string;
    };
  };
}

// Main component for viewing assignment submissions
export default function AssignmentSubmissionsPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setAssignmentId(p.assignmentId));
  }, [params]);

  const fetchSubmissions = async () => {
    if (!assignmentId) return;
    try {
      const res = await fetch(`/api/hub/assignments/${assignmentId}/submissions`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch submissions');
      }
      const data = await res.json();
      setSubmissions(data.submissions);
      // Initialize grades state
      const initialGrades = data.submissions.reduce((acc: Record<number, string>, sub: Submission) => {
        acc[sub.id] = sub.grade?.toString() || '';
        return acc;
      }, {});
      setGrades(initialGrades);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const handleGradeChange = (submissionId: number, value: string) => {
    setGrades(prev => ({ ...prev, [submissionId]: value }));
  };

  const handleSaveGrade = async (submissionId: number) => {
    const grade = parseFloat(grades[submissionId]);
    if (isNaN(grade)) {
      alert('Please enter a valid number for the grade.');
      return;
    }

    try {
      const res = await fetch(`/api/hub/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save grade');
      }
      // Re-fetch submissions to show updated grade status
      fetchSubmissions(); 
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'An error occurred while saving.');
    }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  if (isLoading) {
    return <div className="p-8">Loading submissions...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-6 text-gray-900">
        Assignment Submissions
      </motion.h1>

      <div className="bg-white rounded-xl shadow-lg">
        <ul className="divide-y divide-gray-200">
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <motion.li
                key={submission.id}
                variants={itemVariants}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between"
              >
                <div className="flex items-center mb-4 sm:mb-0">
                  <User className="w-6 h-6 mr-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">{submission.student.user.name}</p>
                    <p className="text-sm text-gray-500">
                      Submitted on: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                     <Link href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline mt-1">
                        <FileText className="w-4 h-4 mr-1" />
                        View Submission
                    </Link>
                  </div>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <input
                        type="number"
                        placeholder="Grade"
                        value={grades[submission.id] || ''}
                        onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={submission.grade !== null}
                    />
                    {submission.grade === null ? (
                        <button 
                            onClick={() => handleSaveGrade(submission.id)}
                            className="p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            aria-label="Save grade"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    ) : (
                         <span className="flex items-center text-sm font-semibold text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Graded: {submission.grade}
                        </span>
                    )}
                </div>
              </motion.li>
            ))
          ) : (
            <motion.p variants={itemVariants} className="p-6 text-center text-gray-500">
              No submissions yet for this assignment.
            </motion.p>
          )}
        </ul>
      </div>
    </motion.div>
  );
}
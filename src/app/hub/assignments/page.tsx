"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AssignmentWithDetails } from '@/app/api/hub/assignments/route';
import { SubmissionModal } from '../components/SubmissionModel';
import { AddAssignmentForm } from '../components/AddAssignmentsForm';
import { CourseWithFaculty } from '@/app/api/hub/courses/route';
import { Role } from '@prisma/client';
import { Upload, PlusCircle, Users } from 'lucide-react';

// A helper function to determine the status for a student
const getStudentAssignmentStatus = (assignment: AssignmentWithDetails) => {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);

  if (assignment.submissions && assignment.submissions.length > 0) {
    const submission = assignment.submissions[0];
    return submission.grade ? 'Graded' : 'Submitted';
  }
  if (dueDate < now) {
    return 'Past Due';
  }
  return 'Upcoming';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Upcoming': return 'text-yellow-600';
    case 'Submitted': return 'text-blue-600';
    case 'Graded': return 'text-green-600';
    case 'Past Due': return 'text-red-600';
    default: return 'text-gray-500';
  }
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithDetails | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [professorCourses, setProfessorCourses] = useState<CourseWithFaculty[]>([]);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsRes, sessionRes] = await Promise.all([
          fetch('/api/hub/assignments'),
          fetch('/api/session'),
        ]);

        if (!assignmentsRes.ok) throw new Error('Failed to fetch assignments');
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.assignments);

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          const role = sessionData.session?.role;
          setUserRole(role);

          if (role === Role.PROFESSOR || role === Role.HOD) {
            const coursesRes = await fetch('/api/hub/courses');
            if (coursesRes.ok) {
              const coursesData = await coursesRes.json();
              setProfessorCourses(coursesData.courses);
            }
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddAssignment = async (newAssignmentData: { title: string; description: string; dueDate: string; courseId: number }) => {
    const res = await fetch('/api/hub/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssignmentData),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Failed to create assignment.');
    }

    const { assignment: newAssignment } = await res.json();
    setAssignments(prev => [newAssignment, ...prev]);
    setIsAddingAssignment(false);
  };

  const handleSubmissionSuccess = (assignmentId: number) => {
    setAssignments(prev =>
      prev.map(asmnt => {
        if (asmnt.id === assignmentId) {
          const mockSubmission = {
            id: Date.now(),
            assignmentId: assignmentId,
            studentId: 0,
            fileUrl: '',
            submittedAt: new Date(),
            grade: null,
            course: asmnt.course,
          };
          return { ...asmnt, submissions: [mockSubmission] };
        }
        return asmnt;
      })
    );
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } };

  const isFaculty = userRole === Role.PROFESSOR || userRole === Role.HOD;

  if (isLoading) return <div className="p-8">Loading assignments...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <>
      <SubmissionModal
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onSubmissionSuccess={handleSubmissionSuccess}
      />

      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          {isFaculty && (
            <button
              onClick={() => setIsAddingAssignment(!isAddingAssignment)}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              New Assignment
            </button>
          )}
        </motion.div>

        <AnimatePresence>
          {isAddingAssignment && (
            <AddAssignmentForm
              courses={professorCourses}
              onAddAssignment={handleAddAssignment}
              onCancel={() => setIsAddingAssignment(false)}
            />
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {assignments.length > 0 ? (
            assignments.map((assignment) => {
              if (isFaculty) {
                // FACULTY VIEW: Link to submissions page
                return (
                  <Link href={`/hub/assignments/${assignment.id}`} key={assignment.id}>
                    <motion.div
                      variants={itemVariants}
                      className="p-4 bg-white rounded-lg shadow-md flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{assignment.title}</p>
                        <p className="text-sm text-gray-500">
                          {assignment.course.name} - Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm font-semibold text-blue-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{assignment.submissions.length} Submissions</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              } else {
                // STUDENT VIEW: Original view with submit button
                const status = getStudentAssignmentStatus(assignment);
                const isSubmittable = status === 'Upcoming' || status === 'Past Due';
                return (
                  <motion.div
                    key={assignment.id}
                    variants={itemVariants}
                    className="p-4 bg-white rounded-lg shadow-md flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{assignment.title}</p>
                      <p className="text-sm text-gray-500">
                        {assignment.course.name} - Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-sm font-bold ${getStatusColor(status)}`}>
                        {status}
                        {status === 'Graded' && assignment.submissions[0]?.grade && `: ${assignment.submissions[0].grade}`}
                      </span>
                      {isSubmittable && (
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 flex items-center"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Submit
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              }
            })
          ) : (
            <motion.p variants={itemVariants} className="text-gray-500">No assignments found.</motion.p>
          )}
        </div>
      </motion.div>
    </>
  );
}

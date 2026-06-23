"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Assignment, Lecture, Course, Role } from '@prisma/client';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

// Define more specific types for our data
type UpcomingLecture = Lecture & { course: Pick<Course, 'code' | 'name'> };
type DueAssignment = Assignment;
interface AttendanceRecord {
  status: boolean;
}

const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
    <div className={`h-6 w-1/2 bg-gray-200 rounded mb-6`}></div>
    <div className="space-y-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const UpcomingScheduleCard = ({ lectures }: { lectures: UpcomingLecture[] }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg h-full">
    <h3 className="font-bold text-lg mb-4 text-blue-700">Upcoming Classes</h3>
    <ul className="space-y-4">
      {lectures.length > 0 ? lectures.map(lecture => (
        <li key={lecture.id}>
          <p className="font-semibold text-gray-800">{lecture.course.code}: {lecture.course.name}</p>
          <p className="text-sm text-gray-500">
            {new Date(lecture.dateTime).toLocaleDateString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
          </p>
        </li>
      )) : <p className="text-sm text-gray-500 pt-4">No upcoming classes. Enjoy the break!</p>}
    </ul>
  </div>
);

const DueAssignmentsCard = ({ assignments }: { assignments: DueAssignment[] }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full">
        <h3 className="font-bold text-lg mb-4 text-yellow-800">Assignments Due Soon</h3>
        <ul className="space-y-4">
        {assignments.length > 0 ? assignments.map(assignment => (
          <li key={assignment.id} className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-800">{assignment.title}</p>
              <p className="text-sm text-gray-500">{assignment.description}</p>
            </div>
            <span className="text-sm font-medium text-yellow-600 shrink-0 ml-4">
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </span>
          </li>
        )) : <p className="text-sm text-gray-500 pt-4">No assignments due soon. Great job!</p>}
        </ul>
    </div>
);

const AttendanceSummaryCard = ({ attendance }: { attendance: AttendanceRecord[] }) => {
    const total = attendance.length;
    const present = attendance.filter(record => record.status).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col items-center justify-center">
        <h3 className="font-bold text-lg mb-4 text-green-700">Overall Attendance</h3>
        <div style={{ width: 120, height: 120 }}>
          <CircularProgressbar
            value={percentage}
            text={`${percentage}%`}
            styles={buildStyles({
              textColor: '#15803d',
              pathColor: '#22c55e',
              trailColor: '#d1fae5',
            })}
          />
        </div>
      </div>
    );
};

export default function DashboardPage() {
  const [lectures, setLectures] = useState<UpcomingLecture[]>([]);
  const [assignments, setAssignments] = useState<DueAssignment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch('/api/session');
        const sessionData = await sessionRes.json();
        const role = sessionData.session?.role;
        setUserRole(role);

        const apiCalls = [
          fetch('/api/hub/dashboard/upcoming-lectures'),
          fetch('/api/hub/dashboard/due-assignments'),
        ];
        
        if (role === Role.STUDENT) {
            apiCalls.push(fetch('/api/hub/attendance'));
        }

        const [lecturesRes, assignmentsRes, attendanceRes] = await Promise.all(apiCalls);
       
        const lecturesData = await lecturesRes.json();
        const assignmentsData = await assignmentsRes.json();
        setLectures(lecturesData.lectures || []);
        setAssignments(assignmentsData.assignments || []);
        
        if (attendanceRes) {
            const attendanceData = await attendanceRes.json();
            setAttendance(attendanceData.attendance || []);
        }

      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } };
  const isStudent = userRole === Role.STUDENT;

  return (
    <motion.div
      className="max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-6 text-gray-900">
        Your Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            {isStudent && <CardSkeleton />}
          </>
        ) : (
          <>
            <motion.div variants={itemVariants} className="xl:col-span-1">
              <UpcomingScheduleCard lectures={lectures} />
            </motion.div>
            <motion.div variants={itemVariants} className="xl:col-span-1">
              <DueAssignmentsCard assignments={assignments} />
            </motion.div>
            {isStudent && (
              <motion.div variants={itemVariants} className="lg:col-span-2 xl:col-span-1">
                <AttendanceSummaryCard attendance={attendance} />
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// src/app/hub/components/AddLectureForm.tsx

"use client";

import React, { useState } from 'react';
import { CourseWithFaculty } from '@/app/api/hub/courses/route';
import { motion } from 'framer-motion';

interface AddLectureFormProps {
  courses: CourseWithFaculty[];
  day: string;
  onAddLecture: (newLectureData: { courseId: number; dateTime: string; duration: number; location?: string }) => Promise<void>;
  onCancel: () => void;
}

export const AddLectureForm: React.FC<AddLectureFormProps> = ({ courses, day, onAddLecture, onCancel }) => {
  const [courseId, setCourseId] = useState<string>(courses[0]?.id.toString() || '');
  const [time, setTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<string>('60');
  const [location, setLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note: This is a simplified way to get the date. This will need to be made more robust
  // if your schedule spans more than the current week.
  const getNextDateForDay = (dayName: string) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const dayMap: { [key: string]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const targetDay = dayMap[dayName];
    const dayDifference = targetDay - currentDay;
    now.setDate(now.getDate() + dayDifference + (dayDifference < 0 ? 7 : 0));
    return now;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const lectureDate = getNextDateForDay(day);
    const [hours, minutes] = time.split(':');
    lectureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const payload = {
      courseId: parseInt(courseId),
      dateTime: lectureDate.toISOString(),
      duration: parseInt(duration),
      location: location,
    };

    try {
      await onAddLecture(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add lecture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gray-50 p-4 rounded-lg mt-4 border border-gray-200"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="font-semibold text-gray-700">Add Lecture for {day}</h4>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-600">Course</label>
          <select
            id="course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            required
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-600">Time</label>
            <input
              type="time"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-600">Duration (mins)</label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
              required
              min="1"
            />
          </div>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-600">Room / Location</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="e.g., Room 301"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md disabled:bg-blue-400"
          >
            {isSubmitting ? 'Adding...' : 'Add Lecture'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
// src/app/hub/components/AddAssignmentForm.tsx

"use client";

import React, { useState } from 'react';
import { CourseWithFaculty } from '@/app/api/hub/courses/route';
import { motion } from 'framer-motion';

interface AddAssignmentFormProps {
  courses: CourseWithFaculty[];
  onAddAssignment: (newAssignmentData: { title: string; description: string; dueDate: string; courseId: number }) => Promise<void>;
  onCancel: () => void;
}

export const AddAssignmentForm: React.FC<AddAssignmentFormProps> = ({ courses, onAddAssignment, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [courseId, setCourseId] = useState<string>(courses[0]?.id.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      title,
      description,
      dueDate: new Date(dueDate).toISOString(),
      courseId: parseInt(courseId),
    };

    try {
      await onAddAssignment(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gray-50 p-4 rounded-lg mt-4 mb-6 border border-gray-200"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="font-semibold text-gray-700">Create New Assignment</h4>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-600">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
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
        <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-600">Due Date</label>
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
              required
            />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-600">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            rows={3}
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
            {isSubmitting ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// src/app/hub/components/AddEventModal.tsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader } from 'lucide-react';
import { EventType } from '@prisma/client';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdd: () => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onEventAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('EVENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/hub/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, date, type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event.');
      }
      onEventAdd();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-xl shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Add Calendar Event</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-600">Title</label>
                  <input
                    type="text" id="title" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md" required
                  />
                </div>
                 <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-600">Date</label>
                  <input
                    type="datetime-local" id="date" value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md" required
                  />
                </div>
                 <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-600">Event Type</label>
                  <select
                    id="type" value={type}
                    onChange={(e) => setType(e.target.value as EventType)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="EVENT">Event</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="EXAM">Exam</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-600">Description</label>
                  <textarea
                    id="description" value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md" rows={3}
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : 'Add Event'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

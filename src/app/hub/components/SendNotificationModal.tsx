"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader } from 'lucide-react';
import { Role } from '@prisma/client';

interface Department {
  id: number;
  name: string;
}

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientRole, setRecipientRole] = useState<Role | 'ALL'>('ALL');
  const [departmentId, setDepartmentId] = useState<string>('ALL');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Fetch departments to populate the dropdown
    const fetchDepartments = async () => {
      const res = await fetch('/api/hub/admin/overview'); // Re-use existing endpoint to get departments
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
      }
    };
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: { title: string; message: string; recipientRole?: Role; departmentId?: number } = { title, message };
      if (recipientRole !== 'ALL') {
        payload.recipientRole = recipientRole;
      }
      if (departmentId !== 'ALL') {
        payload.departmentId = parseInt(departmentId);
      }

      const res = await fetch('/api/hub/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send notification.');
      }
      
      setSuccess('Notification sent successfully!');
      setTitle('');
      setMessage('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);

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
              <h3 className="text-xl font-bold text-gray-800">Send Notification</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
                {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</p>}
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-600">Title</label>
                  <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="recipientRole" className="block text-sm font-medium text-gray-600">Recipient Role</label>
                        <select id="recipientRole" value={recipientRole} onChange={(e) => setRecipientRole(e.target.value as Role | 'ALL')}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                            <option value="ALL">All Roles</option>
                            <option value={Role.STUDENT}>Students</option>
                            <option value={Role.PROFESSOR}>Professors</option>
                            <option value={Role.HOD}>HODs</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="departmentId" className="block text-sm font-medium text-gray-600">Department</label>
                        <select id="departmentId" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                            <option value="ALL">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-600">Message</label>
                  <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md" rows={4} required />
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end">
                <button type="submit" disabled={isSubmitting}
                  className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                  {isSubmitting ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                  {isSubmitting ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
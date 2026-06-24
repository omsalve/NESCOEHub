// src/app/hub/components/SubmissionModal.tsx

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, File, Loader } from 'lucide-react';
import { AssignmentWithDetails } from '@/app/api/hub/assignments/route';

interface SubmissionModalProps {
  assignment: AssignmentWithDetails | null;
  onClose: () => void;
  onSubmissionSuccess: (assignmentId: number) => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ assignment, onClose, onSubmissionSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !assignment) return;

    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Get a signed URL from our server
      const signedUrlRes = await fetch(`/api/hub/assignments/${assignment.id}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });

      if (!signedUrlRes.ok) {
        throw new Error('Could not get an upload URL.');
      }

      const { uploadUrl, fileUrl } = await signedUrlRes.json();

      // Step 2: Upload the file directly to Supabase Storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) {
        throw new Error('File upload failed.');
      }

      // Step 3: Create the submission record in our database
      const submissionRes = await fetch('/api/hub/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          fileUrl: fileUrl,
        }),
      });

      if (!submissionRes.ok) {
        throw new Error('Failed to record the submission.');
      }
      
      onSubmissionSuccess(assignment.id);
      onClose();

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {assignment && (
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
              <h3 className="text-xl font-bold text-gray-800">Submit Assignment</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <p className="font-semibold">{assignment.title}</p>
                <p className="text-sm text-gray-500 mb-4">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                
                <div className="mt-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                    </p>
                  </label>
                </div>
                
                {file && (
                  <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center space-x-2">
                      <File className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                    </div>
                    <button type="button" onClick={() => setFile(null)} disabled={isUploading}>
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
                
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end">
                <button
                  type="submit"
                  disabled={!file || isUploading}
                  className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  {isUploading ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
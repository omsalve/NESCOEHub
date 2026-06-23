// src/app/hub/components/header.tsx

"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; // 1. Import the router
import Image from 'next/image';
import { Bell, UserCircle, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header = ({ 
  userName, 
  toggleSidebar 
}: { 
  userName: string;
  toggleSidebar: () => void; 
}) => {
  const router = useRouter(); // 2. Initialize the router

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    
    // 3. Use the router to push to the login page
    router.push('/auth/login');
    router.refresh(); // This ensures the server state is cleared
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
      <button 
        onClick={toggleSidebar} 
        className="md:hidden text-gray-600 hover:text-blue-600"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="hidden md:flex items-center space-x-3">
        <h2 className="text-black text-lg font-semibold">Welcome back, {userName}!</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="text-gray-600 hover:text-blue-600">
          <Bell className="h-6 w-6" />
        </button>
        <motion.button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-600 hover:text-red-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Logout
        </motion.button>
        <UserCircle className="h-8 w-8 text-gray-500" />
      </div>
    </header>
  );
}
"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/sidebar';
import { Header } from './components/header';
import { Role } from '@prisma/client';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState<Role | null>(null);


  useEffect(() => {
    // Fetch the user's name to display in the header
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            setUserName(data.session.name);
            setUserRole(data.session.role);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session for layout', error);
      }
    };
    fetchSession();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} userRole={userRole} />
      <div className="flex flex-col flex-1 overflow-y-auto">
        <Header userName={userName} toggleSidebar={toggleSidebar} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

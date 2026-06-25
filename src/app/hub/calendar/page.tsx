"use client";

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { Role } from '@prisma/client';
import { AddEventModal } from '../components/AddEventModal';

// FullCalendar styles are included in the components


export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hub/calendar/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.session?.role);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      }
    };
    
    fetchSession();
    fetchEvents();
  }, []);
  
  const isProfessorOrHod = userRole === Role.PROFESSOR || userRole === Role.HOD;

  return (
    <>
      <AddEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEventAdd={fetchEvents} // Refetch events after adding a new one
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Academic Calendar
          </h1>
          {isProfessorOrHod && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Event
            </button>
          )}
        </div>
        
        {isLoading && <p>Loading calendar...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        
        {!isLoading && !error && (
           <div className="bg-white p-4 rounded-lg shadow-lg">
             <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                height="auto"
                editable={false}
                selectable={true}
              />
           </div>
        )}
      </motion.div>
    </>
  );
}


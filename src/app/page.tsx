"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn, User, GraduationCap, CheckCircle, Calendar, BookOpen } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

// Animation variants for Framer Motion
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Sub-component for Feature Cards for better organization
const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string; }) => (
  <motion.div variants={itemVariants} className="p-8 bg-white rounded-xl shadow-lg flex flex-col items-center text-center">
    <div className={`inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full ${color}`}>
      {icon}
    </div>
    <h4 className="text-xl font-semibold mb-2 text-gray-800">{title}</h4>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

// Main Landing Page Component
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="container mx-auto flex justify-between items-center h-16 px-6">
          <div className="flex items-center space-x-3">
            <Image 
              src="/images/NESCOEmulti2grad-removebg-preview.png" 
              alt="NESCOE Logo" 
              width={40} 
              height={40} 
              className="rounded-lg w-8 h-8 sm:w-10 sm:h-10"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-blue-700">NESCOE Hub</h1>
          </div>
          <nav>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Link>
          </nav>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-white py-16 md:py-24">
          <motion.div
            className="container mx-auto text-center px-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex items-center justify-center mb-6">
              <Image 
                src="/images/NESCOEmulti2grad-removebg-preview.png" 
                alt="NESCOE Logo" 
                width={400} 
                height={400} 
                className="rounded-xl w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64"
              />
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Your Campus, <span className="text-blue-700">Connected.</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
              The official hub for NESCOE students and faculty. Access your schedule, assignments, and campus updates all in one place.
            </motion.p>
            
            <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/auth/login/"
                  className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-transform w-full sm:w-auto"
                >
                  <User className="w-5 h-5 mr-2" />
                  Student Portal
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/auth/login/"
                  className="inline-flex items-center justify-center px-8 py-3 font-semibold text-gray-800 bg-gray-100 rounded-lg shadow-lg hover:bg-gray-200 transition-transform w-full sm:w-auto"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Faculty Portal
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <motion.section
          className="py-24 bg-gray-50/70"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <div className="container mx-auto px-6">
            <motion.div variants={itemVariants} className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Everything You Need to Succeed</h3>
              <p className="mt-3 text-lg text-gray-600 max-w-xl mx-auto">Core features designed to streamline your campus life.</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Calendar className="w-8 h-8 text-blue-600" />}
                title="Personalized Schedule"
                description="Never miss a class with a clear, up-to-date view of your daily schedule and upcoming events."
                color="bg-blue-100"
              />
              <FeatureCard 
                icon={<BookOpen className="w-8 h-8 text-yellow-800" />}
                title="Assignment Tracking"
                description="Stay on top of deadlines with assignment due dates, submission details, and grade notifications."
                color="bg-yellow-100"
              />
              <FeatureCard 
                icon={<CheckCircle className="w-8 h-8 text-green-600" />}
                title="Attendance Records"
                description="Keep a real-time track of your attendance for all courses throughout the semester."
                color="bg-green-100"
              />
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto text-center px-6">
          <p>&copy; {new Date().getFullYear()} NESCOE Hub. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

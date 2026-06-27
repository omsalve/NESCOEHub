# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NCOE (NESCOE Hub) is a Next.js 15 web application for managing academic activities at NESCOE (college/university). It's a full-stack TypeScript application with role-based authentication supporting students, professors, HODs, and principals.

## Development Commands

### Core Development
- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm run start`
- **Lint code**: `npm run lint`

### Database Operations (Prisma)
- **Generate Prisma client**: `npx prisma generate`
- **View database in Prisma Studio**: `npx prisma studio`
- **Apply database migrations**: `npx prisma migrate dev`
- **Reset database (development)**: `npx prisma migrate reset`
- **Seed database**: `npx prisma db seed` (or `tsx src/prisma/seed.ts`)
- **Deploy migrations (production)**: `npx prisma migrate deploy`

### Type Checking
- **Check TypeScript**: `npx tsc --noEmit`

## Tech Stack Architecture

### Core Framework & Database
- **Next.js 15** with App Router (React 19)
- **TypeScript** with strict configuration
- **Prisma ORM** with PostgreSQL database
- **Tailwind CSS 4** for styling
- **Framer Motion** for animations

### Key Libraries
- **Authentication**: Custom JWT implementation using `jose` library
- **UI Components**: Lucide React icons, custom components
- **Calendar**: FullCalendar for scheduling
- **Database Client**: Supabase (likely for hosting PostgreSQL)

## Architecture & Patterns

### Authentication & Authorization
- JWT-based session management with HTTP-only cookies
- Session middleware (`src/middleware.ts`) handles route protection
- Role-based access control: STUDENT, PROFESSOR, HOD, PRINCIPAL
- Session utilities in `src/lib/session.ts` for server-side verification

### Database Schema (Prisma)
Key entities with their relationships:
- **User** → linked to Student or Faculty profiles
- **Department** → contains users, courses, lectures, assignments
- **Course** → belongs to department, has faculty, lectures, assignments
- **Lecture** → linked to course, faculty, has attendance records
- **Assignment** → linked to course, faculty, has submissions
- **Attendance** → tracks student presence in lectures
- **Event** → department-level calendar events

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── hub/               # Protected application pages
│   │   ├── components/    # Shared hub components
│   │   ├── dashboard/     # Dashboard page
│   │   ├── courses/       # Course management
│   │   ├── assignments/   # Assignment management
│   │   ├── attendance/    # Attendance tracking
│   │   ├── calendar/      # Academic calendar
│   │   └── schedule/      # Class schedules
│   └── layout.tsx         # Root layout
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client configuration
│   └── session.ts        # Session management utilities
└── prisma/               # Database configuration
    ├── schema.prisma     # Database schema
    ├── migrations/       # Database migrations
    └── seed.ts          # Database seeding script
```

### Component Patterns
- **Client Components**: Use `"use client"` directive for interactive components
- **Server Components**: Default for data fetching and static content
- **Layout Components**: Nested layouts with `hub/layout.tsx` for authenticated pages
- **Animation**: Framer Motion variants for consistent animations
- **Forms**: Controlled components with error handling and loading states
- **Logo Integration**: NESCOE logo (`/images/COElogo.png`) used consistently across header, sidebar, login, and landing pages

### API Design
- RESTful API routes in `src/app/api/`
- Session validation using middleware
- JSON responses with proper HTTP status codes
- Error handling with try-catch patterns

### Development Patterns
- **Path Aliases**: `@/*` maps to `src/*` directory
- **TypeScript Configuration**: Strict mode enabled, ES2017 target
- **ESLint**: Next.js recommended configuration with TypeScript support
- **Database Singleton**: Prisma client configured to prevent multiple instances

## Environment Setup

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `NODE_ENV`: Environment (development/production)

## Database Development

### Schema Changes
1. Modify `src/prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name describe_change`
3. Apply changes: `npx prisma generate`

### Seeding
The seed script (`src/prisma/seed.ts`) creates test users:
- Student: `student@test.com` (password: `password123`)
- Professor: `professor@test.com` (password: `password123`)

### Common Prisma Patterns
- Use `include` for relations when querying
- Implement `upsert` for seed data to handle re-runs
- Use `@@unique` constraints for composite keys (e.g., student-lecture attendance)

## Common Development Tasks

### Adding New Pages
1. Create page component in appropriate `src/app/hub/` directory
2. Add navigation link in `src/app/hub/components/sidebar.tsx`
3. Ensure proper authentication middleware coverage

### Database Operations
- Always use the singleton Prisma client from `src/lib/prisma.ts`
- Handle database errors with proper try-catch blocks
- Use transactions for operations affecting multiple tables

### Session Management
- Server-side session validation: Use `getSession()` from `src/lib/session.ts`
- Client-side session check: Fetch from `/api/session` endpoint
- Redirect patterns handled by `src/middleware.ts`

## Testing & Quality

### Code Quality
- ESLint configuration enforces Next.js and TypeScript best practices
- TypeScript strict mode catches common errors
- Prisma generates type-safe database client

### Development Workflow
1. Database changes require migration and client regeneration
2. Component changes in `hub/` directory require authentication
3. API routes should validate sessions and handle errors consistently

## Deployment

### Vercel Deployment
- **Build Command**: `npm run build`
- **Framework Preset**: Next.js
- **Node.js Version**: 18.x or higher

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (production database)
- `JWT_SECRET`: Secret key for JWT token signing (generate strong random value)
- `NODE_ENV`: Set to `production`

### Pre-deployment Checklist
1. Run `npm run build` locally to ensure successful compilation
2. Run `npm run lint` to check for linting issues
3. Verify all environment variables are set in deployment platform
4. Ensure production database is set up and accessible
5. Run database migrations in production: `npx prisma migrate deploy`

### Common Deployment Issues
- **TypeScript Errors**: Ensure all `any` types are replaced with proper types
- **Dynamic Route Parameters**: Use `Promise<{ param: string }>` for dynamic routes in Next.js 15
- **Empty API Routes**: All API route files must export at least one HTTP method
- **Database Connection**: Verify DATABASE_URL format and accessibility
- **Missing Dependencies**: Run `npm install` if build fails due to missing packages

### Post-deployment
1. Seed the database if needed: `npx prisma db seed`
2. Test authentication flow with test users
3. Verify all major features work in production environment

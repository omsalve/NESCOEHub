// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// This helps prevent TypeScript errors in a global context
declare global {
  // Using var here is intentional for global declaration
  var prisma: PrismaClient | undefined;
}

// This pattern prevents creating multiple instances of PrismaClient in development
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query'], // This will log database queries to your terminal, which is great for debugging
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (tursoUrl && tursoToken) {
  // Use Turso driver adapter for serverless environments
  const adapter = new PrismaLibSql({
    url: tursoUrl,
    authToken: tursoToken,
  });
  prismaInstance = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  });
} else {
  // Fallback to standard Prisma client connection (e.g., local SQLite database)
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  });
}

export const prisma = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

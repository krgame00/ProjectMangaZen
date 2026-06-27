import { prisma } from './lib/prisma';
import "dotenv/config";

async function run() {
  console.log("TURSO_DB:", process.env.TURSO_DATABASE_URL ? "SET" : "UNSET");
  const res = await prisma.manga.findMany({ select: { id: true, title: true, coverUrl: true } });
  const uploads = res.filter(m => m.coverUrl?.startsWith('/uploads/'));
  console.log('Total mangas:', res.length, 'Covers with uploads:', uploads.length);
}

run().finally(() => prisma.$disconnect());

const fs = require('fs');
const { createClient } = require('@libsql/client');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL.split('?')[0];
const authToken = process.env.TURSO_AUTH_TOKEN;

const libsql = createClient({
  url,
  authToken,
});

// Local Prisma Client
const localPrisma = new PrismaClient({
  datasourceUrl: 'file:./dev.db',
});

// Turso Prisma Client
const adapter = new PrismaLibSql({
  url,
  authToken,
});
const tursoPrisma = new PrismaClient({ adapter });

async function main() {
  console.log("Applying schema to Turso...");
  const rawSql = fs.readFileSync('migration.sql', 'utf-8');
  const sql = rawSql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');
  try {
    const libsql = createClient({ url, authToken });
    await libsql.executeMultiple(sql);
    console.log("Schema applied successfully.");
  } catch (e) {
    console.log("Schema might already be applied or error occurred:", e.message);
  }

  console.log("Fetching local data...");
  const users = await localPrisma.user.findMany();
  const mangas = await localPrisma.manga.findMany();
  const chapters = await localPrisma.chapter.findMany();
  const accounts = await localPrisma.account.findMany();
  const favorites = await localPrisma.favorite.findMany();

  console.log(`Migrating ${users.length} Users...`);
  for (const u of users) {
    await tursoPrisma.user.upsert({
      where: { id: u.id },
      create: u,
      update: u,
    });
  }

  console.log(`Migrating ${accounts.length} Accounts...`);
  for (const a of accounts) {
    await tursoPrisma.account.upsert({
      where: { provider_providerAccountId: { provider: a.provider, providerAccountId: a.providerAccountId } },
      create: a,
      update: a,
    });
  }

  console.log(`Migrating ${mangas.length} Mangas...`);
  for (const m of mangas) {
    await tursoPrisma.manga.upsert({
      where: { id: m.id },
      create: m,
      update: m,
    });
  }

  console.log(`Migrating ${chapters.length} Chapters...`);
  for (const c of chapters) {
    await tursoPrisma.chapter.upsert({
      where: { id: c.id },
      create: c,
      update: c,
    });
  }
  
  console.log(`Migrating ${favorites.length} Favorites...`);
  for (const f of favorites) {
    await tursoPrisma.favorite.upsert({
      where: { userId_mangaId: { userId: f.userId, mangaId: f.mangaId } },
      create: f,
      update: f,
    });
  }

  console.log("Migration Complete! 🎉");
}

main().catch(console.error).finally(() => {
    localPrisma.$disconnect();
    tursoPrisma.$disconnect();
});

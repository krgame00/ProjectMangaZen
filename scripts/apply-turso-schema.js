const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('Applying schema changes to Turso...');
  
  try {
    // 1. Add pageCount to Chapter
    await client.execute('ALTER TABLE "Chapter" ADD COLUMN "pageCount" INTEGER NOT NULL DEFAULT 0;');
    console.log('Added pageCount to Chapter');
  } catch (e) {
    console.log('pageCount may already exist:', e.message);
  }

  const indexes = [
    'CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");',
    'CREATE INDEX IF NOT EXISTS "Manga_createdAt_idx" ON "Manga"("createdAt");',
    'CREATE INDEX IF NOT EXISTS "Manga_genre_createdAt_idx" ON "Manga"("genre", "createdAt");',
    'CREATE INDEX IF NOT EXISTS "Chapter_mangaId_idx" ON "Chapter"("mangaId");',
    'CREATE INDEX IF NOT EXISTS "Chapter_mangaId_createdAt_idx" ON "Chapter"("mangaId", "createdAt");',
    'CREATE INDEX IF NOT EXISTS "Favorite_userId_idx" ON "Favorite"("userId");',
    'CREATE INDEX IF NOT EXISTS "Favorite_mangaId_idx" ON "Favorite"("mangaId");'
  ];

  for (const sql of indexes) {
    try {
      await client.execute(sql);
      console.log(`Executed: ${sql}`);
    } catch (e) {
      console.error(`Failed: ${sql}`, e.message);
    }
  }

  console.log('Schema changes applied successfully.');
}

main();

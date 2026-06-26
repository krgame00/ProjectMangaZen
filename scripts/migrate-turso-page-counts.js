const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('Migrating pageCount in Turso...');
  
  const rs = await client.execute('SELECT "id", "pages", "pageCount" FROM "Chapter";');
  const chapters = rs.rows;
  console.log(`Found ${chapters.length} chapters.`);

  let updatedCount = 0;
  for (const chapter of chapters) {
    if (chapter.pageCount > 0) continue;

    let count = 0;
    try {
      const parsed = JSON.parse(chapter.pages);
      if (Array.isArray(parsed)) {
        count = parsed.length;
      }
    } catch (e) {
      console.error(`Failed to parse pages for chapter ${chapter.id}`);
    }

    if (count > 0) {
      await client.execute({
        sql: 'UPDATE "Chapter" SET "pageCount" = ? WHERE "id" = ?',
        args: [count, chapter.id]
      });
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} chapters in Turso.`);
}

main();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkPagesFormat() {
  const chapters = await prisma.chapter.findMany();
  const formatSamples = new Set();
  
  for (const chapter of chapters) {
    try {
      const pages = JSON.parse(chapter.pages);
      for (const page of pages) {
        if (typeof page === "string") {
          // If it's a URL, extract the origin or prefix
          if (page.startsWith("http")) {
             try {
               const url = new URL(page);
               formatSamples.add(`URL: ${url.origin}${url.pathname}`);
             } catch(e) {
               formatSamples.add(`String: ${page.substring(0, 30)}...`);
             }
          } else if (page.startsWith("/")) {
             const url = new URL("http://localhost" + page);
             formatSamples.add(`Local Path: ${url.pathname}`);
          } else {
             formatSamples.add(`String: ${page.substring(0, 30)}...`);
          }
        } else if (typeof page === "object") {
          formatSamples.add(`Object: ${JSON.stringify(page)}`);
        }
      }
    } catch (e) {
      console.log(`Failed to parse chapter ${chapter.id}: ${chapter.pages}`);
    }
  }

  console.log("Found formats:");
  for (const format of formatSamples) {
    console.log("-", format);
  }
}

checkPagesFormat()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findBrokenImageUrls() {
  const chapters = await prisma.chapter.findMany();
  let brokenCount = 0;

  for (const chapter of chapters) {
    try {
      const pages = JSON.parse(chapter.pages);
      let isBroken = false;
      const newPages = pages.map(page => {
        if (typeof page === "string" && page.includes("drive.google.com/uc?id=")) {
           isBroken = true;
           const url = new URL(page);
           const id = url.searchParams.get("id");
           return `/api/proxy/drive?id=${id}`;
        }
        return page;
      });

      if (isBroken) {
        brokenCount++;
        // console.log("Found broken in chapter", chapter.title);
      }
    } catch (e) {}
  }
  
  console.log(`Found ${brokenCount} chapters with broken drive.google.com/uc URLs`);
}

findBrokenImageUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

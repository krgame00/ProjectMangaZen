import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";

async function testProxy() {
  const prisma = new PrismaClient();
  
  const chapters = await prisma.chapter.findMany();
  let testId = null;
  for (const chapter of chapters) {
    try {
      const pages = JSON.parse(chapter.pages);
      for (const page of pages) {
        if (typeof page === "string" && page.includes("/api/proxy/drive?id=")) {
          const url = new URL("http://localhost:3000" + page);
          testId = url.searchParams.get("id");
          break;
        }
      }
      if (testId) break;
    } catch(e){}
  }

  if (!testId) {
    console.log("No image id found in DB.");
    return;
  }

  console.log("Testing ID:", testId);
  const url = `http://localhost:3000/api/proxy/drive?id=${testId}`;
  const res = await fetch(url);
  console.log("Headers:");
  res.headers.forEach((value, key) => console.log(`  ${key}: ${value}`));
  
  if (!res.ok) {
    console.log("Error:", await res.text());
  }
}

testProxy();

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.TURSO_DATABASE_URL,
  });

  try {
    const users = await prisma.user.findMany();
    console.log("Found users:", users.length);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

test();

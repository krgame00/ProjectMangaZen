const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.chapter.findMany({where: {pages: {contains: 'zip'}}}).then(c => console.log(JSON.stringify(c, null, 2))).finally(() => prisma.$disconnect());

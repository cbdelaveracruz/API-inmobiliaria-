import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ex = await prisma.expediente.findUnique({
    where: { id: 76 },
    include: { mandato: true }
  });
  console.log(JSON.stringify(ex, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

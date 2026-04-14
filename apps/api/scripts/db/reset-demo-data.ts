import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

type PublicTableRow = {
  tablename: string;
};

function resolveUploadDir() {
  return resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');
}

async function listBusinessTables(prisma: PrismaClient) {
  return prisma.$queryRaw<PublicTableRow[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename ASC
  `;
}

export async function resetDemoData(prisma: PrismaClient) {
  const tables = await listBusinessTables(prisma);
  const qualifiedTables = tables.map(
    ({ tablename }) => `"public"."${tablename}"`,
  );

  if (qualifiedTables.length > 0) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${qualifiedTables.join(', ')} RESTART IDENTITY CASCADE;`,
    );
  }

  const uploadDir = resolveUploadDir();
  await rm(uploadDir, { recursive: true, force: true });
  await mkdir(uploadDir, { recursive: true });

  return {
    clearedTablesCount: qualifiedTables.length,
    uploadDir,
  };
}

export async function runResetDemoData() {
  const prisma = new PrismaClient();

  try {
    console.log('Resetting business data without dropping the schema...');
    const result = await resetDemoData(prisma);
    console.log(
      `Reset completed (${result.clearedTablesCount} tables truncated, uploads cleaned in ${result.uploadDir})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

const isMainModule =
  typeof process.argv[1] === 'string' &&
  process.argv[1].includes('reset-demo-data');

if (isMainModule) {
  runResetDemoData().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..', '..');
const isVercel = process.env.VERCEL === '1' || process.env.CI === 'true';

console.log('[materialize] Starting materialization from:', appRoot);
console.log('[materialize] Environment:', isVercel ? 'CI/Vercel (forcing copy)' : 'Local (skip if symlinked)');

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function replaceWithRealDirectory(sourcePath, destinationPath) {
  console.log('[materialize] Checking source:', sourcePath);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path not found: ${sourcePath}`);
  }

  const sourceRealPath = fs.realpathSync(sourcePath);
  console.log('[materialize] Real source path:', sourceRealPath);

  if (fs.existsSync(destinationPath) && !isVercel) {
    try {
      const destinationRealPath = fs.realpathSync(destinationPath);
      if (sourceRealPath === destinationRealPath) {
        console.log('[materialize] Destination already points to source, skipping (local mode)');
        return;
      }
    } catch {
      // Continue with replacement when the destination cannot be resolved.
    }
  }

  console.log('[materialize] Copying to:', destinationPath);
  fs.rmSync(destinationPath, { recursive: true, force: true });
  ensureDirectory(path.dirname(destinationPath));
  fs.cpSync(sourceRealPath, destinationPath, {
    recursive: true,
    force: true,
    dereference: true,
  });
  console.log('[materialize] ✓ Copied successfully');
}

function materializePrismaClient() {
  console.log('\n[materialize] === Materializing Prisma Client Package ===');
  try {
    // Only materialize the @prisma/client package
    // The generated client is already in apps/api/node_modules/.prisma/client thanks to schema.prisma output
    const prismaClientPackagePath = fs.realpathSync(
      path.dirname(
        require.resolve('@prisma/client/package.json', { paths: [appRoot] }),
      ),
    );

    replaceWithRealDirectory(
      prismaClientPackagePath,
      path.join(appRoot, 'node_modules', '@prisma', 'client'),
    );

    // Verify that generated client exists
    const generatedClientPath = path.join(appRoot, 'node_modules', '.prisma', 'client');
    if (!fs.existsSync(path.join(generatedClientPath, 'index.js'))) {
      console.warn('[materialize] ⚠ Generated Prisma client not found at:', generatedClientPath);
      console.warn('[materialize] ⚠ Make sure "prisma generate" was executed before this script');
    } else {
      console.log('[materialize] ✓ Generated Prisma client found at:', generatedClientPath);
    }

    console.log('[materialize] ✓ Prisma Client package materialized');
  } catch (error) {
    console.error('[materialize] ✗ Failed to materialize Prisma Client:', error.message);
    throw error;
  }
}

function materializeLegalPackage() {
  console.log('\n[materialize] === Materializing @axelys/legal ===');
  try {
    const legalPackagePath = path.dirname(
      path.dirname(
        fs.realpathSync(
        require.resolve('@axelys/legal', { paths: [appRoot] }),
        ),
      ),
    );

    replaceWithRealDirectory(
      legalPackagePath,
      path.join(appRoot, 'node_modules', '@axelys', 'legal'),
    );
    console.log('[materialize] ✓ @axelys/legal materialized');
  } catch (error) {
    console.error('[materialize] ✗ Failed to materialize @axelys/legal:', error.message);
    throw error;
  }
}

function main() {
  try {
    materializePrismaClient();
    materializeLegalPackage();
    console.log('\n[materialize] ✓✓✓ All dependencies materialized successfully\n');
  } catch (error) {
    console.error('\n[materialize] ✗✗✗ Materialization failed:', error.message);
    process.exit(1);
  }
}

main();

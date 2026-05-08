const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..', '..');

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function replaceWithRealDirectory(sourcePath, destinationPath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path not found: ${sourcePath}`);
  }

  const sourceRealPath = fs.realpathSync(sourcePath);
  if (fs.existsSync(destinationPath)) {
    try {
      const destinationRealPath = fs.realpathSync(destinationPath);
      if (sourceRealPath === destinationRealPath) {
        return;
      }
    } catch {
      // Continue with replacement when the destination cannot be resolved.
    }
  }

  fs.rmSync(destinationPath, { recursive: true, force: true });
  ensureDirectory(path.dirname(destinationPath));
  fs.cpSync(sourceRealPath, destinationPath, {
    recursive: true,
    force: true,
    dereference: true,
  });
}

function materializePrismaClient() {
  const prismaClientPackagePath = fs.realpathSync(
    path.dirname(
      require.resolve('@prisma/client/package.json', { paths: [appRoot] }),
    ),
  );
  const prismaGeneratedClientPath = path.resolve(
    prismaClientPackagePath,
    '../../.prisma/client',
  );

  replaceWithRealDirectory(
    prismaClientPackagePath,
    path.join(appRoot, 'node_modules', '@prisma', 'client'),
  );
  replaceWithRealDirectory(
    prismaGeneratedClientPath,
    path.join(appRoot, 'node_modules', '.prisma', 'client'),
  );
}

function materializeLegalPackage() {
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
}

function main() {
  materializePrismaClient();
  materializeLegalPackage();
}

main();

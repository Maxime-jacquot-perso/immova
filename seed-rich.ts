import { runDemoSeedCommand } from './apps/api/scripts/db/demo-seed';

runDemoSeedCommand().catch((error) => {
  console.error(error);
  process.exit(1);
});

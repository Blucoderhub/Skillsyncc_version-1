import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Vercel Edge Function compatible entry point
import('../dist/index.cjs').catch((err) => {
  console.error('Failed to load server:', err);
  process.exit(1);
});
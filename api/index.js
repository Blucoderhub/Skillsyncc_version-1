import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use the bundled server for better reliability on Vercel
let app;

export default async (req, res) => {
  if (!app) {
    // Import the pre-bundled server code
    const serverModule = await import('../dist/index.cjs');
    // Call setupApp from the bundled module
    app = await serverModule.setupApp();
  }
  return app(req, res);
};
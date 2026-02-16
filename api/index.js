import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use the bundled server for better reliability on Vercel
let app;

export default async (req, res) => {
  console.log(`[bridge] Handling request: ${req.method} ${req.url}`);

  if (!app) {
    try {
      console.log(`[bridge] Initializing bundled server...`);
      // Import the pre-bundled server code
      const serverModule = await import('../dist/index.cjs');
      // Call setupApp from the bundled module
      app = await serverModule.setupApp();
      console.log(`[bridge] Bundled server initialized successfully.`);
    } catch (error) {
      console.error(`[bridge] Failed to initialize bundled server:`, error);
      res.status(500).send(`Internal Server Error: Bridge initialization failed. ${error.message}`);
      return;
    }
  }

  try {
    return app(req, res);
  } catch (error) {
    console.error(`[bridge] App execution error:`, error);
    res.status(500).send(`Internal Server Error: Application execution failed. ${error.message}`);
  }
};
import { setupApp } from '../server/index.js';

let app;

export default async (req, res) => {
  if (!app) {
    app = await setupApp();
  }
  return app(req, res);
};
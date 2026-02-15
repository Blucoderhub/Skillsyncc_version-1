import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Vercel-compatible static serving
  const distPath = process.env.VERCEL 
    ? path.resolve(process.cwd(), "dist/public")
    : path.resolve(__dirname, "public");
    
  if (!fs.existsSync(distPath)) {
    console.warn(`Build directory not found: ${distPath}`);
    return;
  }

  app.use(express.static(distPath));

  // SPA fallback - serve index.html for client-side routing
  app.get("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: "Client build not found" });
    }
  });
}

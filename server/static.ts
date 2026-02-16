import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production bundle, __dirname is where index.cjs is (the dist folder)
  // Static files are in the public/ folder next to it.
  const distPath = path.resolve(__dirname, "public");

  console.log(`[static] Serving from: ${distPath}`);
  console.log(`[static] Current directory (__dirname): ${__dirname}`);
  console.log(`[static] Working directory (cwd): ${process.cwd()}`);

  if (!fs.existsSync(distPath)) {
    console.warn(`[static] Static directory not found: ${distPath}`);
    // Fallback search
    const fallbackPath = path.resolve(process.cwd(), "dist", "public");
    if (fs.existsSync(fallbackPath)) {
      console.log(`[static] Found fallback at: ${fallbackPath}`);
      return serveFromPath(app, fallbackPath);
    }
    return;
  }

  return serveFromPath(app, distPath);
}

function serveFromPath(app: Express, staticPath: string) {
  app.use(express.static(staticPath));

  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    const indexPath = path.resolve(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader("Content-Type", "text/html");
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        error: "Not Found",
        message: "The requested page could not be found.",
        path: req.path,
        checkedPath: indexPath
      });
    }
  });
}

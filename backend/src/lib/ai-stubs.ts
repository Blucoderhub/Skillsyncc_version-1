import type { Express, Request, Response } from "express";

export function registerChatRoutes(app: Express): void {
    app.get("/api/ai/models", (_req: Request, res: Response) => {
        res.json({ openai: [], anthropic: [], gemini: [] });
    });

    app.get("/api/ai/modes", (_req: Request, res: Response) => {
        res.json({});
    });

    app.get("/api/ai/greeting", (_req: Request, res: Response) => {
        res.json({ greeting: "AI features are currently unavailable in this environment." });
    });

    app.get("/api/conversations", (_req: Request, res: Response) => {
        res.json([]);
    });

    app.post("/api/conversations", (_req: Request, res: Response) => {
        res.status(503).json({ error: "AI Service Unavailable" });
    });
}

export function registerImageRoutes(app: Express): void {
    app.post("/api/ai/images/generate", (_req: Request, res: Response) => {
        res.status(503).json({ error: "AI Service Unavailable" });
    });
}

export function registerAudioRoutes(app: Express): void {
    app.post("/api/ai/audio/speech-to-text", (_req: Request, res: Response) => {
        res.status(503).json({ error: "AI Service Unavailable" });
    });

    app.post("/api/ai/audio/text-to-speech", (_req: Request, res: Response) => {
        res.status(503).json({ error: "AI Service Unavailable" });
    });
}

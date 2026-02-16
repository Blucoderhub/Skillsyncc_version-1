import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { chatStorage } from "./storage";
import { buildSystemPrompt, getGreeting, SYNCC_AI_MODES } from "./syncc-ai-prompt";
import { storage } from "../../storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const AVAILABLE_MODELS = {
  openai: [
    { id: "gpt-5", name: "GPT-5", provider: "openai" },
    { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai" },
    { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "anthropic" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic" },
  ],
  gemini: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini" },
  ],
};

async function getUserContext(req: Request) {
  const userId = (req as any).session?.userId;
  if (!userId) {
    return { userName: "Coder", userLevel: 1, userXp: 0, userStreak: 0 };
  }
  try {
    const user = await storage.getUser(userId);
    const progress = await storage.getUserProgress(userId);
    return {
      userName: user?.firstName || "Coder",
      userLevel: progress?.level || 1,
      userXp: progress?.xp || 0,
      userStreak: progress?.streak || 0,
    };
  } catch {
    return { userName: "Coder", userLevel: 1, userXp: 0, userStreak: 0 };
  }
}

export function registerChatRoutes(app: Express): void {
  app.get("/api/ai/models", (_req: Request, res: Response) => {
    res.json(AVAILABLE_MODELS);
  });

  app.get("/api/ai/modes", (_req: Request, res: Response) => {
    res.json(SYNCC_AI_MODES);
  });

  app.get("/api/ai/greeting", async (req: Request, res: Response) => {
    try {
      const mode = (req.query.mode as string) || "tutor";
      const ctx = await getUserContext(req);
      const greeting = getGreeting(ctx.userName, ctx.userLevel, ctx.userStreak, mode);
      res.json({ greeting, ...ctx });
    } catch (error) {
      console.error("Error getting AI greeting:", error);
      res.json({ greeting: "Hey! I'm Syncc AI, your coding companion. What would you like to learn today?" });
    }
  });

  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id as string);
      const { content, model = "gpt-5", provider = "openai", mode = "tutor" } = req.body;

      await chatStorage.createMessage(conversationId, "user", content);

      const messages = await chatStorage.getMessagesByConversation(conversationId);

      const ctx = await getUserContext(req);
      const systemPrompt = buildSystemPrompt({ mode, ...ctx });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";

      if (provider === "openai") {
        const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        const stream = await openai.chat.completions.create({
          model: model,
          messages: chatMessages,
          stream: true,
          max_completion_tokens: 4096,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      } else if (provider === "anthropic") {
        const chatMessages = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const stream = anthropic.messages.stream({
          model: model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: chatMessages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = event.delta.text;
            if (text) {
              fullResponse += text;
              res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
            }
          }
        }
      } else if (provider === "gemini") {
        const chatMessages = messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user" as "user" | "model",
          parts: [{ text: m.content }],
        }));

        const stream = await gemini.models.generateContentStream({
          model: model,
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Understood. I am Syncc AI, ready to help." }] },
            ...chatMessages,
          ],
        });

        for await (const chunk of stream) {
          const text = chunk.text || "";
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

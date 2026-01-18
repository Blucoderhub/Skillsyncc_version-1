import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { isAuthenticated } from "./replit_integrations/auth";

// Admin authorization middleware
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const userId = (req.user as any)?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const user = await storage.getUser(userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
}

export function registerAdminRoutes(app: Express): void {
  // Check if current user is admin
  app.get("/api/admin/check", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      res.json({ isAdmin: user?.isAdmin || false });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  // --- USER MANAGEMENT ---
  
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithProgress = await Promise.all(
        users.map(async (user) => {
          const progress = await storage.getUserProgress(user.id);
          const submissions = await storage.getAllUserSubmissions(user.id);
          return {
            ...user,
            progress,
            submissionsCount: submissions.length,
          };
        })
      );
      res.json(usersWithProgress);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/admin", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { isAdmin } = req.body;
      await storage.updateUserAdmin(id, isAdmin);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user admin status:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // --- TUTORIAL MANAGEMENT ---

  app.get("/api/admin/tutorials", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tutorials = await storage.getAllTutorials();
      res.json(tutorials);
    } catch (error) {
      console.error("Error fetching tutorials:", error);
      res.status(500).json({ error: "Failed to fetch tutorials" });
    }
  });

  app.post("/api/admin/tutorials", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tutorialSchema = z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().min(1),
        category: z.string().min(1),
        difficulty: z.string().default("Beginner"),
        imageUrl: z.string().optional(),
        order: z.number().default(0),
        xpReward: z.number().default(500),
      });
      
      const data = tutorialSchema.parse(req.body);
      const tutorial = await storage.createTutorial(data);
      res.status(201).json(tutorial);
    } catch (error) {
      console.error("Error creating tutorial:", error);
      res.status(500).json({ error: "Failed to create tutorial" });
    }
  });

  app.put("/api/admin/tutorials/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const tutorial = await storage.updateTutorial(id, req.body);
      res.json(tutorial);
    } catch (error) {
      console.error("Error updating tutorial:", error);
      res.status(500).json({ error: "Failed to update tutorial" });
    }
  });

  app.delete("/api/admin/tutorials/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteTutorial(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tutorial:", error);
      res.status(500).json({ error: "Failed to delete tutorial" });
    }
  });

  // --- LESSON MANAGEMENT ---

  app.get("/api/admin/tutorials/:tutorialId/lessons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tutorialId = parseInt(req.params.tutorialId as string);
      const lessons = await storage.getLessonsByTutorial(tutorialId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.post("/api/admin/lessons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const lessonSchema = z.object({
        tutorialId: z.number(),
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().min(1),
        codeExample: z.string().optional(),
        language: z.string().default("python"),
        order: z.number().default(0),
        xpReward: z.number().default(50),
      });
      
      const data = lessonSchema.parse(req.body);
      const lesson = await storage.createLesson(data);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  app.put("/api/admin/lessons/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const lesson = await storage.updateLesson(id, req.body);
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/admin/lessons/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteLesson(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  // --- HACKATHON MANAGEMENT ---

  app.get("/api/admin/hackathons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hackathons = await storage.getAllHackathons();
      res.json(hackathons);
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      res.status(500).json({ error: "Failed to fetch hackathons" });
    }
  });

  app.post("/api/admin/hackathons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hackathonSchema = z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        url: z.string().url(),
        startDate: z.string().transform(s => new Date(s)),
        endDate: z.string().transform(s => new Date(s)),
        platform: z.string().min(1),
        imageUrl: z.string().optional(),
        tags: z.array(z.string()).optional(),
      });
      
      const data = hackathonSchema.parse(req.body);
      const hackathon = await storage.createHackathon(data);
      res.status(201).json(hackathon);
    } catch (error) {
      console.error("Error creating hackathon:", error);
      res.status(500).json({ error: "Failed to create hackathon" });
    }
  });

  app.put("/api/admin/hackathons/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const hackathon = await storage.updateHackathon(id, req.body);
      res.json(hackathon);
    } catch (error) {
      console.error("Error updating hackathon:", error);
      res.status(500).json({ error: "Failed to update hackathon" });
    }
  });

  app.delete("/api/admin/hackathons/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteHackathon(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hackathon:", error);
      res.status(500).json({ error: "Failed to delete hackathon" });
    }
  });

  // --- SUBMISSIONS REVIEW ---

  app.get("/api/admin/submissions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      const submissionsWithDetails = await Promise.all(
        submissions.map(async (sub) => {
          const user = await storage.getUser(sub.userId);
          const problem = await storage.getProblemById(sub.problemId);
          return {
            ...sub,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown' : 'Unknown',
            problemTitle: problem?.title || 'Unknown',
            problemSlug: problem?.slug || '',
          };
        })
      );
      res.json(submissionsWithDetails);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/admin/submissions/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const submission = await storage.getSubmissionById(id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      const user = await storage.getUser(submission.userId);
      const problem = await storage.getProblemById(submission.problemId);
      
      res.json({
        ...submission,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown' : 'Unknown',
        problem,
      });
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  // --- PROBLEMS MANAGEMENT ---

  app.get("/api/admin/problems", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const problems = await storage.getAllProblems({});
      res.json(problems);
    } catch (error) {
      console.error("Error fetching problems:", error);
      res.status(500).json({ error: "Failed to fetch problems" });
    }
  });

  app.post("/api/admin/problems", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const problem = await storage.createProblem(req.body);
      res.status(201).json(problem);
    } catch (error) {
      console.error("Error creating problem:", error);
      res.status(500).json({ error: "Failed to create problem" });
    }
  });

  app.put("/api/admin/problems/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const problem = await storage.updateProblem(id, req.body);
      res.json(problem);
    } catch (error) {
      console.error("Error updating problem:", error);
      res.status(500).json({ error: "Failed to update problem" });
    }
  });

  app.delete("/api/admin/problems/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteProblem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting problem:", error);
      res.status(500).json({ error: "Failed to delete problem" });
    }
  });

  // --- ADMIN STATS ---

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const problems = await storage.getAllProblems({});
      const hackathons = await storage.getAllHackathons();
      const tutorials = await storage.getAllTutorials();
      const submissions = await storage.getAllSubmissions();
      
      res.json({
        totalUsers: users.length,
        totalProblems: problems.length,
        totalHackathons: hackathons.length,
        totalTutorials: tutorials.length,
        totalSubmissions: submissions.length,
        passedSubmissions: submissions.filter(s => s.status === "Passed").length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
}

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
        videoUrl: z.string().optional(),
        videoThumbnail: z.string().optional(),
        videoDuration: z.string().optional(),
        order: z.number().default(0),
        xpReward: z.number().default(500),
        content: z.string().optional(),
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

  // --- TUTORIAL-HACKATHON RELATIONSHIPS ---

  // Get tutorials linked to a hackathon
  app.get("/api/admin/hackathons/:hackathonId/tutorials", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hackathonId = parseInt(req.params.hackathonId as string);
      const hackathonTutorials = await storage.getHackathonTutorials(hackathonId);
      res.json(hackathonTutorials);
    } catch (error) {
      console.error("Error fetching hackathon tutorials:", error);
      res.status(500).json({ error: "Failed to fetch hackathon tutorials" });
    }
  });

  // Link a tutorial to a hackathon
  app.post("/api/admin/hackathons/:hackathonId/tutorials", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hackathonId = parseInt(req.params.hackathonId as string);
      const tutorialSchema = z.object({
        tutorialId: z.number(),
        relevance: z.enum(["required", "recommended", "optional"]).default("recommended"),
        order: z.number().optional().default(0),
      });
      
      const data = tutorialSchema.parse(req.body);
      const hackathonTutorial = await storage.createHackathonTutorial({
        hackathonId,
        tutorialId: data.tutorialId,
        relevance: data.relevance,
        order: data.order,
      });
      res.status(201).json(hackathonTutorial);
    } catch (error) {
      console.error("Error linking tutorial to hackathon:", error);
      res.status(500).json({ error: "Failed to link tutorial to hackathon" });
    }
  });

  // Update tutorial-hackathon relationship
  app.put("/api/admin/hackathons/:hackathonId/tutorials/:tutorialId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hackathonId = parseInt(req.params.hackathonId as string);
      const tutorialId = parseInt(req.params.tutorialId as string);
      const updateSchema = z.object({
        relevance: z.enum(["required", "recommended", "optional"]).optional(),
        order: z.number().optional(),
      });
      
      const data = updateSchema.parse(req.body);
      const hackathonTutorial = await storage.updateHackathonTutorial(hackathonId, tutorialId, data);
      res.json(hackathonTutorial);
    } catch (error) {
      console.error("Error updating hackathon tutorial relationship:", error);
      res.status(500).json({ error: "Failed to update hackathon tutorial relationship" });
    }
  });

  // Remove tutorial from hackathon
  app.delete("/api/admin/hackathons/:hackathonId/tutorials/:tutorialId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hackathonId = parseInt(req.params.hackathonId as string);
      const tutorialId = parseInt(req.params.tutorialId as string);
      await storage.deleteHackathonTutorial(hackathonId, tutorialId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing tutorial from hackathon:", error);
      res.status(500).json({ error: "Failed to remove tutorial from hackathon" });
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

  // --- ORGANIZATION MANAGEMENT ---

  app.get("/api/admin/organizations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orgs = await storage.getAllOrganizations();
      const orgsWithDetails = await Promise.all(
        orgs.map(async (org: any) => {
          const members = await storage.getOrgMembers(org.id);
          const hackathons = await storage.getHostedHackathons(org.id);
          const owner = await storage.getUser(org.ownerUserId);
          return {
            ...org,
            memberCount: members.length,
            hackathonCount: hackathons.length,
            ownerName: owner ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email || 'Unknown' : 'Unknown',
          };
        })
      );
      res.json(orgsWithDetails);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // --- HOSTED HACKATHON MANAGEMENT ---

  app.get("/api/admin/hosted-hackathons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hackathons = await storage.getHostedHackathons();
      const hackathonsWithDetails = await Promise.all(
        hackathons.map(async (h: any) => {
          const org = await storage.getOrganizationById(h.organizationId);
          const registrations = await storage.getHackathonRegistrations(h.id);
          return {
            ...h,
            organizationName: org?.name || 'Unknown',
            registrationCount: registrations.length,
          };
        })
      );
      res.json(hackathonsWithDetails);
    } catch (error) {
      console.error("Error fetching hosted hackathons:", error);
      res.status(500).json({ error: "Failed to fetch hosted hackathons" });
    }
  });

  app.patch("/api/admin/hosted-hackathons/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { status } = req.body;
      const validStatuses = ["draft", "open", "in_progress", "judging", "completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const hackathon = await storage.updateHostedHackathon(id, { status });
      res.json(hackathon);
    } catch (error) {
      console.error("Error updating hosted hackathon status:", error);
      res.status(500).json({ error: "Failed to update hackathon status" });
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

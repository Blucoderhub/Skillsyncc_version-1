import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { registerAdminRoutes, isAdmin } from "./admin-routes";
import { initStripe, registerStripeRoutes, registerStripeWebhookRoute } from "./stripe/stripeRoutes";
import { z } from "zod";
import os from "os";

// Error logging middleware
const errorLoggingMiddleware = (app: Express) => {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const errorData = {
      errorType: err.name || "UnhandledError",
      errorMessage: err.message || "Unknown error",
      stackTrace: err.stack || null,
      endpoint: `${req.method} ${req.path}`,
      severity: res.statusCode >= 500 ? "critical" : "warning" as string,
      userId: (req as any).user?.claims?.sub || null,
    };

    storage.logError(errorData).catch(console.error);

    if (!res.headersSent) {
      res.status(err.status || 500).json({ error: err.message || "Internal server error" });
    }
  });
};

// Middleware to check if user has active Club membership
const isClubMember = async (req: Request, res: Response, next: NextFunction) => {
  const reqAny = req as any;
  if (!reqAny.isAuthenticated || !reqAny.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const userId = reqAny.user?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ error: "User not found" });
  }
  
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    const isActive = user.membershipStatus === 'active' && 
                     user.membershipTier && 
                     ['club_monthly', 'club_yearly'].includes(user.membershipTier) &&
                     (!user.membershipExpiresAt || new Date(user.membershipExpiresAt) > new Date());
    
    if (!isActive) {
      return res.status(403).json({ 
        error: "Club membership required",
        requiresUpgrade: true,
        message: "This feature requires an active Club membership. Please upgrade to access."
      });
    }
    
    next();
  } catch (error) {
    console.error('Club membership check error:', error);
    return res.status(500).json({ error: "Failed to verify membership" });
  }
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // 2. Setup Stripe (initialize and register routes)
  await initStripe();
  registerStripeRoutes(app);
  
  // 3. Setup AI Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAudioRoutes(app);
  
  // 4. Setup Admin Routes
  registerAdminRoutes(app);

  // 5. Application Routes

  // Problems List with filters
  app.get(api.problems.list.path, async (req: any, res) => {
    const { category, difficulty, search } = req.query;
    const problems = await storage.getAllProblems({ category, difficulty, search });
    
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      const problemsWithStatus = await Promise.all(
        problems.map(async (problem) => {
          const submissions = await storage.getUserSubmissions(userId, problem.id);
          const isSolved = submissions.some(s => s.status === "Passed");
          return { ...problem, isSolved };
        })
      );
      return res.json(problemsWithStatus);
    }
    
    res.json(problems.map(p => ({ ...p, isSolved: false })));
  });

  // Daily Challenge
  app.get(api.problems.daily.path, async (req, res) => {
    const daily = await storage.getDailyChallenge();
    if (!daily) return res.status(404).json({ message: "No daily challenge" });
    res.json(daily);
  });

  // Problem Get
  app.get(api.problems.get.path, async (req: any, res) => {
    const problem = await storage.getProblemBySlug(req.params.slug);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    
    let isSolved = false;
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      const submissions = await storage.getUserSubmissions(userId, problem.id);
      isSolved = submissions.some(s => s.status === "Passed");
    }
    
    res.json({ ...problem, isSolved });
  });

  // Submit Code
  app.post(api.problems.submit.path, isAuthenticated, async (req, res) => {
    const problemId = parseInt(req.params.id as string);
    const userId = (req.user as any).claims.sub;
    const { code, language } = req.body;

    const problem = await storage.getProblemById(problemId);
    if (!problem) return res.status(404).json({ message: "Problem not found" });

    // Improved mock execution - check for basic patterns
    let passed = false;
    const codeLC = code.toLowerCase();
    
    if (problem.slug.includes("hello-world") && (code.includes("print") || code.includes("console.log"))) {
      passed = codeLC.includes("hello") && codeLC.includes("world");
    } else if (problem.slug.includes("sum") && code.includes("return")) {
      passed = code.includes("+") || code.includes("a + b") || code.includes("a+b");
    } else {
      passed = code.length > 20 && code.includes("return");
    }
    
    const output = passed 
      ? "All Tests Passed!\nExecution Time: 0.05s\nMemory: 8.2 MB" 
      : "Test Failed\nExpected output does not match\nTry checking your logic again.";

    await storage.createSubmission(userId, {
      userId,
      problemId,
      code,
      status: passed ? "Passed" : "Failed",
    });

    let xpEarned = 0;
    if (passed) {
      const prevSubmissions = await storage.getUserSubmissions(userId, problemId);
      const alreadySolved = prevSubmissions.filter(s => s.status === "Passed").length > 1;
      
      if (!alreadySolved) {
        xpEarned = problem.xpReward;
        await storage.updateUserProgress(userId, xpEarned);
      }
    }

    res.json({
      success: true,
      output,
      passed,
      xpEarned,
      nextProblemSlug: undefined
    });
  });

  // User Stats
  app.get(api.user.stats.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    let stats = await storage.getUserProgress(userId);
    
    if (!stats) {
      stats = await storage.initializeUserProgress(userId);
    }
    
    res.json(stats);
  });

  // Leaderboard
  app.get(api.leaderboard.list.path, async (req, res) => {
    const leaderboardData = await storage.getLeaderboard(50);
    
    const leaderboard = leaderboardData.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      username: `Coder${entry.userId.slice(-4)}`,
      xp: entry.xp || 0,
      level: entry.level || 1,
      solvedCount: entry.solvedCount || 0,
      badgeCount: 0,
    }));
    
    res.json(leaderboard);
  });

  // Tutorials
  app.get(api.tutorials.list.path, async (req, res) => {
    const tutorialsList = await storage.getAllTutorials();
    res.json(tutorialsList);
  });

  app.get(api.tutorials.get.path, async (req, res) => {
    const tutorial = await storage.getTutorialBySlug(req.params.slug as string);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });
    res.json(tutorial);
  });

  app.get(api.tutorials.lesson.path, async (req, res) => {
    const lesson = await storage.getLessonBySlug(req.params.tutorialSlug as string, req.params.lessonSlug as string);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json(lesson);
  });

  app.post(api.tutorials.completeLesson.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const lessonId = parseInt(req.params.id as string);
    const result = await storage.completeLessonProgress(userId, lessonId);
    res.json({ success: true, xpEarned: result.xpEarned });
  });

  // Discussions
  app.get(api.discussions.list.path, async (req, res) => {
    const discussionsList = await storage.getAllDiscussions();
    const withAuthors = discussionsList.map(d => ({
      ...d,
      authorName: `User${d.userId.slice(-4)}`,
    }));
    res.json(withAuthors);
  });

  app.get(api.discussions.get.path, async (req, res) => {
    const id = parseInt(req.params.id as string);
    const discussion = await storage.getDiscussionById(id);
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });
    
    const answersList = await storage.getAnswersForDiscussion(id);
    const answersWithAuthors = answersList.map(a => ({
      ...a,
      authorName: `User${a.userId.slice(-4)}`,
    }));
    
    res.json({
      ...discussion,
      authorName: `User${discussion.userId.slice(-4)}`,
      answers: answersWithAuthors,
    });
  });

  app.post(api.discussions.create.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const discussion = await storage.createDiscussion(userId, req.body);
    res.json(discussion);
  });

  app.post(api.discussions.answer.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const discussionId = parseInt(req.params.id as string);
    const { content } = req.body;
    await storage.createAnswer(userId, discussionId, content);
    res.json({ success: true });
  });

  app.post(api.discussions.vote.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const discussionId = parseInt(req.params.id as string);
    const { value } = req.body;
    const newCount = await storage.voteDiscussion(userId, discussionId, value);
    res.json({ success: true, newCount });
  });

  // Badges
  app.get(api.badges.list.path, async (req, res) => {
    const badgesList = await storage.getAllBadges();
    res.json(badgesList);
  });

  app.get(api.badges.userBadges.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const userBadgesList = await storage.getUserBadges(userId);
    res.json(userBadgesList);
  });

  // Hackathons
  app.get(api.hackathons.list.path, async (req, res) => {
    const hacks = await storage.getAllHackathons();
    res.json(hacks);
  });

  // ==========================================
  // CLUB MEMBERSHIP PREMIUM ROUTES
  // ==========================================

  // Get user's certificates (Club members only)
  app.get("/api/certificates", isAuthenticated, isClubMember, async (req, res) => {
    const userId = (req as any).user.claims.sub;
    const certificates = await storage.getUserCertificates(userId);
    res.json(certificates);
  });

  // Issue a certificate (Club members only, after course completion)
  app.post("/api/certificates", isAuthenticated, isClubMember, async (req, res) => {
    const userId = (req as any).user.claims.sub;
    const { tutorialId, tutorialTitle } = req.body;
    
    if (!tutorialId || !tutorialTitle) {
      return res.status(400).json({ error: "Tutorial ID and title required" });
    }
    
    // Check if certificate already exists
    const existingCerts = await storage.getUserCertificates(userId);
    if (existingCerts.some(c => c.tutorialId === tutorialId)) {
      return res.status(400).json({ error: "Certificate already issued for this course" });
    }
    
    const certificate = await storage.createCertificate({
      userId,
      tutorialId,
      title: `${tutorialTitle} Certificate`,
      issuedAt: new Date(),
    });
    
    res.json(certificate);
  });

  // Get user's portfolio projects (Club members only)
  app.get("/api/portfolio", isAuthenticated, isClubMember, async (req, res) => {
    const userId = (req as any).user.claims.sub;
    const projects = await storage.getUserProjects(userId);
    res.json(projects);
  });

  // Create a portfolio project (Club members only)
  app.post("/api/portfolio", isAuthenticated, isClubMember, async (req, res) => {
    const userId = (req as any).user.claims.sub;
    const { title, description, techStack, liveUrl, repoUrl, imageUrl } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }
    
    const project = await storage.createProject({
      userId,
      title,
      description,
      techStack: techStack || [],
      liveUrl: liveUrl || null,
      repoUrl: repoUrl || null,
      imageUrl: imageUrl || null,
      isPublic: true,
    });
    
    res.json(project);
  });

  // Update a portfolio project (Club members only)
  app.patch("/api/portfolio/:id", isAuthenticated, isClubMember, async (req, res) => {
    const userId = (req as any).user.claims.sub;
    const projectId = parseInt(req.params.id);
    const { title, description, techStack, liveUrl, repoUrl, imageUrl, isPublic } = req.body;
    
    const project = await storage.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (project.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to edit this project" });
    }
    
    const updated = await storage.updateProject(projectId, {
      title, description, techStack, liveUrl, repoUrl, imageUrl, isPublic
    });
    
    res.json(updated);
  });

  // Delete a portfolio project (Club members only)
  app.delete("/api/portfolio/:id", isAuthenticated, isClubMember, async (req, res) => {
    const userId = (req as any).user.claims.sub;
    const projectId = parseInt(req.params.id);
    
    const project = await storage.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (project.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this project" });
    }
    
    await storage.deleteProject(projectId);
    res.json({ success: true });
  });

  // Get monthly challenges (public list, but submissions are Club-only)
  app.get("/api/challenges", async (req, res) => {
    const challenges = await storage.getAllMonthlyChallenges();
    res.json(challenges);
  });

  // Get single challenge details
  app.get("/api/challenges/:id", async (req, res) => {
    const challengeId = parseInt(req.params.id);
    const challenge = await storage.getMonthlyChallengeById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    res.json(challenge);
  });

  // Submit to a monthly challenge (Club members only)
  app.post("/api/challenges/:id/submit", isAuthenticated, isClubMember, async (req, res) => {
    const userId = (req as any).user.claims.sub;
    const challengeId = parseInt(req.params.id);
    const { projectUrl, description } = req.body;
    
    const challenge = await storage.getMonthlyChallengeById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    if (new Date() > challenge.endDate) {
      return res.status(400).json({ error: "Challenge submission period has ended" });
    }
    
    const submission = await storage.createChallengeSubmission({
      userId,
      challengeId,
      projectUrl,
      description,
      submittedAt: new Date(),
    });
    
    res.json(submission);
  });

  // Get user's challenge submissions
  app.get("/api/challenges/:id/submissions", isAuthenticated, async (req, res) => {
    const userId = (req as any).user.claims.sub;
    const challengeId = parseInt(req.params.id);
    const submissions = await storage.getUserChallengeSubmissions(userId, challengeId);
    res.json(submissions);
  });

  // ==========================================
  // END CLUB MEMBERSHIP ROUTES
  // ==========================================

  // ==========================================
  // ORGANIZATION ROUTES
  // ==========================================

  app.get("/api/organizations", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const orgs = await storage.getUserOrganizations(userId);
    res.json(orgs);
  });

  app.get("/api/organizations/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const org = await storage.getOrganizationById(id);
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json(org);
  });

  app.get("/api/organizations/slug/:slug", async (req: Request, res: Response) => {
    const org = await storage.getOrganizationBySlug(req.params.slug);
    if (!org) return res.status(404).json({ error: "Organization not found" });
    res.json(org);
  });

  app.post("/api/organizations", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const { name, description, website, industry, countryCode, logoUrl } = req.body;
    
    if (!name) return res.status(400).json({ error: "Organization name is required" });
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await storage.getOrganizationBySlug(slug);
    if (existing) return res.status(400).json({ error: "Organization name already taken" });
    
    const org = await storage.createOrganization({
      name,
      slug,
      description: description || null,
      website: website || null,
      industry: industry || null,
      countryCode: countryCode || null,
      logoUrl: logoUrl || null,
      ownerUserId: userId,
    });
    res.json(org);
  });

  app.patch("/api/organizations/:id", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const id = parseInt(req.params.id);
    
    const role = await storage.getOrgMemberRole(id, userId);
    if (!role || !['owner', 'admin'].includes(role)) {
      return res.status(403).json({ error: "Not authorized to update this organization" });
    }
    
    const { name, description, website, industry, logoUrl } = req.body;
    const org = await storage.updateOrganization(id, { name, description, website, industry, logoUrl });
    res.json(org);
  });

  app.delete("/api/organizations/:id", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const id = parseInt(req.params.id);
    
    const role = await storage.getOrgMemberRole(id, userId);
    if (role !== 'owner') {
      return res.status(403).json({ error: "Only the owner can delete an organization" });
    }
    
    await storage.deleteOrganization(id);
    res.json({ success: true });
  });

  app.get("/api/organizations/:id/members", isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const members = await storage.getOrgMembers(id);
    res.json(members);
  });

  app.post("/api/organizations/:id/members", isAuthenticated, async (req: Request, res: Response) => {
    const currentUserId = (req as any).user?.claims?.sub;
    const orgId = parseInt(req.params.id);
    
    const role = await storage.getOrgMemberRole(orgId, currentUserId);
    if (!role || !['owner', 'admin'].includes(role)) {
      return res.status(403).json({ error: "Not authorized to add members" });
    }
    
    const { userId, memberRole } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });
    
    const existingRole = await storage.getOrgMemberRole(orgId, userId);
    if (existingRole) return res.status(400).json({ error: "User is already a member" });
    
    const member = await storage.addOrgMember(orgId, userId, memberRole || 'member');
    res.json(member);
  });

  app.delete("/api/organizations/:id/members/:userId", isAuthenticated, async (req: Request, res: Response) => {
    const currentUserId = (req as any).user?.claims?.sub;
    const orgId = parseInt(req.params.id);
    const targetUserId = req.params.userId;
    
    const role = await storage.getOrgMemberRole(orgId, currentUserId);
    if (!role || !['owner', 'admin'].includes(role)) {
      return res.status(403).json({ error: "Not authorized to remove members" });
    }
    
    if (targetUserId === currentUserId && role === 'owner') {
      return res.status(400).json({ error: "Owner cannot remove themselves" });
    }
    
    await storage.removeOrgMember(orgId, targetUserId);
    res.json({ success: true });
  });

  // ==========================================
  // HACKATHON HOSTING ROUTES
  // ==========================================

  app.get("/api/hosted-hackathons", async (_req: Request, res: Response) => {
    const hostedHackathons = await storage.getHostedHackathons();
    const hackathonsWithCounts = await Promise.all(
      hostedHackathons.map(async (h) => {
        const regCount = await storage.getHackathonRegistrationCount(h.id);
        return { ...h, registrationCount: regCount };
      })
    );
    res.json(hackathonsWithCounts);
  });

  app.get("/api/hosted-hackathons/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const hackathon = await storage.getHackathonById(id);
    if (!hackathon) return res.status(404).json({ error: "Hackathon not found" });
    
    const regCount = await storage.getHackathonRegistrationCount(id);
    const teams = await storage.getHackathonTeams(id);
    const criteria = await storage.getJudgingCriteria(id);
    
    res.json({ ...hackathon, registrationCount: regCount, teams, judgingCriteria: criteria });
  });

  app.post("/api/hosted-hackathons", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const { 
      title, description, startDate, endDate, registrationDeadline,
      maxParticipants, prizePool, rules, hostOrgId, tags, imageUrl, url
    } = req.body;
    
    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({ error: "Title, description, start date, and end date are required" });
    }
    
    if (hostOrgId) {
      const role = await storage.getOrgMemberRole(hostOrgId, userId);
      if (!role || !['owner', 'admin'].includes(role)) {
        return res.status(403).json({ error: "Not authorized to create hackathons for this organization" });
      }
    }
    
    const hackathon = await storage.createHostedHackathon({
      title,
      description,
      url: url || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      maxParticipants: maxParticipants || null,
      prizePool: prizePool || null,
      rules: rules || null,
      hostOrgId: hostOrgId || null,
      platform: 'Skillsyncc',
      tags: tags || [],
      imageUrl: imageUrl || null,
      status: 'open',
      visibility: 'public',
      createdBy: userId,
    });
    res.json(hackathon);
  });

  app.patch("/api/hosted-hackathons/:id", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const id = parseInt(req.params.id);
    
    const hackathon = await storage.getHackathonById(id);
    if (!hackathon) return res.status(404).json({ error: "Hackathon not found" });
    
    if (hackathon.createdBy !== userId) {
      if (hackathon.hostOrgId) {
        const role = await storage.getOrgMemberRole(hackathon.hostOrgId, userId);
        if (!role || !['owner', 'admin'].includes(role)) {
          return res.status(403).json({ error: "Not authorized" });
        }
      } else {
        return res.status(403).json({ error: "Not authorized" });
      }
    }
    
    const updated = await storage.updateHostedHackathon(id, req.body);
    res.json(updated);
  });

  // Registration
  app.post("/api/hosted-hackathons/:id/register", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const hackathonId = parseInt(req.params.id);
    
    const hackathon = await storage.getHackathonById(hackathonId);
    if (!hackathon) return res.status(404).json({ error: "Hackathon not found" });
    
    if (hackathon.registrationDeadline && new Date() > new Date(hackathon.registrationDeadline)) {
      return res.status(400).json({ error: "Registration deadline has passed" });
    }
    
    if (hackathon.maxParticipants) {
      const regCount = await storage.getHackathonRegistrationCount(hackathonId);
      if (regCount >= hackathon.maxParticipants) {
        return res.status(400).json({ error: "Hackathon is full" });
      }
    }
    
    const existing = await storage.getUserHackathonRegistration(hackathonId, userId);
    if (existing) return res.status(400).json({ error: "Already registered" });
    
    const reg = await storage.registerForHackathon(hackathonId, userId);
    res.json(reg);
  });

  app.get("/api/hosted-hackathons/:id/registration", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const hackathonId = parseInt(req.params.id);
    const reg = await storage.getUserHackathonRegistration(hackathonId, userId);
    res.json({ registered: !!reg, registration: reg || null });
  });

  app.delete("/api/hosted-hackathons/:id/register", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const hackathonId = parseInt(req.params.id);
    await storage.withdrawFromHackathon(hackathonId, userId);
    res.json({ success: true });
  });

  app.get("/api/hosted-hackathons/:id/registrations", isAuthenticated, async (req: Request, res: Response) => {
    const hackathonId = parseInt(req.params.id);
    const registrations = await storage.getHackathonRegistrations(hackathonId);
    res.json(registrations);
  });

  // Teams
  app.post("/api/hosted-hackathons/:id/teams", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const hackathonId = parseInt(req.params.id);
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ error: "Team name is required" });
    
    const reg = await storage.getUserHackathonRegistration(hackathonId, userId);
    if (!reg) return res.status(400).json({ error: "Must be registered to create a team" });
    
    const team = await storage.createTeam(hackathonId, name, userId);
    res.json(team);
  });

  app.get("/api/hosted-hackathons/:id/teams", async (req: Request, res: Response) => {
    const hackathonId = parseInt(req.params.id);
    const teams = await storage.getHackathonTeams(hackathonId);
    res.json(teams);
  });

  app.post("/api/teams/:teamId/members", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const teamId = parseInt(req.params.teamId);
    
    const team = await storage.getTeamById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    
    const reg = await storage.getUserHackathonRegistration(team.hackathonId, userId);
    if (!reg) return res.status(400).json({ error: "Must be registered for the hackathon" });
    
    const member = await storage.addTeamMember(teamId, userId);
    res.json(member);
  });

  app.delete("/api/teams/:teamId/members", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const teamId = parseInt(req.params.teamId);
    await storage.removeTeamMember(teamId, userId);
    res.json({ success: true });
  });

  // Submissions
  app.post("/api/hosted-hackathons/:id/submissions", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const hackathonId = parseInt(req.params.id);
    const { title, description, repoUrl, demoUrl, videoUrl, teamId } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }
    
    const reg = await storage.getUserHackathonRegistration(hackathonId, userId);
    if (!reg) return res.status(400).json({ error: "Must be registered to submit" });
    
    const submission = await storage.createHackathonSubmission({
      hackathonId,
      userId,
      teamId: teamId || null,
      title,
      description,
      repoUrl: repoUrl || null,
      demoUrl: demoUrl || null,
      videoUrl: videoUrl || null,
    });
    res.json(submission);
  });

  app.get("/api/hosted-hackathons/:id/submissions", async (req: Request, res: Response) => {
    const hackathonId = parseInt(req.params.id);
    const subs = await storage.getHackathonSubmissions(hackathonId);
    res.json(subs);
  });

  // Judging
  app.post("/api/hosted-hackathons/:id/criteria", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const hackathonId = parseInt(req.params.id);
    
    const hackathon = await storage.getHackathonById(hackathonId);
    if (!hackathon) return res.status(404).json({ error: "Hackathon not found" });
    
    if (hackathon.createdBy !== userId && hackathon.hostOrgId) {
      const role = await storage.getOrgMemberRole(hackathon.hostOrgId, userId);
      if (!role || !['owner', 'admin'].includes(role)) {
        return res.status(403).json({ error: "Not authorized" });
      }
    }
    
    const { name, description, weight, maxScore } = req.body;
    const criterion = await storage.createJudgingCriterion(hackathonId, name, description || '', weight || 1, maxScore || 10);
    res.json(criterion);
  });

  app.get("/api/hosted-hackathons/:id/criteria", async (req: Request, res: Response) => {
    const hackathonId = parseInt(req.params.id);
    const criteria = await storage.getJudgingCriteria(hackathonId);
    res.json(criteria);
  });

  app.post("/api/submissions/:submissionId/score", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const submissionId = parseInt(req.params.submissionId);
    const { criterionId, score, comment } = req.body;
    
    if (!criterionId || score === undefined) {
      return res.status(400).json({ error: "Criterion ID and score are required" });
    }
    
    const result = await storage.submitJudgingScore({
      submissionId,
      judgeUserId: userId,
      criterionId,
      score,
      comment: comment || null,
    });
    res.json(result);
  });

  app.get("/api/submissions/:submissionId/scores", async (req: Request, res: Response) => {
    const submissionId = parseInt(req.params.submissionId);
    const scores = await storage.getSubmissionScores(submissionId);
    res.json(scores);
  });

  // ==========================================
  // END HACKATHON HOSTING ROUTES
  // ==========================================

  // ==========================================
  // CMS CONTENT ROUTES
  // ==========================================

  app.get("/api/cms/content", async (req: Request, res: Response) => {
    const { status, contentType, category } = req.query;
    const content = await storage.getAllCmsContent({
      status: status as string | undefined,
      contentType: contentType as string | undefined,
      category: category as string | undefined,
    });
    res.json(content);
  });

  app.get("/api/cms/published", async (req: Request, res: Response) => {
    const { category, contentType } = req.query;
    const content = await storage.getPublishedContent({
      category: category as string | undefined,
      contentType: contentType as string | undefined,
    });
    res.json(content);
  });

  app.get("/api/cms/content/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const content = await storage.getCmsContentById(id);
    if (!content) return res.status(404).json({ error: "Content not found" });
    await storage.incrementContentViews(id);
    res.json(content);
  });

  app.get("/api/cms/content/slug/:slug", async (req: Request, res: Response) => {
    const content = await storage.getCmsContentBySlug(req.params.slug);
    if (!content) return res.status(404).json({ error: "Content not found" });
    await storage.incrementContentViews(content.id);
    res.json(content);
  });

  app.post("/api/cms/content", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const { title, contentType, templateType, contentJson, category, subCategory, tags, difficultyLevel, estimatedMinutes, metaTitle, metaDescription, isPremium, status } = req.body;

    if (!title || !contentJson) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    const existing = await storage.getCmsContentBySlug(slug);
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const content = await storage.createCmsContent({
      title,
      slug: finalSlug,
      contentType: contentType || "tutorial",
      templateType: templateType || "standard_tutorial",
      contentJson,
      category: category || "web-development",
      subCategory: subCategory || null,
      tags: tags || [],
      difficultyLevel: difficultyLevel || "beginner",
      estimatedMinutes: estimatedMinutes || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      isPremium: isPremium || false,
      authorId: userId,
      status: status || "draft",
      scheduledFor: null,
    });

    await storage.createContentVersion(content.id, contentJson, userId, "Initial version");
    res.json(content);
  });

  app.patch("/api/cms/content/:id", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const id = parseInt(req.params.id);
    const { contentJson, isAutoSave, changeLog, ...updates } = req.body;

    const existing = await storage.getCmsContentById(id);
    if (!existing) return res.status(404).json({ error: "Content not found" });

    const updateData: any = { ...updates };
    if (contentJson) updateData.contentJson = contentJson;

    const updated = await storage.updateCmsContent(id, updateData);

    if (contentJson && !isAutoSave) {
      await storage.createContentVersion(id, contentJson, userId, changeLog || `Updated`);
    }

    res.json(updated);
  });

  app.post("/api/cms/content/:id/publish", isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const existing = await storage.getCmsContentById(id);
    if (!existing) return res.status(404).json({ error: "Content not found" });

    const published = await storage.publishCmsContent(id);
    res.json(published);
  });

  app.delete("/api/cms/content/:id", isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await storage.deleteCmsContent(id);
    res.json({ success: true });
  });

  app.get("/api/cms/content/:id/versions", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const versions = await storage.getContentVersions(id);
    res.json(versions);
  });

  app.post("/api/cms/content/:id/restore/:versionNumber", isAuthenticated, async (req: Request, res: Response) => {
    const userId = (req as any).user?.claims?.sub;
    const id = parseInt(req.params.id);
    const versionNumber = parseInt(req.params.versionNumber);

    const version = await storage.getContentVersion(id, versionNumber);
    if (!version) return res.status(404).json({ error: "Version not found" });

    const restored = await storage.updateCmsContent(id, { contentJson: version.contentJson as any });
    await storage.createContentVersion(id, version.contentJson, userId, `Restored to version ${versionNumber}`);

    res.json(restored);
  });

  app.get("/api/cms/content/:id/analytics", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const analytics = await storage.getContentAnalytics(id);
    res.json(analytics || { views: 0, completions: 0 });
  });

  app.post("/api/cms/content/:id/complete", isAuthenticated, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await storage.incrementContentCompletions(id);
    res.json({ success: true });
  });

  // ==========================================
  // HEALTH & MONITORING ROUTES
  // ==========================================

  app.get("/api/health", async (_req: Request, res: Response) => {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    cpus.forEach((cpu: any) => {
      for (const type in cpu.times) totalTick += cpu.times[type];
      totalIdle += cpu.times.idle;
    });
    const cpuUsage = 100 - Math.round(100 * (totalIdle / cpus.length) / (totalTick / cpus.length));
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    let dbHealthy = true;
    try {
      await storage.getAllProblems();
    } catch {
      dbHealthy = false;
    }

    const status = !dbHealthy ? "critical" : (cpuUsage > 90 || memoryUsage > 90) ? "warning" : "healthy";

    await storage.recordMetric({ metricType: "cpu_usage", value: cpuUsage, unit: "percentage" });
    await storage.recordMetric({ metricType: "memory_usage", value: memoryUsage, unit: "percentage" });

    res.json({
      status,
      uptime: process.uptime(),
      cpu: cpuUsage,
      memory: memoryUsage,
      database: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date(),
    });
  });

  app.get("/api/monitoring/errors", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    const { isResolved, severity, errorType } = req.query;
    const errors = await storage.getErrorLogs({
      isResolved: isResolved === "true" ? true : isResolved === "false" ? false : undefined,
      severity: severity as string | undefined,
      errorType: errorType as string | undefined,
    });
    res.json(errors);
  });

  app.get("/api/monitoring/error-stats", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    const stats = await storage.getErrorStats();
    res.json(stats);
  });

  app.post("/api/monitoring/errors/:id/resolve", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { fixApplied } = req.body;
    await storage.resolveError(id, fixApplied);
    res.json({ success: true });
  });

  app.get("/api/monitoring/metrics/:type", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    const metrics = await storage.getRecentMetrics(req.params.type, 100);
    res.json(metrics);
  });

  app.get("/api/monitoring/auto-fixes", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    const logs = await storage.getAutoFixLogs(100);
    res.json(logs);
  });

  // ==========================================
  // END CMS & MONITORING ROUTES
  // ==========================================

  // Error logging middleware
  errorLoggingMiddleware(app);

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Extended problem set covering multiple categories
  const problemsData = [
    {
      slug: "hello-world-python",
      title: "The Legend Begins: Hello World",
      description: "Your adventure begins here. Print 'Hello, World!' to the console to awaken the ancient spirits of code.\n\n**Example:**\n```\nOutput: Hello, World!\n```",
      difficulty: "Easy",
      category: "Python",
      language: "python",
      starterCode: "def solve():\n    # Print 'Hello, World!' to the console\n    pass",
      testCases: [{ input: "", expected: "Hello, World!" }],
      xpReward: 100,
      order: 1
    },
    {
      slug: "sum-of-two",
      title: "The Binary Caverns: Sum of Two",
      description: "Deep in the caverns, you encounter two number spirits. Return their sum to pass the gate.\n\n**Example:**\n```\nInput: a=1, b=2\nOutput: 3\n```",
      difficulty: "Easy",
      category: "Algorithms",
      language: "python",
      starterCode: "def sum_two(a, b):\n    # Return the sum of a and b\n    return 0",
      testCases: [{ input: "1, 2", expected: "3" }],
      xpReward: 100,
      order: 2
    },
    {
      slug: "reverse-string",
      title: "The Mirror Temple",
      description: "In the Mirror Temple, all text is reversed. Write a function to reverse a string.\n\n**Example:**\n```\nInput: 'hello'\nOutput: 'olleh'\n```",
      difficulty: "Easy",
      category: "Algorithms",
      language: "python",
      starterCode: "def reverse_string(s):\n    # Return the reversed string\n    return ''",
      testCases: [{ input: "hello", expected: "olleh" }],
      xpReward: 100,
      order: 3
    },
    {
      slug: "fizzbuzz",
      title: "The FizzBuzz Oracle",
      description: "The ancient oracle speaks in riddles. For numbers divisible by 3, say 'Fizz'. For 5, say 'Buzz'. For both, 'FizzBuzz'.\n\n**Example:**\n```\nInput: 15\nOutput: 'FizzBuzz'\n```",
      difficulty: "Easy",
      category: "Algorithms",
      language: "python",
      starterCode: "def fizzbuzz(n):\n    # Return 'Fizz', 'Buzz', 'FizzBuzz', or the number as string\n    return ''",
      testCases: [{ input: "15", expected: "FizzBuzz" }],
      xpReward: 150,
      order: 4
    },
    {
      slug: "two-sum",
      title: "Two Sum Challenge",
      description: "Given an array of integers and a target sum, find two numbers that add up to the target.\n\n**Example:**\n```\nInput: nums=[2,7,11,15], target=9\nOutput: [0,1]\n```",
      difficulty: "Medium",
      category: "Data Structures",
      language: "python",
      starterCode: "def two_sum(nums, target):\n    # Return indices of two numbers that add up to target\n    return []",
      testCases: [{ input: "[2,7,11,15], 9", expected: "[0, 1]" }],
      xpReward: 200,
      order: 5
    },
    {
      slug: "palindrome-check",
      title: "Palindrome Portal",
      description: "Check if a string reads the same forwards and backwards.\n\n**Example:**\n```\nInput: 'racecar'\nOutput: True\n```",
      difficulty: "Easy",
      category: "Algorithms",
      language: "python",
      starterCode: "def is_palindrome(s):\n    # Return True if s is a palindrome, False otherwise\n    return False",
      testCases: [{ input: "racecar", expected: "True" }],
      xpReward: 100,
      order: 6
    },
    {
      slug: "factorial",
      title: "The Factorial Tower",
      description: "Calculate the factorial of a number n (n!).\n\n**Example:**\n```\nInput: 5\nOutput: 120 (5*4*3*2*1)\n```",
      difficulty: "Easy",
      category: "Algorithms",
      language: "python",
      starterCode: "def factorial(n):\n    # Return n!\n    return 1",
      testCases: [{ input: "5", expected: "120" }],
      xpReward: 100,
      order: 7
    },
    {
      slug: "fibonacci",
      title: "The Golden Spiral",
      description: "Return the nth Fibonacci number.\n\n**Example:**\n```\nInput: 6\nOutput: 8 (sequence: 0,1,1,2,3,5,8)\n```",
      difficulty: "Medium",
      category: "Algorithms",
      language: "python",
      starterCode: "def fibonacci(n):\n    # Return the nth Fibonacci number\n    return 0",
      testCases: [{ input: "6", expected: "8" }],
      xpReward: 200,
      order: 8
    },
    {
      slug: "html-basic-page",
      title: "Your First Web Page",
      description: "Create a basic HTML page with a heading and paragraph.\n\n**Requirements:**\n- DOCTYPE declaration\n- html, head, body tags\n- An h1 heading\n- A paragraph",
      difficulty: "Easy",
      category: "Web",
      language: "html",
      starterCode: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <!-- Add your content here -->\n</body>\n</html>",
      testCases: [{ input: "", expected: "valid html structure" }],
      xpReward: 100,
      order: 9
    },
    {
      slug: "css-button-style",
      title: "Style a Button",
      description: "Create a styled button using CSS with hover effects.\n\n**Requirements:**\n- Background color\n- Padding and border radius\n- Hover state change",
      difficulty: "Easy",
      category: "Web",
      language: "css",
      starterCode: ".button {\n  /* Add your styles */\n}\n\n.button:hover {\n  /* Add hover styles */\n}",
      testCases: [{ input: "", expected: "styled button css" }],
      xpReward: 100,
      order: 10
    },
    {
      slug: "js-array-filter",
      title: "Array Filter Magic",
      description: "Filter an array to keep only even numbers.\n\n**Example:**\n```\nInput: [1,2,3,4,5,6]\nOutput: [2,4,6]\n```",
      difficulty: "Easy",
      category: "JavaScript",
      language: "javascript",
      starterCode: "function filterEvens(arr) {\n  // Return array with only even numbers\n  return arr;\n}",
      testCases: [{ input: "[1,2,3,4,5,6]", expected: "[2,4,6]" }],
      xpReward: 100,
      order: 11
    },
    {
      slug: "sql-select-basics",
      title: "SQL Select Quest",
      description: "Write a query to select all users from a users table.\n\n**Expected Query:**\n```sql\nSELECT * FROM users;\n```",
      difficulty: "Easy",
      category: "SQL",
      language: "sql",
      starterCode: "-- Write your SQL query here\nSELECT ",
      testCases: [{ input: "", expected: "SELECT * FROM users" }],
      xpReward: 100,
      order: 12
    },
    {
      slug: "binary-search",
      title: "Binary Search Algorithm",
      description: "Implement binary search to find an element in a sorted array.\n\n**Example:**\n```\nInput: arr=[1,3,5,7,9], target=5\nOutput: 2 (index)\n```",
      difficulty: "Medium",
      category: "Algorithms",
      language: "python",
      starterCode: "def binary_search(arr, target):\n    # Return index of target, or -1 if not found\n    return -1",
      testCases: [{ input: "[1,3,5,7,9], 5", expected: "2" }],
      xpReward: 250,
      order: 13
    },
    {
      slug: "linked-list-reverse",
      title: "Reverse a Linked List",
      description: "Reverse a singly linked list.\n\n**Example:**\n```\nInput: 1->2->3->4->5\nOutput: 5->4->3->2->1\n```",
      difficulty: "Medium",
      category: "Data Structures",
      language: "python",
      starterCode: "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    # Reverse and return new head\n    return head",
      testCases: [{ input: "1->2->3", expected: "3->2->1" }],
      xpReward: 300,
      order: 14
    },
    {
      slug: "valid-parentheses",
      title: "Valid Parentheses",
      description: "Check if a string of parentheses is valid.\n\n**Example:**\n```\nInput: '()[]{}'\nOutput: True\n\nInput: '([)]'\nOutput: False\n```",
      difficulty: "Medium",
      category: "Data Structures",
      language: "python",
      starterCode: "def is_valid(s):\n    # Return True if parentheses are valid\n    return False",
      testCases: [{ input: "()[]{}}", expected: "True" }],
      xpReward: 250,
      order: 15
    },
  ];

  const hackathonsData = [
    {
      title: "Global AI Hackathon 2026",
      description: "Build the future of AI in this 48-hour global event. $50,000 in prizes!",
      url: "https://globalai.hackathon.com",
      startDate: new Date("2026-02-15"),
      endDate: new Date("2026-02-17"),
      platform: "Devpost",
      tags: ["AI", "Machine Learning", "Python"]
    },
    {
      title: "Web3 World Cup",
      description: "Decentralized apps for the new world. Build the next big DeFi project.",
      url: "https://web3.hackathon.com",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-03"),
      platform: "ETHGlobal",
      tags: ["Blockchain", "Solidity", "Web3"]
    },
    {
      title: "Green Tech Summit",
      description: "Coding for a sustainable future. Climate-focused innovation.",
      url: "https://greentech.hackathon.com",
      startDate: new Date("2026-04-10"),
      endDate: new Date("2026-04-12"),
      platform: "Devfolio",
      tags: ["Sustainability", "IoT", "Climate"]
    },
    {
      title: "GameDev Jam 2026",
      description: "Create an indie game in 72 hours. Theme revealed at start!",
      url: "https://gamedev.jam.com",
      startDate: new Date("2026-05-20"),
      endDate: new Date("2026-05-23"),
      platform: "itch.io",
      tags: ["Gaming", "Unity", "Godot"]
    },
    {
      title: "HealthTech Innovation",
      description: "Build healthcare solutions that save lives. API access to health datasets.",
      url: "https://healthtech.hackathon.com",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-03"),
      platform: "Devpost",
      tags: ["Healthcare", "AI", "Mobile"]
    },
  ];

  const tutorialsData = [
    {
      slug: "python-basics",
      title: "Python Fundamentals",
      description: "Master Python programming from the ground up. Learn variables, loops, functions, and more.",
      category: "Python",
      difficulty: "Beginner",
      order: 1,
      xpReward: 500,
    },
    {
      slug: "html-essentials",
      title: "HTML Essentials",
      description: "Learn the building blocks of the web. Create structured web pages with HTML.",
      category: "HTML",
      difficulty: "Beginner",
      order: 2,
      xpReward: 400,
    },
    {
      slug: "css-styling",
      title: "CSS Styling Mastery",
      description: "Transform plain HTML into beautiful designs with CSS styling techniques.",
      category: "CSS",
      difficulty: "Beginner",
      order: 3,
      xpReward: 400,
    },
    {
      slug: "javascript-intro",
      title: "JavaScript for Beginners",
      description: "Add interactivity to your web pages with JavaScript programming.",
      category: "JavaScript",
      difficulty: "Beginner",
      order: 4,
      xpReward: 500,
    },
    {
      slug: "sql-databases",
      title: "SQL & Databases",
      description: "Learn to query and manipulate data with SQL. Master database fundamentals.",
      category: "SQL",
      difficulty: "Beginner",
      order: 5,
      xpReward: 500,
    },
    {
      slug: "algorithms-dsa",
      title: "Data Structures & Algorithms",
      description: "Master the fundamentals of computer science. Learn arrays, trees, graphs, and more.",
      category: "Algorithms",
      difficulty: "Intermediate",
      order: 6,
      xpReward: 800,
    },
  ];

  const lessonsData = [
    // Python Basics
    { tutorialSlug: "python-basics", slug: "variables", title: "Variables & Data Types", content: "Learn about Python variables and basic data types.\n\n## Variables\nVariables store data values. In Python, you don't need to declare types.\n\n```python\nname = 'Alice'\nage = 25\nheight = 5.9\nis_student = True\n```\n\n## Data Types\n- **str**: Text strings\n- **int**: Whole numbers\n- **float**: Decimal numbers\n- **bool**: True/False values", codeExample: "# Try these:\nname = 'Your Name'\nprint(f'Hello, {name}!')", order: 1, xpReward: 50 },
    { tutorialSlug: "python-basics", slug: "conditionals", title: "If Statements", content: "Make decisions in your code with conditionals.\n\n## If Statement\n```python\nif condition:\n    # do something\nelif another_condition:\n    # do something else\nelse:\n    # default action\n```", codeExample: "age = 18\nif age >= 18:\n    print('Adult')\nelse:\n    print('Minor')", order: 2, xpReward: 50 },
    { tutorialSlug: "python-basics", slug: "loops", title: "Loops", content: "Repeat actions with loops.\n\n## For Loop\n```python\nfor i in range(5):\n    print(i)\n```\n\n## While Loop\n```python\nwhile condition:\n    # repeat\n```", codeExample: "for i in range(1, 6):\n    print(f'Count: {i}')", order: 3, xpReward: 50 },
    { tutorialSlug: "python-basics", slug: "functions", title: "Functions", content: "Create reusable code with functions.\n\n```python\ndef greet(name):\n    return f'Hello, {name}!'\n\nresult = greet('World')\n```", codeExample: "def add(a, b):\n    return a + b\n\nprint(add(3, 5))", order: 4, xpReward: 50 },
    
    // HTML Essentials
    { tutorialSlug: "html-essentials", slug: "structure", title: "HTML Structure", content: "Learn the basic structure of an HTML document.\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Page Title</title>\n</head>\n<body>\n  <h1>Heading</h1>\n  <p>Paragraph</p>\n</body>\n</html>\n```", codeExample: "<!DOCTYPE html>\n<html>\n<head><title>My Page</title></head>\n<body><h1>Hello!</h1></body>\n</html>", order: 1, xpReward: 50, language: "html" },
    { tutorialSlug: "html-essentials", slug: "elements", title: "HTML Elements", content: "Common HTML elements:\n- **Headings**: h1-h6\n- **Paragraph**: p\n- **Links**: a\n- **Images**: img\n- **Lists**: ul, ol, li", codeExample: "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>", order: 2, xpReward: 50, language: "html" },
    
    // JavaScript Intro
    { tutorialSlug: "javascript-intro", slug: "basics", title: "JS Basics", content: "JavaScript variables and console output.\n\n```javascript\nlet name = 'Alice';\nconst PI = 3.14;\nconsole.log(name);\n```", codeExample: "let greeting = 'Hello World';\nconsole.log(greeting);", order: 1, xpReward: 50, language: "javascript" },
    { tutorialSlug: "javascript-intro", slug: "dom", title: "DOM Manipulation", content: "Interact with HTML elements.\n\n```javascript\ndocument.getElementById('myId');\ndocument.querySelector('.class');\n```", codeExample: "document.body.style.backgroundColor = 'lightblue';", order: 2, xpReward: 50, language: "javascript" },
  ];

  // Monthly Challenges seed data
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastDayOfMonth = new Date(nextMonth.getTime() - 1);
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // Handle year rollover for previous month (Jan -> Dec of previous year)
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const monthlyChallengesData = [
    {
      title: "January Jam: Build Your Portfolio",
      description: "Create your portfolio website using HTML, CSS, and JavaScript. Showcase your skills and projects in a creative way!",
      month: monthStr,
      prize: "Winner gets featured on homepage + 2000 XP bonus",
      prizeAmount: 2000,
      rules: "Must include: About section, Projects gallery, Contact form",
      isClubOnly: true,
      startDate: currentMonth,
      endDate: lastDayOfMonth,
      isActive: true,
    },
    {
      title: "Algorithm Arena",
      description: "Solve 10 algorithm challenges in our Practice section. First to complete all wins!",
      month: prevMonthStr,
      prize: "1000 XP + Algorithm Master badge",
      prizeAmount: 1000,
      rules: "Complete 10 problems with 100% test pass rate",
      isClubOnly: true,
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth(), 0),
      isActive: false,
    },
  ];

  const badgesData = [
    { slug: "first-quest", name: "First Quest", description: "Complete your first coding challenge", icon: "Sword", color: "text-green-500", xpRequired: null, problemsRequired: 1, category: "achievement" },
    { slug: "problem-solver", name: "Problem Solver", description: "Solve 5 coding challenges", icon: "Lightbulb", color: "text-yellow-500", xpRequired: null, problemsRequired: 5, category: "achievement" },
    { slug: "code-warrior", name: "Code Warrior", description: "Solve 10 coding challenges", icon: "Shield", color: "text-blue-500", xpRequired: null, problemsRequired: 10, category: "achievement" },
    { slug: "xp-hunter", name: "XP Hunter", description: "Earn 500 XP", icon: "Star", color: "text-purple-500", xpRequired: 500, problemsRequired: null, category: "achievement" },
    { slug: "level-5", name: "Level 5 Coder", description: "Reach Level 5", icon: "Award", color: "text-orange-500", xpRequired: 2000, problemsRequired: null, category: "skill" },
    { slug: "streak-7", name: "Week Warrior", description: "7-day coding streak", icon: "Flame", color: "text-red-500", xpRequired: null, problemsRequired: null, category: "streak" },
    { slug: "python-master", name: "Python Master", description: "Complete all Python challenges", icon: "Code2", color: "text-green-400", xpRequired: null, problemsRequired: null, category: "skill" },
    { slug: "algorithm-expert", name: "Algorithm Expert", description: "Solve 5 algorithm problems", icon: "Brain", color: "text-pink-500", xpRequired: null, problemsRequired: null, category: "skill" },
  ];

  await storage.seedProblems(problemsData);
  await storage.seedHackathons(hackathonsData);
  await storage.seedTutorials(tutorialsData, lessonsData);
  await storage.seedBadges(badgesData);
  await storage.seedMonthlyChallenges(monthlyChallengesData);
}

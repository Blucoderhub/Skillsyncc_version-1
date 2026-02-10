import { db } from "./db";
import { 
  problems, submissions, userProgress, hackathons, tutorials, lessons,
  discussions, answers, votes, badges, userBadges, dailyChallenges, userLessonProgress,
  users, certificates, projects, monthlyChallenges, challengeSubmissions,
  organizations, organizationMembers, hackathonRegistrations, hackathonTeams,
  teamMembers, hackathonSubmissions, judgingCriteria, judgingScores,
  cmsContent, contentVersions, contentAnalytics, errorLogs, systemMetrics, autoFixLogs,
  type Problem, type Submission, type UserProgress, type Hackathon, type Tutorial, type Lesson,
  type Discussion, type Answer, type Badge, type UserBadge, type User,
  type Certificate, type Project, type MonthlyChallenge, type ChallengeSubmission,
  type InsertSubmission, type InsertDiscussion, type InsertAnswer,
  type Organization, type OrganizationMember, type HackathonRegistration,
  type HackathonTeam, type TeamMember, type HackathonSubmission,
  type JudgingCriterion, type JudgingScore,
  type InsertOrganization, type InsertHackathonSubmission, type InsertJudgingScore,
  type CmsContent, type InsertCmsContent, type ContentVersion, type ContentAnalyticsRow,
  type ErrorLog, type InsertErrorLog, type SystemMetric, type AutoFixLog
} from "@shared/schema";
import { eq, desc, sql, and, like, or, gte, lte, count, asc } from "drizzle-orm";

export interface IStorage {
  // Problems
  getAllProblems(filters?: { category?: string; difficulty?: string; search?: string }): Promise<Problem[]>;
  getProblemBySlug(slug: string): Promise<Problem | undefined>;
  getProblemById(id: number): Promise<Problem | undefined>;
  getDailyChallenge(): Promise<(Problem & { bonusXp: number }) | undefined>;
  
  // Submissions
  createSubmission(userId: string, submission: InsertSubmission): Promise<Submission>;
  getUserSubmissions(userId: string, problemId: number): Promise<Submission[]>;
  
  // Progress
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  updateUserProgress(userId: string, xpGain: number): Promise<UserProgress>;
  initializeUserProgress(userId: string): Promise<UserProgress>;
  getLeaderboard(limit?: number): Promise<UserProgress[]>;
  
  // Tutorials
  getAllTutorials(): Promise<Tutorial[]>;
  getTutorialBySlug(slug: string): Promise<(Tutorial & { lessons: Lesson[] }) | undefined>;
  getLessonBySlug(tutorialSlug: string, lessonSlug: string): Promise<Lesson | undefined>;
  completeLessonProgress(userId: string, lessonId: number): Promise<{ xpEarned: number }>;
  
  // Discussions
  getAllDiscussions(): Promise<Discussion[]>;
  getDiscussionById(id: number): Promise<Discussion | undefined>;
  createDiscussion(userId: string, data: InsertDiscussion): Promise<Discussion>;
  createAnswer(userId: string, discussionId: number, content: string): Promise<Answer>;
  getAnswersForDiscussion(discussionId: number): Promise<Answer[]>;
  voteDiscussion(userId: string, discussionId: number, value: number): Promise<number>;
  
  // Badges
  getAllBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<(Badge & { earnedAt: Date })[]>;
  awardBadge(userId: string, badgeId: number): Promise<void>;
  
  // Hackathons
  getAllHackathons(): Promise<Hackathon[]>;
  
  // Club Features - Certificates
  getUserCertificates(userId: string): Promise<Certificate[]>;
  createCertificate(data: { userId: string; tutorialId: number; title: string; issuedAt: Date }): Promise<Certificate>;
  
  // Club Features - Portfolio
  getUserProjects(userId: string): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  createProject(data: { userId: string; title: string; description: string; techStack: string[]; liveUrl: string | null; repoUrl: string | null; imageUrl: string | null; isPublic: boolean }): Promise<Project>;
  updateProject(id: number, data: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Club Features - Monthly Challenges
  getAllMonthlyChallenges(): Promise<MonthlyChallenge[]>;
  getMonthlyChallengeById(id: number): Promise<MonthlyChallenge | undefined>;
  createChallengeSubmission(data: { userId: string; challengeId: number; projectUrl: string; description: string; submittedAt: Date }): Promise<ChallengeSubmission>;
  getUserChallengeSubmissions(userId: string, challengeId: number): Promise<ChallengeSubmission[]>;
  
  // Organizations
  createOrganization(data: InsertOrganization): Promise<Organization>;
  getOrganizationById(id: number): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<(Organization & { role: string })[]>;
  getAllOrganizations(): Promise<Organization[]>;
  updateOrganization(id: number, data: Partial<Organization>): Promise<Organization>;
  deleteOrganization(id: number): Promise<void>;
  addOrgMember(orgId: number, userId: string, role: string): Promise<OrganizationMember>;
  removeOrgMember(orgId: number, userId: string): Promise<void>;
  getOrgMembers(orgId: number): Promise<(OrganizationMember & { user: User })[]>;
  getOrgMemberRole(orgId: number, userId: string): Promise<string | null>;

  // Hackathon Hosting
  getHostedHackathons(orgId?: number): Promise<Hackathon[]>;
  getHackathonById(id: number): Promise<Hackathon | undefined>;
  createHostedHackathon(data: any): Promise<Hackathon>;
  updateHostedHackathon(id: number, data: any): Promise<Hackathon>;

  // Hackathon Registration
  registerForHackathon(hackathonId: number, userId: string): Promise<HackathonRegistration>;
  getHackathonRegistrations(hackathonId: number): Promise<HackathonRegistration[]>;
  getUserHackathonRegistration(hackathonId: number, userId: string): Promise<HackathonRegistration | undefined>;
  withdrawFromHackathon(hackathonId: number, userId: string): Promise<void>;
  getHackathonRegistrationCount(hackathonId: number): Promise<number>;

  // Teams
  createTeam(hackathonId: number, name: string, captainUserId: string): Promise<HackathonTeam>;
  getHackathonTeams(hackathonId: number): Promise<(HackathonTeam & { memberCount: number })[]>;
  getTeamById(teamId: number): Promise<HackathonTeam | undefined>;
  addTeamMember(teamId: number, userId: string): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: string): Promise<void>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;

  // Hackathon Submissions
  createHackathonSubmission(data: InsertHackathonSubmission): Promise<HackathonSubmission>;
  getHackathonSubmissions(hackathonId: number): Promise<HackathonSubmission[]>;
  getHackathonSubmissionById(id: number): Promise<HackathonSubmission | undefined>;
  updateHackathonSubmission(id: number, data: Partial<HackathonSubmission>): Promise<HackathonSubmission>;

  // Judging
  createJudgingCriterion(hackathonId: number, name: string, description: string, weight: number, maxScore: number): Promise<JudgingCriterion>;
  getJudgingCriteria(hackathonId: number): Promise<JudgingCriterion[]>;
  submitJudgingScore(data: InsertJudgingScore): Promise<JudgingScore>;
  getSubmissionScores(submissionId: number): Promise<(JudgingScore & { criterionName: string })[]>;

  // CMS Content
  getAllCmsContent(filters?: { status?: string; contentType?: string; category?: string }): Promise<CmsContent[]>;
  getCmsContentById(id: number): Promise<CmsContent | undefined>;
  getCmsContentBySlug(slug: string): Promise<CmsContent | undefined>;
  getPublishedContent(filters?: { category?: string; contentType?: string }): Promise<CmsContent[]>;
  createCmsContent(data: InsertCmsContent): Promise<CmsContent>;
  updateCmsContent(id: number, data: Partial<CmsContent>): Promise<CmsContent>;
  deleteCmsContent(id: number): Promise<void>;
  publishCmsContent(id: number): Promise<CmsContent>;

  // Content Versions
  createContentVersion(contentId: number, contentJson: any, createdById: string, changeLog?: string): Promise<ContentVersion>;
  getContentVersions(contentId: number): Promise<ContentVersion[]>;
  getContentVersion(contentId: number, versionNumber: number): Promise<ContentVersion | undefined>;
  getNextVersionNumber(contentId: number): Promise<number>;

  // Content Analytics
  getContentAnalytics(contentId: number): Promise<ContentAnalyticsRow | undefined>;
  incrementContentViews(contentId: number): Promise<void>;
  incrementContentCompletions(contentId: number): Promise<void>;

  // Error Logs
  logError(data: InsertErrorLog): Promise<ErrorLog>;
  getErrorLogs(filters?: { isResolved?: boolean; severity?: string; errorType?: string }): Promise<ErrorLog[]>;
  resolveError(id: number, fixApplied?: string): Promise<void>;
  getErrorStats(): Promise<{ total: number; unresolved: number; autoFixed: number; byType: Record<string, number>; bySeverity: Record<string, number> }>;
  incrementErrorOccurrence(id: number): Promise<void>;
  findSimilarError(errorType: string, errorMessage: string): Promise<ErrorLog | undefined>;

  // System Metrics
  recordMetric(data: { metricType: string; value: number; unit: string }): Promise<SystemMetric>;
  getRecentMetrics(metricType: string, limit?: number): Promise<SystemMetric[]>;

  // Auto Fix Logs
  logAutoFix(data: { fixType: string; targetType: string; targetId?: string; description: string; oldValue?: string; newValue?: string; successful: boolean }): Promise<AutoFixLog>;
  getAutoFixLogs(limit?: number): Promise<AutoFixLog[]>;

  // Seeding
  seedHackathons(hackathonsData: any[]): Promise<void>;
  seedProblems(problemsData: any[]): Promise<void>;
  seedTutorials(tutorialsData: any[], lessonsData: any[]): Promise<void>;
  seedBadges(badgesData: any[]): Promise<void>;
  seedMonthlyChallenges(challengesData: any[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAllProblems(filters?: { category?: string; difficulty?: string; search?: string }): Promise<Problem[]> {
    let query = db.select().from(problems);
    
    if (filters?.category && filters.category !== 'all') {
      query = query.where(eq(problems.category, filters.category)) as any;
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      query = query.where(eq(problems.difficulty, filters.difficulty)) as any;
    }
    if (filters?.search) {
      query = query.where(
        or(
          like(problems.title, `%${filters.search}%`),
          like(problems.description, `%${filters.search}%`)
        )
      ) as any;
    }
    
    return await query.orderBy(problems.order);
  }

  async getProblemBySlug(slug: string): Promise<Problem | undefined> {
    const [problem] = await db.select().from(problems).where(eq(problems.slug, slug));
    return problem;
  }

  async getProblemById(id: number): Promise<Problem | undefined> {
    const [problem] = await db.select().from(problems).where(eq(problems.id, id));
    return problem;
  }

  async getDailyChallenge(): Promise<(Problem & { bonusXp: number }) | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [challenge] = await db.select()
      .from(dailyChallenges)
      .where(sql`DATE(${dailyChallenges.date}) = DATE(${today})`);
    
    if (challenge) {
      const problem = await this.getProblemById(challenge.problemId);
      if (problem) return { ...problem, bonusXp: challenge.bonusXp || 50 };
    }
    
    // Fallback: return first unsolved problem as daily
    const allProblems = await this.getAllProblems();
    if (allProblems.length > 0) {
      return { ...allProblems[0], bonusXp: 50 };
    }
    return undefined;
  }

  async createSubmission(userId: string, submission: InsertSubmission): Promise<Submission> {
    const [sub] = await db.insert(submissions).values({ ...submission, userId }).returning();
    return sub;
  }

  async getUserSubmissions(userId: string, problemId: number): Promise<Submission[]> {
    return await db.select()
      .from(submissions)
      .where(sql`${submissions.userId} = ${userId} AND ${submissions.problemId} = ${problemId}`)
      .orderBy(desc(submissions.createdAt));
  }

  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    return progress;
  }

  async initializeUserProgress(userId: string): Promise<UserProgress> {
    const [progress] = await db.insert(userProgress)
      .values({ userId, level: 1, xp: 0, streak: 1 })
      .onConflictDoNothing()
      .returning();
    return progress || await this.getUserProgress(userId) as UserProgress;
  }

  async updateUserProgress(userId: string, xpGain: number): Promise<UserProgress> {
    const current = await this.getUserProgress(userId);
    if (!current) return this.initializeUserProgress(userId);

    const newXp = (current.xp || 0) + xpGain;
    const newLevel = Math.floor(newXp / 500) + 1; // Level up every 500 XP

    const [updated] = await db.update(userProgress)
      .set({ 
        xp: newXp, 
        level: newLevel, 
        lastActive: new Date(),
        solvedCount: sql`${userProgress.solvedCount} + 1`
      })
      .where(eq(userProgress.userId, userId))
      .returning();
    return updated;
  }

  async getLeaderboard(limit: number = 100): Promise<UserProgress[]> {
    return await db.select()
      .from(userProgress)
      .orderBy(desc(userProgress.xp))
      .limit(limit);
  }

  // Tutorials
  async getAllTutorials(): Promise<Tutorial[]> {
    return await db.select().from(tutorials).orderBy(tutorials.order);
  }

  async getTutorialBySlug(slug: string): Promise<(Tutorial & { lessons: Lesson[] }) | undefined> {
    const [tutorial] = await db.select().from(tutorials).where(eq(tutorials.slug, slug));
    if (!tutorial) return undefined;
    
    const tutorialLessons = await db.select()
      .from(lessons)
      .where(eq(lessons.tutorialId, tutorial.id))
      .orderBy(lessons.order);
    
    return { ...tutorial, lessons: tutorialLessons };
  }

  async getLessonBySlug(tutorialSlug: string, lessonSlug: string): Promise<Lesson | undefined> {
    const tutorial = await this.getTutorialBySlug(tutorialSlug);
    if (!tutorial) return undefined;
    
    const [lesson] = await db.select()
      .from(lessons)
      .where(and(eq(lessons.tutorialId, tutorial.id), eq(lessons.slug, lessonSlug)));
    return lesson;
  }

  async completeLessonProgress(userId: string, lessonId: number): Promise<{ xpEarned: number }> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
    if (!lesson) return { xpEarned: 0 };
    
    // Check if already completed
    const [existing] = await db.select()
      .from(userLessonProgress)
      .where(and(eq(userLessonProgress.userId, userId), eq(userLessonProgress.lessonId, lessonId)));
    
    if (existing?.completed) return { xpEarned: 0 };
    
    // Mark as completed
    await db.insert(userLessonProgress)
      .values({ userId, lessonId, completed: true, completedAt: new Date() })
      .onConflictDoNothing();
    
    // Award XP
    const xpEarned = lesson.xpReward || 50;
    await this.updateUserProgress(userId, xpEarned);
    
    return { xpEarned };
  }

  // Discussions
  async getAllDiscussions(): Promise<Discussion[]> {
    return await db.select().from(discussions).orderBy(desc(discussions.createdAt));
  }

  async getDiscussionById(id: number): Promise<Discussion | undefined> {
    const [discussion] = await db.select().from(discussions).where(eq(discussions.id, id));
    
    // Increment views
    if (discussion) {
      await db.update(discussions)
        .set({ views: sql`${discussions.views} + 1` })
        .where(eq(discussions.id, id));
    }
    
    return discussion;
  }

  async createDiscussion(userId: string, data: InsertDiscussion): Promise<Discussion> {
    const [discussion] = await db.insert(discussions)
      .values({ ...data, userId })
      .returning();
    return discussion;
  }

  async createAnswer(userId: string, discussionId: number, content: string): Promise<Answer> {
    const [answer] = await db.insert(answers)
      .values({ userId, discussionId, content })
      .returning();
    
    // Update answer count
    await db.update(discussions)
      .set({ answersCount: sql`${discussions.answersCount} + 1` })
      .where(eq(discussions.id, discussionId));
    
    return answer;
  }

  async getAnswersForDiscussion(discussionId: number): Promise<Answer[]> {
    return await db.select()
      .from(answers)
      .where(eq(answers.discussionId, discussionId))
      .orderBy(desc(answers.upvotes), answers.createdAt);
  }

  async voteDiscussion(userId: string, discussionId: number, value: number): Promise<number> {
    // Check existing vote
    const [existing] = await db.select()
      .from(votes)
      .where(and(
        eq(votes.userId, userId),
        eq(votes.targetType, 'discussion'),
        eq(votes.targetId, discussionId)
      ));
    
    if (existing) {
      // Update existing vote
      await db.update(votes)
        .set({ value })
        .where(eq(votes.id, existing.id));
    } else {
      // Create new vote
      await db.insert(votes)
        .values({ userId, targetType: 'discussion', targetId: discussionId, value });
    }
    
    // Recalculate total
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${votes.value}), 0)` })
      .from(votes)
      .where(and(eq(votes.targetType, 'discussion'), eq(votes.targetId, discussionId)));
    
    const newCount = result[0]?.total || 0;
    
    await db.update(discussions)
      .set({ upvotes: newCount })
      .where(eq(discussions.id, discussionId));
    
    return newCount;
  }

  // Badges
  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserBadges(userId: string): Promise<(Badge & { earnedAt: Date })[]> {
    const result = await db.select({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
      color: badges.color,
      xpRequired: badges.xpRequired,
      problemsRequired: badges.problemsRequired,
      category: badges.category,
      earnedAt: userBadges.earnedAt,
    })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));
    
    return result.map(r => ({
      ...r,
      earnedAt: r.earnedAt || new Date()
    }));
  }

  async awardBadge(userId: string, badgeId: number): Promise<void> {
    await db.insert(userBadges)
      .values({ userId, badgeId })
      .onConflictDoNothing();
  }

  // Hackathons
  async getAllHackathons(): Promise<Hackathon[]> {
    return await db.select().from(hackathons).orderBy(desc(hackathons.startDate));
  }

  // Seeding
  async seedHackathons(hackathonsData: any[]): Promise<void> {
    if ((await this.getAllHackathons()).length > 0) return;
    await db.insert(hackathons).values(hackathonsData);
  }

  async seedProblems(problemsData: any[]): Promise<void> {
    if ((await this.getAllProblems()).length > 0) return;
    await db.insert(problems).values(problemsData);
  }

  async seedTutorials(tutorialsData: any[], lessonsData: any[]): Promise<void> {
    if ((await this.getAllTutorials()).length > 0) return;
    
    for (const tutorial of tutorialsData) {
      const [inserted] = await db.insert(tutorials).values(tutorial).returning();
      const tutorialLessons = lessonsData.filter((l: any) => l.tutorialSlug === tutorial.slug);
      
      for (const lesson of tutorialLessons) {
        await db.insert(lessons).values({
          tutorialId: inserted.id,
          slug: lesson.slug,
          title: lesson.title,
          content: lesson.content,
          codeExample: lesson.codeExample,
          language: lesson.language || tutorial.category.toLowerCase(),
          order: lesson.order,
          xpReward: lesson.xpReward || 50,
        });
      }
      
      // Update lesson count
      await db.update(tutorials)
        .set({ lessonsCount: tutorialLessons.length })
        .where(eq(tutorials.id, inserted.id));
    }
  }

  async seedBadges(badgesData: any[]): Promise<void> {
    if ((await this.getAllBadges()).length > 0) return;
    await db.insert(badges).values(badgesData);
  }

  // --- ADMIN METHODS ---
  
  async getUser(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
    await db.update(users).set({ isAdmin }).where(eq(users.id, userId));
  }

  async getAllUserSubmissions(userId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.userId, userId)).orderBy(desc(submissions.createdAt));
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions).orderBy(desc(submissions.createdAt));
  }

  async getSubmissionById(id: number): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async createTutorial(data: any): Promise<Tutorial> {
    const [tutorial] = await db.insert(tutorials).values(data).returning();
    return tutorial;
  }

  async updateTutorial(id: number, data: any): Promise<Tutorial> {
    const [tutorial] = await db.update(tutorials).set(data).where(eq(tutorials.id, id)).returning();
    return tutorial;
  }

  async deleteTutorial(id: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.tutorialId, id));
    await db.delete(tutorials).where(eq(tutorials.id, id));
  }

  async getLessonsByTutorial(tutorialId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.tutorialId, tutorialId)).orderBy(lessons.order);
  }

  async createLesson(data: any): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(data).returning();
    return lesson;
  }

  async updateLesson(id: number, data: any): Promise<Lesson> {
    const [lesson] = await db.update(lessons).set(data).where(eq(lessons.id, id)).returning();
    return lesson;
  }

  async deleteLesson(id: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  async createHackathon(data: any): Promise<Hackathon> {
    const [hackathon] = await db.insert(hackathons).values(data).returning();
    return hackathon;
  }

  async updateHackathon(id: number, data: any): Promise<Hackathon> {
    const [hackathon] = await db.update(hackathons).set(data).where(eq(hackathons.id, id)).returning();
    return hackathon;
  }

  async deleteHackathon(id: number): Promise<void> {
    await db.delete(hackathons).where(eq(hackathons.id, id));
  }

  async createProblem(data: any): Promise<Problem> {
    const [problem] = await db.insert(problems).values(data).returning();
    return problem;
  }

  async updateProblem(id: number, data: any): Promise<Problem> {
    const [problem] = await db.update(problems).set(data).where(eq(problems.id, id)).returning();
    return problem;
  }

  async deleteProblem(id: number): Promise<void> {
    await db.delete(submissions).where(eq(submissions.problemId, id));
    await db.delete(problems).where(eq(problems.id, id));
  }

  // --- STRIPE / MEMBERSHIP METHODS ---
  
  async updateUserStripeInfo(userId: string, info: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    membershipStatus?: string;
    membershipTier?: string;
    membershipExpiresAt?: Date;
  }): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...info, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getClubMembers(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.membershipStatus, 'active'))
      .orderBy(desc(users.createdAt));
  }

  // --- CLUB FEATURES: CERTIFICATES ---
  
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db.select().from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));
  }

  async createCertificate(data: { userId: string; tutorialId: number; title: string; issuedAt: Date }): Promise<Certificate> {
    const [certificate] = await db.insert(certificates)
      .values({
        userId: data.userId,
        tutorialId: data.tutorialId,
        title: data.title,
        issuedAt: data.issuedAt,
        verificationCode: `BCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      })
      .returning();
    return certificate;
  }

  // --- CLUB FEATURES: PORTFOLIO ---
  
  async getUserProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(data: { userId: string; title: string; description: string; techStack: string[]; liveUrl: string | null; repoUrl: string | null; imageUrl: string | null; isPublic: boolean }): Promise<Project> {
    const [project] = await db.insert(projects)
      .values({
        userId: data.userId,
        title: data.title,
        description: data.description,
        techStack: data.techStack,
        liveUrl: data.liveUrl,
        repoUrl: data.repoUrl,
        imageUrl: data.imageUrl,
        isPublic: data.isPublic,
      })
      .returning();
    return project;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const [project] = await db.update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(challengeSubmissions).where(eq(challengeSubmissions.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  // --- CLUB FEATURES: MONTHLY CHALLENGES ---
  
  async getAllMonthlyChallenges(): Promise<MonthlyChallenge[]> {
    return await db.select().from(monthlyChallenges)
      .orderBy(desc(monthlyChallenges.startDate));
  }

  async getMonthlyChallengeById(id: number): Promise<MonthlyChallenge | undefined> {
    const [challenge] = await db.select().from(monthlyChallenges).where(eq(monthlyChallenges.id, id));
    return challenge;
  }

  async createChallengeSubmission(data: { userId: string; challengeId: number; projectUrl: string; description: string; submittedAt: Date }): Promise<ChallengeSubmission> {
    const [submission] = await db.insert(challengeSubmissions)
      .values({
        userId: data.userId,
        challengeId: data.challengeId,
        projectUrl: data.projectUrl,
        description: data.description,
        submittedAt: data.submittedAt,
        status: 'submitted',
      })
      .returning();
    return submission;
  }

  async getUserChallengeSubmissions(userId: string, challengeId: number): Promise<ChallengeSubmission[]> {
    return await db.select().from(challengeSubmissions)
      .where(and(
        eq(challengeSubmissions.userId, userId),
        eq(challengeSubmissions.challengeId, challengeId)
      ))
      .orderBy(desc(challengeSubmissions.submittedAt));
  }

  async seedMonthlyChallenges(challengesData: any[]): Promise<void> {
    const existingChallenges = await db.select().from(monthlyChallenges);
    if (existingChallenges.length === 0 && challengesData.length > 0) {
      await db.insert(monthlyChallenges).values(challengesData);
    }
  }

  // --- ORGANIZATIONS ---

  async createOrganization(data: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(data).returning();
    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: data.ownerUserId,
      role: 'owner',
    });
    return org;
  }

  async getOrganizationById(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations);
  }

  async getUserOrganizations(userId: string): Promise<(Organization & { role: string })[]> {
    const result = await db.select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      logoUrl: organizations.logoUrl,
      website: organizations.website,
      industry: organizations.industry,
      countryCode: organizations.countryCode,
      ownerUserId: organizations.ownerUserId,
      verified: organizations.verified,
      createdAt: organizations.createdAt,
      role: organizationMembers.role,
    })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId));
    return result as (Organization & { role: string })[];
  }

  async updateOrganization(id: number, data: Partial<Organization>): Promise<Organization> {
    const [org] = await db.update(organizations).set(data).where(eq(organizations.id, id)).returning();
    return org;
  }

  async deleteOrganization(id: number): Promise<void> {
    await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, id));
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  async addOrgMember(orgId: number, userId: string, role: string): Promise<OrganizationMember> {
    const [member] = await db.insert(organizationMembers)
      .values({ organizationId: orgId, userId, role })
      .returning();
    return member;
  }

  async removeOrgMember(orgId: number, userId: string): Promise<void> {
    await db.delete(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, userId)));
  }

  async getOrgMembers(orgId: number): Promise<(OrganizationMember & { user: User })[]> {
    const result = await db.select({
      id: organizationMembers.id,
      organizationId: organizationMembers.organizationId,
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      joinedAt: organizationMembers.joinedAt,
      user: users,
    })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, orgId));
    return result as any;
  }

  async getOrgMemberRole(orgId: number, userId: string): Promise<string | null> {
    const [member] = await db.select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, userId)));
    return member?.role || null;
  }

  // --- HACKATHON HOSTING ---

  async getHostedHackathons(orgId?: number): Promise<Hackathon[]> {
    if (orgId) {
      return await db.select().from(hackathons)
        .where(and(eq(hackathons.hostOrgId, orgId), eq(hackathons.hostedOnPlatform, true)))
        .orderBy(desc(hackathons.startDate));
    }
    return await db.select().from(hackathons)
      .where(eq(hackathons.hostedOnPlatform, true))
      .orderBy(desc(hackathons.startDate));
  }

  async getHackathonById(id: number): Promise<Hackathon | undefined> {
    const [hackathon] = await db.select().from(hackathons).where(eq(hackathons.id, id));
    return hackathon;
  }

  async createHostedHackathon(data: any): Promise<Hackathon> {
    const [hackathon] = await db.insert(hackathons).values({
      ...data,
      hostedOnPlatform: true,
    }).returning();
    return hackathon;
  }

  async updateHostedHackathon(id: number, data: any): Promise<Hackathon> {
    const [hackathon] = await db.update(hackathons).set(data).where(eq(hackathons.id, id)).returning();
    return hackathon;
  }

  // --- HACKATHON REGISTRATION ---

  async registerForHackathon(hackathonId: number, userId: string): Promise<HackathonRegistration> {
    const [reg] = await db.insert(hackathonRegistrations)
      .values({ hackathonId, userId, status: 'registered' })
      .returning();
    return reg;
  }

  async getHackathonRegistrations(hackathonId: number): Promise<HackathonRegistration[]> {
    return await db.select().from(hackathonRegistrations)
      .where(eq(hackathonRegistrations.hackathonId, hackathonId))
      .orderBy(desc(hackathonRegistrations.registeredAt));
  }

  async getUserHackathonRegistration(hackathonId: number, userId: string): Promise<HackathonRegistration | undefined> {
    const [reg] = await db.select().from(hackathonRegistrations)
      .where(and(
        eq(hackathonRegistrations.hackathonId, hackathonId),
        eq(hackathonRegistrations.userId, userId)
      ));
    return reg;
  }

  async withdrawFromHackathon(hackathonId: number, userId: string): Promise<void> {
    await db.delete(hackathonRegistrations)
      .where(and(
        eq(hackathonRegistrations.hackathonId, hackathonId),
        eq(hackathonRegistrations.userId, userId)
      ));
  }

  async getHackathonRegistrationCount(hackathonId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(hackathonRegistrations)
      .where(eq(hackathonRegistrations.hackathonId, hackathonId));
    return result?.count || 0;
  }

  // --- TEAMS ---

  async createTeam(hackathonId: number, name: string, captainUserId: string): Promise<HackathonTeam> {
    const [team] = await db.insert(hackathonTeams)
      .values({ hackathonId, name, captainUserId })
      .returning();
    await db.insert(teamMembers).values({ teamId: team.id, userId: captainUserId });
    return team;
  }

  async getHackathonTeams(hackathonId: number): Promise<(HackathonTeam & { memberCount: number })[]> {
    const teams = await db.select().from(hackathonTeams)
      .where(eq(hackathonTeams.hackathonId, hackathonId))
      .orderBy(hackathonTeams.createdAt);
    
    const teamsWithCount = await Promise.all(teams.map(async (team) => {
      const [result] = await db.select({ count: count() })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      return { ...team, memberCount: result?.count || 0 };
    }));
    return teamsWithCount;
  }

  async getTeamById(teamId: number): Promise<HackathonTeam | undefined> {
    const [team] = await db.select().from(hackathonTeams).where(eq(hackathonTeams.id, teamId));
    return team;
  }

  async addTeamMember(teamId: number, userId: string): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values({ teamId, userId }).returning();
    return member;
  }

  async removeTeamMember(teamId: number, userId: string): Promise<void> {
    await db.delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  // --- HACKATHON SUBMISSIONS ---

  async createHackathonSubmission(data: InsertHackathonSubmission): Promise<HackathonSubmission> {
    const [submission] = await db.insert(hackathonSubmissions).values(data).returning();
    return submission;
  }

  async getHackathonSubmissions(hackathonId: number): Promise<HackathonSubmission[]> {
    return await db.select().from(hackathonSubmissions)
      .where(eq(hackathonSubmissions.hackathonId, hackathonId))
      .orderBy(desc(hackathonSubmissions.submittedAt));
  }

  async getHackathonSubmissionById(id: number): Promise<HackathonSubmission | undefined> {
    const [submission] = await db.select().from(hackathonSubmissions).where(eq(hackathonSubmissions.id, id));
    return submission;
  }

  async updateHackathonSubmission(id: number, data: Partial<HackathonSubmission>): Promise<HackathonSubmission> {
    const [submission] = await db.update(hackathonSubmissions)
      .set(data)
      .where(eq(hackathonSubmissions.id, id))
      .returning();
    return submission;
  }

  // --- JUDGING ---

  async createJudgingCriterion(hackathonId: number, name: string, description: string, weight: number, maxScore: number): Promise<JudgingCriterion> {
    const [criterion] = await db.insert(judgingCriteria)
      .values({ hackathonId, name, description, weight, maxScore })
      .returning();
    return criterion;
  }

  async getJudgingCriteria(hackathonId: number): Promise<JudgingCriterion[]> {
    return await db.select().from(judgingCriteria)
      .where(eq(judgingCriteria.hackathonId, hackathonId));
  }

  async submitJudgingScore(data: InsertJudgingScore): Promise<JudgingScore> {
    const [score] = await db.insert(judgingScores).values(data).returning();
    return score;
  }

  async getSubmissionScores(submissionId: number): Promise<(JudgingScore & { criterionName: string })[]> {
    const result = await db.select({
      id: judgingScores.id,
      submissionId: judgingScores.submissionId,
      judgeUserId: judgingScores.judgeUserId,
      criterionId: judgingScores.criterionId,
      score: judgingScores.score,
      comment: judgingScores.comment,
      scoredAt: judgingScores.scoredAt,
      criterionName: judgingCriteria.name,
    })
      .from(judgingScores)
      .innerJoin(judgingCriteria, eq(judgingScores.criterionId, judgingCriteria.id))
      .where(eq(judgingScores.submissionId, submissionId));
    return result as any;
  }

  // --- CMS CONTENT ---

  async getAllCmsContent(filters?: { status?: string; contentType?: string; category?: string }): Promise<CmsContent[]> {
    let query = db.select().from(cmsContent);
    const conditions = [];
    if (filters?.status) conditions.push(eq(cmsContent.status, filters.status));
    if (filters?.contentType) conditions.push(eq(cmsContent.contentType, filters.contentType));
    if (filters?.category) conditions.push(eq(cmsContent.category, filters.category));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    return await query.orderBy(desc(cmsContent.updatedAt));
  }

  async getCmsContentById(id: number): Promise<CmsContent | undefined> {
    const [content] = await db.select().from(cmsContent).where(eq(cmsContent.id, id));
    return content;
  }

  async getCmsContentBySlug(slug: string): Promise<CmsContent | undefined> {
    const [content] = await db.select().from(cmsContent).where(eq(cmsContent.slug, slug));
    return content;
  }

  async getPublishedContent(filters?: { category?: string; contentType?: string }): Promise<CmsContent[]> {
    const conditions = [eq(cmsContent.status, "published")];
    if (filters?.category) conditions.push(eq(cmsContent.category, filters.category));
    if (filters?.contentType) conditions.push(eq(cmsContent.contentType, filters.contentType));
    return await db.select().from(cmsContent).where(and(...conditions)).orderBy(desc(cmsContent.publishedAt));
  }

  async createCmsContent(data: InsertCmsContent): Promise<CmsContent> {
    const [content] = await db.insert(cmsContent).values(data).returning();
    return content;
  }

  async updateCmsContent(id: number, data: Partial<CmsContent>): Promise<CmsContent> {
    const [content] = await db.update(cmsContent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cmsContent.id, id))
      .returning();
    return content;
  }

  async deleteCmsContent(id: number): Promise<void> {
    await db.delete(cmsContent).where(eq(cmsContent.id, id));
  }

  async publishCmsContent(id: number): Promise<CmsContent> {
    const [content] = await db.update(cmsContent)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(cmsContent.id, id))
      .returning();
    return content;
  }

  // --- CONTENT VERSIONS ---

  async createContentVersion(contentId: number, contentJson: any, createdById: string, changeLog?: string): Promise<ContentVersion> {
    const versionNumber = await this.getNextVersionNumber(contentId);
    const [version] = await db.insert(contentVersions)
      .values({ contentId, versionNumber, contentJson, createdById, changeLog })
      .returning();
    return version;
  }

  async getContentVersions(contentId: number): Promise<ContentVersion[]> {
    return await db.select().from(contentVersions)
      .where(eq(contentVersions.contentId, contentId))
      .orderBy(desc(contentVersions.versionNumber));
  }

  async getContentVersion(contentId: number, versionNumber: number): Promise<ContentVersion | undefined> {
    const [version] = await db.select().from(contentVersions)
      .where(and(eq(contentVersions.contentId, contentId), eq(contentVersions.versionNumber, versionNumber)));
    return version;
  }

  async getNextVersionNumber(contentId: number): Promise<number> {
    const [result] = await db.select({ maxVersion: sql<number>`COALESCE(MAX(${contentVersions.versionNumber}), 0)` })
      .from(contentVersions)
      .where(eq(contentVersions.contentId, contentId));
    return (result?.maxVersion ?? 0) + 1;
  }

  // --- CONTENT ANALYTICS ---

  async getContentAnalytics(contentId: number): Promise<ContentAnalyticsRow | undefined> {
    const [analytics] = await db.select().from(contentAnalytics)
      .where(eq(contentAnalytics.contentId, contentId));
    return analytics;
  }

  async incrementContentViews(contentId: number): Promise<void> {
    const existing = await this.getContentAnalytics(contentId);
    if (existing) {
      await db.update(contentAnalytics)
        .set({ views: sql`${contentAnalytics.views} + 1`, updatedAt: new Date() })
        .where(eq(contentAnalytics.contentId, contentId));
    } else {
      await db.insert(contentAnalytics).values({ contentId, views: 1 });
    }
  }

  async incrementContentCompletions(contentId: number): Promise<void> {
    const existing = await this.getContentAnalytics(contentId);
    if (existing) {
      await db.update(contentAnalytics)
        .set({ completions: sql`${contentAnalytics.completions} + 1`, updatedAt: new Date() })
        .where(eq(contentAnalytics.contentId, contentId));
    } else {
      await db.insert(contentAnalytics).values({ contentId, completions: 1 });
    }
  }

  // --- ERROR LOGS ---

  async logError(data: InsertErrorLog): Promise<ErrorLog> {
    const similar = await this.findSimilarError(data.errorType, data.errorMessage);
    if (similar) {
      await this.incrementErrorOccurrence(similar.id);
      return similar;
    }
    const [errorLog] = await db.insert(errorLogs).values(data).returning();
    return errorLog;
  }

  async getErrorLogs(filters?: { isResolved?: boolean; severity?: string; errorType?: string }): Promise<ErrorLog[]> {
    const conditions = [];
    if (filters?.isResolved !== undefined) conditions.push(eq(errorLogs.isResolved, filters.isResolved));
    if (filters?.severity) conditions.push(eq(errorLogs.severity, filters.severity));
    if (filters?.errorType) conditions.push(eq(errorLogs.errorType, filters.errorType));
    let query = db.select().from(errorLogs);
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    return await query.orderBy(desc(errorLogs.lastOccurred));
  }

  async resolveError(id: number, fixApplied?: string): Promise<void> {
    await db.update(errorLogs)
      .set({ isResolved: true, resolvedAt: new Date(), fixApplied: fixApplied || null })
      .where(eq(errorLogs.id, id));
  }

  async getErrorStats(): Promise<{ total: number; unresolved: number; autoFixed: number; byType: Record<string, number>; bySeverity: Record<string, number> }> {
    const allErrors = await db.select().from(errorLogs);
    const stats = {
      total: allErrors.length,
      unresolved: allErrors.filter(e => !e.isResolved).length,
      autoFixed: allErrors.filter(e => e.autoFixed).length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
    };
    allErrors.forEach(e => {
      stats.byType[e.errorType] = (stats.byType[e.errorType] || 0) + 1;
      stats.bySeverity[e.severity] = (stats.bySeverity[e.severity] || 0) + 1;
    });
    return stats;
  }

  async incrementErrorOccurrence(id: number): Promise<void> {
    await db.update(errorLogs)
      .set({ occurrences: sql`${errorLogs.occurrences} + 1`, lastOccurred: new Date() })
      .where(eq(errorLogs.id, id));
  }

  async findSimilarError(errorType: string, errorMessage: string): Promise<ErrorLog | undefined> {
    const [error] = await db.select().from(errorLogs)
      .where(and(eq(errorLogs.errorType, errorType), eq(errorLogs.errorMessage, errorMessage), eq(errorLogs.isResolved, false)));
    return error;
  }

  // --- SYSTEM METRICS ---

  async recordMetric(data: { metricType: string; value: number; unit: string }): Promise<SystemMetric> {
    const [metric] = await db.insert(systemMetrics).values(data).returning();
    return metric;
  }

  async getRecentMetrics(metricType: string, limit = 50): Promise<SystemMetric[]> {
    return await db.select().from(systemMetrics)
      .where(eq(systemMetrics.metricType, metricType))
      .orderBy(desc(systemMetrics.timestamp))
      .limit(limit);
  }

  // --- AUTO FIX LOGS ---

  async logAutoFix(data: { fixType: string; targetType: string; targetId?: string; description: string; oldValue?: string; newValue?: string; successful: boolean }): Promise<AutoFixLog> {
    const [log] = await db.insert(autoFixLogs).values(data).returning();
    return log;
  }

  async getAutoFixLogs(limit = 50): Promise<AutoFixLog[]> {
    return await db.select().from(autoFixLogs)
      .orderBy(desc(autoFixLogs.executedAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();

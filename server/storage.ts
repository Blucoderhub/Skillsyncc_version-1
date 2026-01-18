import { db } from "./db";
import { 
  problems, submissions, userProgress, hackathons, tutorials, lessons,
  discussions, answers, votes, badges, userBadges, dailyChallenges, userLessonProgress,
  users,
  type Problem, type Submission, type UserProgress, type Hackathon, type Tutorial, type Lesson,
  type Discussion, type Answer, type Badge, type UserBadge, type User,
  type InsertSubmission, type InsertDiscussion, type InsertAnswer
} from "@shared/schema";
import { eq, desc, sql, and, like, or } from "drizzle-orm";

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
  
  // Seeding
  seedHackathons(hackathonsData: any[]): Promise<void>;
  seedProblems(problemsData: any[]): Promise<void>;
  seedTutorials(tutorialsData: any[], lessonsData: any[]): Promise<void>;
  seedBadges(badgesData: any[]): Promise<void>;
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
}

export const storage = new DatabaseStorage();

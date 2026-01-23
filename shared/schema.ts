import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth & Chat models from integrations
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// --- GAMIFICATION & LEARNING ---

export const problems = pgTable("problems", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // 'Easy', 'Medium', 'Hard'
  category: text("category").notNull(), // 'Python', 'Web', 'Algorithms', 'Data Structures', 'SQL', 'JavaScript'
  language: text("language").notNull().default("python"), // Primary language
  starterCode: text("starter_code").notNull(),
  solution: text("solution"), // Reference solution
  hints: text("hints").array(), // Hints for the problem
  testCases: jsonb("test_cases").$type<{input: string, expected: string}[]>().notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  order: integer("order").notNull(), // For linear progression
});

// --- TUTORIALS (W3Schools/Codedex style) ---

export const tutorials = pgTable("tutorials", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'Python', 'HTML', 'CSS', 'JavaScript', 'SQL'
  difficulty: text("difficulty").notNull().default("Beginner"),
  imageUrl: text("image_url"),
  order: integer("order").notNull().default(0),
  lessonsCount: integer("lessons_count").default(0),
  xpReward: integer("xp_reward").default(500),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  tutorialId: integer("tutorial_id").notNull().references(() => tutorials.id),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown content
  codeExample: text("code_example"),
  language: text("language").default("python"),
  order: integer("order").notNull(),
  xpReward: integer("xp_reward").default(50),
});

export const userLessonProgress = pgTable("user_lesson_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
});

// --- Q&A DISCUSSIONS (StackOverflow style) ---

export const discussions = pgTable("discussions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  views: integer("views").default(0),
  upvotes: integer("upvotes").default(0),
  answersCount: integer("answers_count").default(0),
  isSolved: boolean("is_solved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull().references(() => discussions.id),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  targetType: text("target_type").notNull(), // 'discussion' or 'answer'
  targetId: integer("target_id").notNull(),
  value: integer("value").notNull(), // 1 for upvote, -1 for downvote
});

// --- BADGES & ACHIEVEMENTS ---

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Icon name from lucide
  color: text("color").notNull(), // Tailwind color class
  xpRequired: integer("xp_required"),
  problemsRequired: integer("problems_required"),
  category: text("category").notNull(), // 'achievement', 'skill', 'streak'
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// --- DAILY CHALLENGES ---

export const dailyChallenges = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  problemId: integer("problem_id").notNull().references(() => problems.id),
  date: timestamp("date").notNull(),
  bonusXp: integer("bonus_xp").default(50),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // References auth.users.id (which is varchar)
  problemId: integer("problem_id").notNull().references(() => problems.id),
  code: text("code").notNull(),
  status: text("status").notNull(), // 'Passed', 'Failed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  userId: text("user_id").primaryKey(), // References auth.users.id
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  streak: integer("streak").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  solvedCount: integer("solved_count").default(0),
});

export const hackathons = pgTable("hackathons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  platform: text("platform").notNull(), // 'Devpost', 'Hack2Skill', etc.
  imageUrl: text("image_url"),
  tags: text("tags").array(),
});

// --- CERTIFICATES ---

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tutorialId: integer("tutorial_id").references(() => tutorials.id),
  title: text("title").notNull(),
  description: text("description"),
  issuedAt: timestamp("issued_at").defaultNow(),
  certificateUrl: text("certificate_url"),
  certificateType: text("certificate_type").notNull().default("course"), // 'course', 'challenge', 'achievement'
});

// --- PROJECTS / PORTFOLIO ---

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  repoUrl: text("repo_url"),
  demoUrl: text("demo_url"),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  visibility: text("visibility").default("public"), // 'public', 'private', 'club_only'
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- MONTHLY CHALLENGES ---

export const monthlyChallenges = pgTable("monthly_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  month: text("month").notNull(), // Format: '2026-01'
  prize: text("prize"),
  prizeAmount: integer("prize_amount"),
  rules: text("rules"),
  imageUrl: text("image_url"),
  isClubOnly: boolean("is_club_only").default(false),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challengeSubmissions = pgTable("challenge_submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  challengeId: integer("challenge_id").notNull().references(() => monthlyChallenges.id),
  projectId: integer("project_id").references(() => projects.id),
  submissionUrl: text("submission_url"),
  description: text("description"),
  status: text("status").default("submitted"), // 'submitted', 'reviewed', 'winner', 'honorable_mention'
  rank: integer("rank"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- RELATIONS ---
export const submissionsRelations = relations(submissions, ({ one }) => ({
  problem: one(problems, {
    fields: [submissions.problemId],
    references: [problems.id],
  }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  tutorial: one(tutorials, {
    fields: [certificates.tutorialId],
    references: [tutorials.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  challengeSubmissions: many(challengeSubmissions),
}));

export const challengeSubmissionsRelations = relations(challengeSubmissions, ({ one }) => ({
  challenge: one(monthlyChallenges, {
    fields: [challengeSubmissions.challengeId],
    references: [monthlyChallenges.id],
  }),
  project: one(projects, {
    fields: [challengeSubmissions.projectId],
    references: [projects.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  tutorial: one(tutorials, {
    fields: [lessons.tutorialId],
    references: [tutorials.id],
  }),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  discussion: one(discussions, {
    fields: [answers.discussionId],
    references: [discussions.id],
  }),
}));

// --- SCHEMAS ---
export const insertProblemSchema = createInsertSchema(problems).omit({ id: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, createdAt: true });
export const insertHackathonSchema = createInsertSchema(hackathons).omit({ id: true });
export const insertTutorialSchema = createInsertSchema(tutorials).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertDiscussionSchema = createInsertSchema(discussions).omit({ id: true, createdAt: true, updatedAt: true, views: true, upvotes: true, answersCount: true, isSolved: true });
export const insertAnswerSchema = createInsertSchema(answers).omit({ id: true, createdAt: true, upvotes: true, isAccepted: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true, likes: true, views: true, featured: true });
export const insertMonthlyChallengeSchema = createInsertSchema(monthlyChallenges).omit({ id: true, createdAt: true });
export const insertChallengeSubmissionSchema = createInsertSchema(challengeSubmissions).omit({ id: true, createdAt: true, status: true, rank: true });

// --- TYPES ---
export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type Hackathon = typeof hackathons.$inferSelect;
export type Tutorial = typeof tutorials.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Discussion = typeof discussions.$inferSelect;
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type MonthlyChallenge = typeof monthlyChallenges.$inferSelect;
export type InsertMonthlyChallenge = z.infer<typeof insertMonthlyChallengeSchema>;
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type InsertChallengeSubmission = z.infer<typeof insertChallengeSubmissionSchema>;

// --- API TYPES ---
export type ProblemResponse = Problem & { isSolved?: boolean };
export type SubmitCodeRequest = { code: string; language: string };
export type SubmitCodeResponse = { 
  success: boolean; 
  output: string; 
  passed: boolean; 
  xpEarned?: number;
  nextProblemSlug?: string; 
};
export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  xp: number;
  level: number;
  solvedCount: number;
  badgeCount: number;
};
export type DiscussionWithAuthor = Discussion & { 
  authorName: string;
  authorAvatar?: string;
};

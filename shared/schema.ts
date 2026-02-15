import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey, real } from "drizzle-orm/pg-core";
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
  content: text("content"), // Rich markdown content for the tutorial overview
  category: text("category").notNull(), // 'Python', 'HTML', 'CSS', 'JavaScript', 'SQL'
  difficulty: text("difficulty").notNull().default("Beginner"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"), // Video content support
  videoThumbnail: text("video_thumbnail"), // Video thumbnail URL
  videoDuration: text("video_duration"), // Video duration (e.g., "15:30")
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
  hostOrgId: integer("host_org_id"),
  registrationDeadline: timestamp("registration_deadline"),
  maxParticipants: integer("max_participants"),
  prizePool: text("prize_pool"),
  rules: text("rules"),
  judgingCriteria: text("judging_criteria"),
  status: text("status").default("listed"), // 'listed', 'open', 'in_progress', 'judging', 'completed'
  visibility: text("visibility").default("public"), // 'public', 'private', 'organization'
  hostedOnPlatform: boolean("hosted_on_platform").default(false),
  createdBy: text("created_by"),
});

// Tutorial-Hackathon junction table for project-based learning
export const hackathonTutorials = pgTable("hackathon_tutorials", {
  id: serial("id").primaryKey(),
  hackathonId: integer("hackathon_id").notNull().references(() => hackathons.id),
  tutorialId: integer("tutorial_id").notNull().references(() => tutorials.id),
  relevance: text("relevance").default("recommended"), // 'required', 'recommended', 'optional'
  order: integer("order").default(0), // Order in which tutorials should be completed
  createdAt: timestamp("created_at").defaultNow(),
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

// --- ORGANIZATIONS ---

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  website: text("website"),
  industry: text("industry"),
  countryCode: text("country_code"),
  ownerUserId: text("owner_user_id").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizationMembers = pgTable("organization_members", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("member"), // 'owner', 'admin', 'judge', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// --- HACKATHON HOSTING ---

export const hackathonRegistrations = pgTable("hackathon_registrations", {
  id: serial("id").primaryKey(),
  hackathonId: integer("hackathon_id").notNull().references(() => hackathons.id),
  userId: text("user_id").notNull(),
  teamId: integer("team_id"),
  status: text("status").default("registered"), // 'registered', 'confirmed', 'withdrawn'
  registeredAt: timestamp("registered_at").defaultNow(),
});

export const hackathonTeams = pgTable("hackathon_teams", {
  id: serial("id").primaryKey(),
  hackathonId: integer("hackathon_id").notNull().references(() => hackathons.id),
  name: text("name").notNull(),
  captainUserId: text("captain_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => hackathonTeams.id),
  userId: text("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const hackathonSubmissions = pgTable("hackathon_submissions", {
  id: serial("id").primaryKey(),
  hackathonId: integer("hackathon_id").notNull().references(() => hackathons.id),
  userId: text("user_id").notNull(),
  teamId: integer("team_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  repoUrl: text("repo_url"),
  demoUrl: text("demo_url"),
  videoUrl: text("video_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  score: integer("score"),
  rank: integer("rank"),
  status: text("status").default("submitted"), // 'submitted', 'reviewed', 'winner', 'disqualified'
});

export const judgingCriteria = pgTable("judging_criteria", {
  id: serial("id").primaryKey(),
  hackathonId: integer("hackathon_id").notNull().references(() => hackathons.id),
  name: text("name").notNull(),
  description: text("description"),
  weight: integer("weight").notNull().default(1), // e.g. 1-10 importance
  maxScore: integer("max_score").notNull().default(10),
});

export const judgingScores = pgTable("judging_scores", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull().references(() => hackathonSubmissions.id),
  judgeUserId: text("judge_user_id").notNull(),
  criterionId: integer("criterion_id").notNull().references(() => judgingCriteria.id),
  score: integer("score").notNull(),
  comment: text("comment"),
  scoredAt: timestamp("scored_at").defaultNow(),
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

export const tutorialsRelations = relations(tutorials, ({ many }) => ({
  lessons: many(lessons),
  hackathonTutorials: many(hackathonTutorials),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  discussion: one(discussions, {
    fields: [answers.discussionId],
    references: [discussions.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
}));

export const hackathonRegistrationsRelations = relations(hackathonRegistrations, ({ one }) => ({
  hackathon: one(hackathons, {
    fields: [hackathonRegistrations.hackathonId],
    references: [hackathons.id],
  }),
}));

export const hackathonsRelations = relations(hackathons, ({ many }) => ({
  registrations: many(hackathonRegistrations),
  teams: many(hackathonTeams),
  submissions: many(hackathonSubmissions),
  judgingCriteria: many(judgingCriteria),
  hackathonTutorials: many(hackathonTutorials),
}));

export const hackathonTeamsRelations = relations(hackathonTeams, ({ one, many }) => ({
  hackathon: one(hackathons, {
    fields: [hackathonTeams.hackathonId],
    references: [hackathons.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(hackathonTeams, {
    fields: [teamMembers.teamId],
    references: [hackathonTeams.id],
  }),
}));

export const hackathonSubmissionsRelations = relations(hackathonSubmissions, ({ one, many }) => ({
  hackathon: one(hackathons, {
    fields: [hackathonSubmissions.hackathonId],
    references: [hackathons.id],
  }),
  scores: many(judgingScores),
}));

export const hackathonTutorialsRelations = relations(hackathonTutorials, ({ one }) => ({
  hackathon: one(hackathons, {
    fields: [hackathonTutorials.hackathonId],
    references: [hackathons.id],
  }),
  tutorial: one(tutorials, {
    fields: [hackathonTutorials.tutorialId],
    references: [tutorials.id],
  }),
}));

export const judgingCriteriaRelations = relations(judgingCriteria, ({ one }) => ({
  hackathon: one(hackathons, {
    fields: [judgingCriteria.hackathonId],
    references: [hackathons.id],
  }),
}));

export const judgingScoresRelations = relations(judgingScores, ({ one }) => ({
  submission: one(hackathonSubmissions, {
    fields: [judgingScores.submissionId],
    references: [hackathonSubmissions.id],
  }),
  criterion: one(judgingCriteria, {
    fields: [judgingScores.criterionId],
    references: [judgingCriteria.id],
  }),
}));

// --- CMS (Content Management System) ---

export const cmsContent = pgTable("cms_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  contentType: text("content_type").notNull().default("tutorial"),
  templateType: text("template_type").notNull().default("standard_tutorial"),
  contentJson: jsonb("content_json").$type<{
    version: string;
    sections: Array<{
      id: string;
      type: string;
      content?: string;
      language?: string;
      code?: string;
      runnable?: boolean;
      expectedOutput?: string;
      explanation?: string;
      url?: string;
      alt?: string;
      caption?: string;
      question?: string;
      questionType?: string;
      options?: string[];
      correctAnswer?: number;
      starterCode?: string;
      solution?: string;
      instructions?: string;
      testCases?: Array<{ description: string; test: string }>;
    }>;
  }>().notNull(),
  category: text("category").notNull().default("web-development"),
  subCategory: text("sub_category"),
  tags: text("tags").array(),
  difficultyLevel: text("difficulty_level").notNull().default("beginner"),
  estimatedMinutes: integer("estimated_minutes"),
  status: text("status").notNull().default("draft"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  isPremium: boolean("is_premium").default(false),
  authorId: text("author_id").notNull(),
  lastChecked: timestamp("last_checked"),
  healthStatus: text("health_status").default("healthy"),
  brokenLinks: integer("broken_links").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentVersions = pgTable("content_versions", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => cmsContent.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  contentJson: jsonb("content_json").notNull(),
  changeLog: text("change_log"),
  createdById: text("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentAnalytics = pgTable("content_analytics", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => cmsContent.id, { onDelete: "cascade" }),
  views: integer("views").default(0),
  completions: integer("completions").default(0),
  averageRating: real("average_rating"),
  averageTimeSpent: integer("average_time_spent"),
  dropOffRate: real("drop_off_rate"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- SELF-HEALING & MONITORING ---

export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  severity: text("severity").notNull().default("low"),
  context: jsonb("context"),
  isResolved: boolean("is_resolved").default(false),
  autoFixed: boolean("auto_fixed").default(false),
  fixApplied: text("fix_applied"),
  occurrences: integer("occurrences").default(1),
  firstOccurred: timestamp("first_occurred").defaultNow(),
  lastOccurred: timestamp("last_occurred").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const autoFixLogs = pgTable("auto_fix_logs", {
  id: serial("id").primaryKey(),
  fixType: text("fix_type").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  description: text("description").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  successful: boolean("successful").notNull(),
  executedAt: timestamp("executed_at").defaultNow(),
});

// --- CMS RELATIONS ---

export const cmsContentRelations = relations(cmsContent, ({ many }) => ({
  versions: many(contentVersions),
}));

export const contentVersionsRelations = relations(contentVersions, ({ one }) => ({
  content: one(cmsContent, {
    fields: [contentVersions.contentId],
    references: [cmsContent.id],
  }),
}));

export const contentAnalyticsRelations = relations(contentAnalytics, ({ one }) => ({
  content: one(cmsContent, {
    fields: [contentAnalytics.contentId],
    references: [cmsContent.id],
  }),
}));

// --- SCHEMAS ---
export const insertCmsContentSchema = createInsertSchema(cmsContent).omit({ id: true, createdAt: true, updatedAt: true, lastChecked: true, brokenLinks: true, healthStatus: true, publishedAt: true });
export const insertContentVersionSchema = createInsertSchema(contentVersions).omit({ id: true, createdAt: true });
export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({ id: true, firstOccurred: true, lastOccurred: true, resolvedAt: true, isResolved: true, autoFixed: true, fixApplied: true, occurrences: true });
export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({ id: true, timestamp: true });
export const insertAutoFixLogSchema = createInsertSchema(autoFixLogs).omit({ id: true, executedAt: true });

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
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, verified: true });
export const insertOrgMemberSchema = createInsertSchema(organizationMembers).omit({ id: true, joinedAt: true });
export const insertHackathonRegistrationSchema = createInsertSchema(hackathonRegistrations).omit({ id: true, registeredAt: true });
export const insertHackathonTeamSchema = createInsertSchema(hackathonTeams).omit({ id: true, createdAt: true });
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({ id: true, joinedAt: true });
export const insertHackathonSubmissionSchema = createInsertSchema(hackathonSubmissions).omit({ id: true, submittedAt: true, score: true, rank: true, status: true });
export const insertJudgingCriterionSchema = createInsertSchema(judgingCriteria).omit({ id: true });
export const insertJudgingScoreSchema = createInsertSchema(judgingScores).omit({ id: true, scoredAt: true });
export const insertHackathonTutorialSchema = createInsertSchema(hackathonTutorials).omit({ id: true, createdAt: true });

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
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrgMember = z.infer<typeof insertOrgMemberSchema>;
export type HackathonRegistration = typeof hackathonRegistrations.$inferSelect;
export type InsertHackathonRegistration = z.infer<typeof insertHackathonRegistrationSchema>;
export type HackathonTeam = typeof hackathonTeams.$inferSelect;
export type InsertHackathonTeam = z.infer<typeof insertHackathonTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type HackathonSubmission = typeof hackathonSubmissions.$inferSelect;
export type InsertHackathonSubmission = z.infer<typeof insertHackathonSubmissionSchema>;
export type JudgingCriterion = typeof judgingCriteria.$inferSelect;
export type InsertJudgingCriterion = z.infer<typeof insertJudgingCriterionSchema>;
export type HackathonTutorial = typeof hackathonTutorials.$inferSelect;
export type InsertHackathonTutorial = z.infer<typeof insertHackathonTutorialSchema>;
export type JudgingScore = typeof judgingScores.$inferSelect;
export type InsertJudgingScore = z.infer<typeof insertJudgingScoreSchema>;

export type CmsContent = typeof cmsContent.$inferSelect;
export type InsertCmsContent = z.infer<typeof insertCmsContentSchema>;
export type ContentVersion = typeof contentVersions.$inferSelect;
export type InsertContentVersion = z.infer<typeof insertContentVersionSchema>;
export type ContentAnalyticsRow = typeof contentAnalytics.$inferSelect;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type AutoFixLog = typeof autoFixLogs.$inferSelect;
export type InsertAutoFixLog = z.infer<typeof insertAutoFixLogSchema>;

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

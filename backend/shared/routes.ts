import { z } from 'zod';
import { 
  insertProblemSchema, insertSubmissionSchema, insertHackathonSchema, 
  insertDiscussionSchema, insertAnswerSchema,
  problems, hackathons, userProgress, tutorials, discussions, badges, lessons
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  problems: {
    list: {
      method: 'GET' as const,
      path: '/api/problems',
      input: z.object({ 
        category: z.string().optional(),
        difficulty: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof problems.$inferSelect & { isSolved?: boolean }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/problems/:slug',
      responses: {
        200: z.custom<typeof problems.$inferSelect & { isSolved?: boolean }>(),
        404: errorSchemas.notFound,
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/problems/:id/submit',
      input: z.object({ code: z.string(), language: z.string() }),
      responses: {
        200: z.object({
          success: z.boolean(),
          output: z.string(),
          passed: z.boolean(),
          xpEarned: z.number().optional(),
          nextProblemSlug: z.string().optional()
        }),
        404: errorSchemas.notFound,
      },
    },
    daily: {
      method: 'GET' as const,
      path: '/api/problems/daily',
      responses: {
        200: z.custom<typeof problems.$inferSelect & { bonusXp: number }>(),
      },
    },
  },
  tutorials: {
    list: {
      method: 'GET' as const,
      path: '/api/tutorials',
      responses: {
        200: z.array(z.custom<typeof tutorials.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tutorials/:slug',
      responses: {
        200: z.custom<typeof tutorials.$inferSelect & { lessons: typeof lessons.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    lesson: {
      method: 'GET' as const,
      path: '/api/tutorials/:tutorialSlug/lessons/:lessonSlug',
      responses: {
        200: z.custom<typeof lessons.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    completeLesson: {
      method: 'POST' as const,
      path: '/api/lessons/:id/complete',
      responses: {
        200: z.object({ success: z.boolean(), xpEarned: z.number() }),
      },
    },
  },
  discussions: {
    list: {
      method: 'GET' as const,
      path: '/api/discussions',
      responses: {
        200: z.array(z.custom<typeof discussions.$inferSelect & { authorName: string }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/discussions/:id',
      responses: {
        200: z.custom<typeof discussions.$inferSelect & { authorName: string; answers: any[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/discussions',
      input: insertDiscussionSchema,
      responses: {
        200: z.custom<typeof discussions.$inferSelect>(),
      },
    },
    answer: {
      method: 'POST' as const,
      path: '/api/discussions/:id/answers',
      input: z.object({ content: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    vote: {
      method: 'POST' as const,
      path: '/api/discussions/:id/vote',
      input: z.object({ value: z.number() }),
      responses: {
        200: z.object({ success: z.boolean(), newCount: z.number() }),
      },
    },
  },
  leaderboard: {
    list: {
      method: 'GET' as const,
      path: '/api/leaderboard',
      responses: {
        200: z.array(z.object({
          rank: z.number(),
          userId: z.string(),
          username: z.string(),
          xp: z.number(),
          level: z.number(),
          solvedCount: z.number(),
          badgeCount: z.number(),
        })),
      },
    },
  },
  badges: {
    list: {
      method: 'GET' as const,
      path: '/api/badges',
      responses: {
        200: z.array(z.custom<typeof badges.$inferSelect>()),
      },
    },
    userBadges: {
      method: 'GET' as const,
      path: '/api/user/badges',
      responses: {
        200: z.array(z.custom<typeof badges.$inferSelect & { earnedAt: Date }>()),
      },
    },
  },
  hackathons: {
    list: {
      method: 'GET' as const,
      path: '/api/hackathons',
      responses: {
        200: z.array(z.custom<typeof hackathons.$inferSelect>()),
      },
    },
  },
  user: {
    stats: {
      method: 'GET' as const,
      path: '/api/user/stats',
      responses: {
        200: z.custom<typeof userProgress.$inferSelect>(),
        401: errorSchemas.internal,
      },
    },
    profile: {
      method: 'GET' as const,
      path: '/api/user/profile/:userId',
      responses: {
        200: z.object({
          userId: z.string(),
          username: z.string(),
          xp: z.number(),
          level: z.number(),
          solvedCount: z.number(),
          streak: z.number(),
          badges: z.array(z.any()),
          joinedAt: z.string().optional(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

# Skillsyncc (Powered by Bluecoderhub)

## Overview
Skillsyncc is a gamified ed-tech platform inspired by Codedex.io, combining features from HackerEarth, HackerRank, LeetCode, StackOverflow, and W3Schools. The platform features a retro-futuristic gaming aesthetic with XP-based progression. Powered by Bluecoderhub.

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: TailwindCSS with custom retro-gaming theme
- **Authentication**: Replit Auth (OIDC - supports Google, GitHub, Apple, email)
- **AI**: Replit AI Integrations (OpenAI gpt-5 models - no API key required)
- **Code Editor**: Monaco Editor (@monaco-editor/react)

## Key Features
1. **Gamified Learning**: XP, levels, streaks, and quests
2. **Code Quests**: Interactive coding challenges with instant feedback
3. **Built-in IDE**: Monaco-powered code editor
4. **AI Companion**: Chat widget powered by OpenAI
5. **Hackathon Tracker**: Global hackathon listings
6. **User Progress**: XP tracking, level progression
7. **Club Membership**: Premium subscription tier with Stripe payments
8. **Certificates**: Verifiable course completion certificates (Club-only)
9. **Portfolio Hosting**: Showcase projects with public profiles (Club-only)
10. **Monthly Challenges**: Competitive coding challenges with prizes (Club-only)
11. **Organization System**: Create/manage organizations with role-based access (owner/admin/judge/member)
12. **Hackathon Hosting**: Organizations can create/manage hackathons with registration, teams, submissions, judging
13. **CMS**: Content Management System for creating tutorials with text, code, quiz, image, and interactive code sections
14. **Self-Healing/Monitoring**: Error logging middleware, health checks (CPU, memory, DB), admin monitoring dashboard

## Project Structure
```
├── client/                  # Frontend React app
│   ├── src/
│   │   ├── components/     # UI components (Navigation, ChatWidget, etc.)
│   │   ├── pages/          # Route pages (Dashboard, Quests, IDE, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities
│   │   └── replit_integrations/  # Audio/voice integrations
│   └── public/             # Static assets
├── server/                  # Backend Express app
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database operations
│   ├── db.ts               # Database connection
│   └── replit_integrations/ # Auth, Chat, Audio, Image modules
├── shared/                  # Shared types and schemas
│   ├── schema.ts           # Drizzle database schemas
│   ├── routes.ts           # API contract definitions
│   └── models/             # Auth and Chat models
```

## API Endpoints
- `GET /api/problems` - List all coding problems
- `GET /api/problems/:slug` - Get problem details
- `POST /api/problems/:id/submit` - Submit code solution
- `GET /api/user/stats` - Get user progress (XP, level, streak)
- `GET /api/hackathons` - List hackathons
- `GET /api/auth/user` - Get current user
- `/api/login` - Login flow
- `/api/logout` - Logout flow

### Club Premium Endpoints (requires active Club membership)
- `GET /api/certificates` - Get user's certificates
- `POST /api/certificates` - Issue a certificate for completed course
- `GET /api/portfolio` - Get user's portfolio projects
- `POST /api/portfolio` - Create new project
- `PATCH /api/portfolio/:id` - Update project
- `DELETE /api/portfolio/:id` - Delete project
- `GET /api/challenges` - List monthly challenges (public)
- `GET /api/challenges/:id` - Get challenge details (public)
- `POST /api/challenges/:id/submit` - Submit to challenge (Club-only)

### Stripe Endpoints
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `GET /api/subscription` - Get user's subscription status
- `POST /api/stripe/portal` - Create Stripe customer portal session

### Organization Endpoints
- `GET /api/organizations` - Get user's organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `POST /api/organizations/:id/members` - Add member
- `DELETE /api/organizations/:id/members/:userId` - Remove member
- `PATCH /api/organizations/:id/members/:userId/role` - Update member role

### Hackathon Hosting Endpoints
- `GET /api/hosted-hackathons` - List all hosted hackathons
- `POST /api/organizations/:orgId/hackathons` - Create hackathon
- `GET /api/hackathons/:id/details` - Get hackathon details
- `PUT /api/hackathons/:id` - Update hackathon
- `POST /api/hackathons/:id/register` - Register for hackathon
- `DELETE /api/hackathons/:id/register` - Withdraw registration
- `POST /api/hackathons/:id/teams` - Create team
- `POST /api/hackathons/:id/teams/:teamId/join` - Join team
- `POST /api/hackathons/:id/submissions` - Submit project
- `POST /api/hackathons/:id/criteria` - Add judging criteria
- `POST /api/hackathons/:id/scores` - Submit scores

### CMS Content Endpoints
- `GET /api/cms/content` - List all CMS content (with filters)
- `GET /api/cms/published` - List published content
- `GET /api/cms/content/:id` - Get content by ID
- `GET /api/cms/content/slug/:slug` - Get content by slug
- `POST /api/cms/content` - Create new content
- `PATCH /api/cms/content/:id` - Update content (with auto-save support)
- `POST /api/cms/content/:id/publish` - Publish content
- `DELETE /api/cms/content/:id` - Delete content
- `GET /api/cms/content/:id/versions` - Get version history
- `POST /api/cms/content/:id/restore/:versionNumber` - Restore version
- `GET /api/cms/content/:id/analytics` - Get content analytics
- `POST /api/cms/content/:id/complete` - Mark content as completed

### Health & Monitoring Endpoints
- `GET /api/health` - System health check (CPU, memory, DB status)
- `GET /api/monitoring/errors` - Get error logs
- `GET /api/monitoring/error-stats` - Get error statistics
- `POST /api/monitoring/errors/:id/resolve` - Resolve an error
- `GET /api/monitoring/metrics/:type` - Get system metrics
- `GET /api/monitoring/auto-fixes` - Get auto-fix logs

## Database Tables
- `users` - User accounts (Replit Auth) with Stripe/membership fields
- `sessions` - Session storage
- `problems` - Coding challenges
- `submissions` - User code submissions
- `user_progress` - XP, levels, streaks
- `hackathons` - Hackathon listings (external)
- `conversations` - AI chat conversations
- `messages` - AI chat messages
- `certificates` - Course completion certificates (Club)
- `projects` - Portfolio projects (Club)
- `monthly_challenges` - Monthly coding challenges (Club)
- `challenge_submissions` - User submissions for challenges
- `organizations` - Organization profiles
- `organization_members` - Org membership with roles
- `hosted_hackathons` - Platform-hosted hackathons
- `hackathon_registrations` - User registrations for hackathons
- `hackathon_teams` - Teams within hackathons
- `hackathon_team_members` - Team membership
- `hackathon_submissions` - Project submissions
- `judging_criteria` - Scoring criteria
- `judging_scores` - Judge scores per submission
- `cms_content` - CMS managed content (tutorials, guides, etc.)
- `content_versions` - Version history for CMS content
- `content_analytics` - Views and completions tracking
- `error_logs` - Application error tracking
- `system_metrics` - CPU, memory, and other system metrics
- `auto_fix_logs` - Automated fix action logs

## Design Theme
- **Colors**: Deep space blue backgrounds, neon purple/green/pink accents
- **Typography**: 'Press Start 2P' for headers (retro gaming), 'Inter' for body
- **Components**: Pixel-art inspired cards with drop shadows
- **Dark mode by default** with gradient backgrounds

## Recent Changes (Feb 2026)
- **CMS System**: Content Management System with section-based editor (text, code, quiz, image, interactive code)
- **Content Editor**: Admin page for creating/editing educational content with auto-save, live preview, version history
- **Content Viewer**: Public page for viewing published tutorials with interactive code playground and quizzes
- **Self-Healing/Monitoring**: Error logging middleware, health checks, admin monitoring dashboard
- **Admin CMS Tab**: Content management with publish/edit/delete actions
- **Admin Monitoring Tab**: System health, CPU/memory usage, error logs with resolution tracking
- 6 new database tables: cms_content, content_versions, content_analytics, error_logs, system_metrics, auto_fix_logs
- 30+ new storage layer methods and 20+ new API endpoints
- **Organization System**: Create/manage organizations with role-based access (owner/admin/judge/member)
- **Hackathon Hosting**: Organizations can create and manage hackathons with registration, teams, submissions, judging
- **Admin Panel**: Added Organizations and Hosted Hackathons management tabs
- **Navigation**: Added Organizations icon to top nav bar
- **Hackathons Page**: Split into Platform Hackathons and External Events tabs
- **HackathonDetail Page**: Full hackathon view with Overview/Teams/Submissions tabs
- **CreateHackathon Page**: Form for organizations to create hackathons
- 9 new database tables for organizations and hackathon hosting
- 40+ storage layer methods for all organization and hackathon CRUD operations

## Previous Changes (Jan 2026)
- Added Tutorials/Learn page with structured courses (W3Schools/Codedex style)
- Added Q&A Community/Discussions page (StackOverflow-style voting and answers)
- Added Leaderboard page with global rankings
- Added User Profile page with badges and achievements
- Enhanced IDE with 8 programming language support (Python, JavaScript, TypeScript, HTML, CSS, SQL, Java, C++)
- Enhanced Quests page with filtering by category/difficulty and search
- Added Daily Challenge feature to Dashboard
- Updated Navigation with all new sections
- **Club Membership System**: Stripe-powered subscriptions ($9.99/month, $79.99/year)
- **Certificates Page**: View/download earned certificates (Club-only)
- **Portfolio Page**: Create and showcase projects (Club-only)
- **Monthly Challenges**: Competitive challenges with prizes (Club-only)
- **Success Stories**: Landing page testimonials section
- **Server-side Authorization**: isClubMember middleware for premium routes

## Development Commands
- `npm run dev` - Start development server
- `npm run db:push` - Push database schema changes
- `npm run build` - Build for production

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Auto-configured by Replit
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Auto-configured by Replit

## Contact
- Email: connect@bluecoderhub.com

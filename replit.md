# BlueCoderHub

## Overview
BlueCoderHub is a gamified ed-tech platform inspired by Codedex.io, combining features from HackerEarth, HackerRank, LeetCode, StackOverflow, and W3Schools. The platform features a retro-futuristic gaming aesthetic with XP-based progression.

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

## Database Tables
- `users` - User accounts (Replit Auth) with Stripe/membership fields
- `sessions` - Session storage
- `problems` - Coding challenges
- `submissions` - User code submissions
- `user_progress` - XP, levels, streaks
- `hackathons` - Hackathon listings
- `conversations` - AI chat conversations
- `messages` - AI chat messages
- `certificates` - Course completion certificates (Club)
- `projects` - Portfolio projects (Club)
- `monthly_challenges` - Monthly coding challenges (Club)
- `challenge_submissions` - User submissions for challenges

## Design Theme
- **Colors**: Deep space blue backgrounds, neon purple/green/pink accents
- **Typography**: 'Press Start 2P' for headers (retro gaming), 'Inter' for body
- **Components**: Pixel-art inspired cards with drop shadows
- **Dark mode by default** with gradient backgrounds

## Recent Changes (Jan 2026)
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

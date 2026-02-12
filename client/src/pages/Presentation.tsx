import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, Maximize2, Monitor,
  Code2, Swords, BookOpen, Trophy, Users, MessageSquare,
  Award, Crown, Shield, Building2, Cpu, FileText,
  Zap, Target, Star, Globe, CreditCard, BarChart3,
  Lock, Heart, Layers, Terminal, Rocket, Brain,
  GraduationCap, Briefcase, Calendar, Gift, Eye,
  Database, Server, Activity, Settings, Download
} from "lucide-react";
import logoImage from "@assets/full_margin_white_base_1770730873164.png";

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  bgClass?: string;
}

function SlideCounter({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-mono">{String(current).padStart(2, "0")}</span>
      <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <span className="font-mono">{String(total).padStart(2, "0")}</span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4 flex gap-3 items-start">
        <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-md bg-muted/50">
      <Icon className="w-6 h-6 text-primary" />
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: "title",
      title: "BlueCoderHub",
      content: (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
          <img src={logoImage} alt="BlueCoderHub" className="w-28 h-28 rounded-2xl shadow-lg" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">BlueCoderHub</h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              A Gamified Ed-Tech Platform for the Next Generation of Developers
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <Badge variant="secondary">Gamified Learning</Badge>
            <Badge variant="secondary">Code Challenges</Badge>
            <Badge variant="secondary">Hackathons</Badge>
            <Badge variant="secondary">Community</Badge>
            <Badge variant="secondary">AI-Powered</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Combining the best of Codedex, HackerRank, LeetCode, StackOverflow & W3Schools
          </p>
        </div>
      ),
    },
    {
      id: "overview",
      title: "Platform Overview",
      content: (
        <div className="flex flex-col gap-6 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Platform Overview</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              A comprehensive platform that transforms coding education into an engaging, game-like experience
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox value="27+" label="Pages & Views" icon={Monitor} />
            <StatBox value="100+" label="API Endpoints" icon={Server} />
            <StatBox value="20+" label="Database Tables" icon={Database} />
            <StatBox value="8" label="Languages Supported" icon={Code2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <GraduationCap className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Learn</h4>
                <p className="text-xs text-muted-foreground mt-1">Structured tutorials, courses, and interactive lessons</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Swords className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Practice</h4>
                <p className="text-xs text-muted-foreground mt-1">Code quests, daily challenges, and a built-in IDE</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Compete</h4>
                <p className="text-xs text-muted-foreground mt-1">Hackathons, leaderboards, and monthly challenges</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: "tech-stack",
      title: "Tech Stack",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Technology Stack</h2>
            <p className="text-muted-foreground text-sm">Modern, scalable architecture built for performance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={Monitor} title="Frontend" description="React 19 + Vite + TypeScript with TailwindCSS, Framer Motion animations, and shadcn/ui component library" />
            <FeatureCard icon={Server} title="Backend" description="Express.js on Node.js with type-safe API contracts, middleware chains, and session management" />
            <FeatureCard icon={Database} title="Database" description="PostgreSQL with Drizzle ORM, 20+ tables, relational schemas with foreign keys and indexes" />
            <FeatureCard icon={Lock} title="Authentication" description="Replit Auth (OIDC) supporting Google, GitHub, Apple, and email login with session persistence" />
            <FeatureCard icon={Brain} title="AI Integration" description="OpenAI GPT models via Replit AI Integrations for an intelligent chat companion and code help" />
            <FeatureCard icon={CreditCard} title="Payments" description="Stripe integration for Club membership subscriptions with webhooks and customer portal" />
            <FeatureCard icon={Code2} title="Code Editor" description="Monaco Editor (VS Code engine) with syntax highlighting for 8+ languages" />
            <FeatureCard icon={Layers} title="Design System" description="Retro-futuristic gaming aesthetic with 'Press Start 2P' headers, neon accents, dark theme" />
          </div>
        </div>
      ),
    },
    {
      id: "gamification",
      title: "Gamification System",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Gamification & XP System</h2>
            <p className="text-muted-foreground text-sm">Every action earns XP, driving engagement through game mechanics</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={Zap} title="XP & Leveling" description="Earn XP from solving problems, completing tutorials, and daily challenges. Level up as you progress." />
            <FeatureCard icon={Target} title="Daily Challenges" description="A new coding challenge every day with bonus XP rewards to build consistency." />
            <FeatureCard icon={Star} title="Streak System" description="Track consecutive days of activity. Longer streaks unlock achievements and bonus rewards." />
            <FeatureCard icon={Award} title="Badges & Achievements" description="Earn badges for milestones: First Solve, 10 Problems, XP Master, Streak Champion, and more." />
            <FeatureCard icon={Crown} title="Leaderboard" description="Global rankings by XP, problems solved, and level. Compete with the community for the top spot." />
            <FeatureCard icon={BarChart3} title="Progress Dashboard" description="Personalized dashboard showing level progress bar, stats, recent activity, and quick actions." />
          </div>
        </div>
      ),
    },
    {
      id: "code-quests",
      title: "Code Quests",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Code Quests</h2>
            <p className="text-muted-foreground text-sm">Interactive coding challenges with instant feedback and XP rewards</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={Swords} title="Challenge Library" description="Growing collection of problems across Python, JavaScript, HTML/CSS, SQL, Algorithms, and Data Structures." />
            <FeatureCard icon={Terminal} title="Monaco Code Editor" description="Full-featured code editor with syntax highlighting, auto-completion, and multi-language support." />
            <FeatureCard icon={Target} title="Difficulty Levels" description="Easy, Medium, and Hard problems with category filtering and search functionality." />
            <FeatureCard icon={Zap} title="Instant Feedback" description="Submit code and get immediate pass/fail results with test case validation." />
            <FeatureCard icon={Star} title="XP Rewards" description="Each problem awards XP based on difficulty. Bonus XP for daily challenge completions." />
            <FeatureCard icon={BookOpen} title="Hints & Solutions" description="Stuck? Access progressive hints and reference solutions to learn from." />
          </div>
        </div>
      ),
    },
    {
      id: "ide",
      title: "Built-in IDE",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Built-in IDE (Practice Mode)</h2>
            <p className="text-muted-foreground text-sm">A full coding playground right in your browser</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={Code2} title="8 Languages" description="Python, JavaScript, TypeScript, HTML, CSS, SQL, Java, and C++ with dedicated templates." />
            <FeatureCard icon={Terminal} title="Monaco Editor" description="Powered by the same editor engine as VS Code with IntelliSense and code folding." />
            <FeatureCard icon={Settings} title="Customizable" description="Adjust theme, font size, tab size, and editor settings to your preference." />
            <FeatureCard icon={Download} title="Save & Export" description="Download your code files and save your work for later reference." />
          </div>
          <Card className="mt-2">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">Supported Languages</h4>
              <div className="flex flex-wrap gap-2">
                {["Python", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "Java", "C++"].map(lang => (
                  <Badge key={lang} variant="outline">{lang}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "tutorials",
      title: "Tutorials & CMS",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Tutorials & Content Management</h2>
            <p className="text-muted-foreground text-sm">Structured learning paths with a powerful CMS for content creation</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={BookOpen} title="Structured Courses" description="W3Schools/Codedex-style tutorials with ordered lessons, code examples, and progress tracking." />
            <FeatureCard icon={FileText} title="CMS Editor" description="Admin content editor with section types: Text (Markdown), Code, Quiz, Image, and Interactive Code." />
            <FeatureCard icon={Eye} title="Content Viewer" description="Beautiful public viewer with interactive code playground, quizzes, and completion tracking." />
            <FeatureCard icon={Layers} title="Version History" description="Every edit creates a version. Restore any previous version with one click." />
            <FeatureCard icon={Activity} title="Content Analytics" description="Track views, completions, and engagement metrics for every piece of content." />
            <FeatureCard icon={Settings} title="Auto-Save" description="Content auto-saves every 30 seconds. Manual save creates a named version snapshot." />
          </div>
        </div>
      ),
    },
    {
      id: "hackathons",
      title: "Hackathon System",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Hackathon Hosting & Tracking</h2>
            <p className="text-muted-foreground text-sm">Host your own hackathons or browse external events</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={Trophy} title="Platform Hackathons" description="Organizations can create and host hackathons directly on the platform with full management tools." />
            <FeatureCard icon={Globe} title="External Events" description="Browse and track hackathons from Devpost, HackerEarth, MLH, and other platforms." />
            <FeatureCard icon={Users} title="Team Formation" description="Create teams, invite members, and collaborate on hackathon projects together." />
            <FeatureCard icon={Rocket} title="Submissions" description="Submit projects with descriptions, repo links, and demo URLs for judging." />
            <FeatureCard icon={BarChart3} title="Judging System" description="Customizable judging criteria with weighted scoring by designated judges." />
            <FeatureCard icon={Calendar} title="Event Management" description="Full lifecycle: registration, team formation, submissions, judging, and winners." />
          </div>
        </div>
      ),
    },
    {
      id: "community",
      title: "Community Features",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Community & Discussions</h2>
            <p className="text-muted-foreground text-sm">StackOverflow-style Q&A with voting and accepted answers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={MessageSquare} title="Discussion Forum" description="Ask questions, share knowledge, and get help from the community with tagged discussions." />
            <FeatureCard icon={Heart} title="Voting System" description="Upvote helpful questions and answers. Community-driven quality signals." />
            <FeatureCard icon={Award} title="Accepted Answers" description="Question authors can mark the best answer as accepted, helping future learners." />
            <FeatureCard icon={Eye} title="View Tracking" description="Track discussion views and engagement to surface popular topics." />
            <FeatureCard icon={Brain} title="AI Chat Companion" description="Built-in AI assistant powered by OpenAI for instant code help and explanations." />
            <FeatureCard icon={Users} title="User Profiles" description="View stats, badges, achievements, and contribution history for any user." />
          </div>
        </div>
      ),
    },
    {
      id: "organizations",
      title: "Organizations",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Organization System</h2>
            <p className="text-muted-foreground text-sm">Create and manage organizations with role-based access</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={Building2} title="Create Organizations" description="Set up your company, university, or coding club with branding, description, and website links." />
            <FeatureCard icon={Shield} title="Role-Based Access" description="Four roles: Owner, Admin, Judge, and Member with granular permission controls." />
            <FeatureCard icon={Users} title="Member Management" description="Add/remove members, change roles, and view the full membership roster." />
            <FeatureCard icon={Trophy} title="Host Hackathons" description="Organizations can create and manage hackathons with registration and judging." />
            <FeatureCard icon={Globe} title="Public Profiles" description="Each organization has a public profile page with info, members, and hosted events." />
            <FeatureCard icon={Settings} title="Admin Controls" description="Organization owners and admins can update settings, manage members, and moderate content." />
          </div>
        </div>
      ),
    },
    {
      id: "club",
      title: "Club Membership",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Club Premium Membership</h2>
            <p className="text-muted-foreground text-sm">Unlock exclusive features with Stripe-powered subscriptions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <Card>
              <CardContent className="p-4 text-center">
                <h4 className="font-semibold mb-1">Free Tier</h4>
                <p className="text-2xl font-bold mb-2">$0</p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  <li>Code Quests & Problems</li>
                  <li>Tutorials & Lessons</li>
                  <li>Community Discussions</li>
                  <li>Leaderboard Access</li>
                  <li>AI Chat Companion</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardContent className="p-4 text-center">
                <Badge className="mb-2">Popular</Badge>
                <h4 className="font-semibold mb-1">Club Monthly</h4>
                <p className="text-2xl font-bold mb-2">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  <li>Everything in Free</li>
                  <li>Verifiable Certificates</li>
                  <li>Portfolio Hosting</li>
                  <li>Monthly Challenges</li>
                  <li>Priority Support</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant="secondary" className="mb-2">Best Value</Badge>
                <h4 className="font-semibold mb-1">Club Yearly</h4>
                <p className="text-2xl font-bold mb-2">$79.99<span className="text-sm font-normal text-muted-foreground">/yr</span></p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  <li>Everything in Monthly</li>
                  <li>Save 33% annually</li>
                  <li>All premium features</li>
                  <li>Early access to new content</li>
                  <li>Exclusive badge</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FeatureCard icon={GraduationCap} title="Certificates" description="Verifiable course completion certificates you can share on LinkedIn." />
            <FeatureCard icon={Briefcase} title="Portfolio Hosting" description="Showcase your projects with a public portfolio page." />
            <FeatureCard icon={Gift} title="Monthly Challenges" description="Exclusive competitive challenges with prizes for Club members." />
          </div>
        </div>
      ),
    },
    {
      id: "admin",
      title: "Admin & Monitoring",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Admin Panel & Self-Healing</h2>
            <p className="text-muted-foreground text-sm">Comprehensive admin tools with monitoring and error tracking</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={Shield} title="Admin Dashboard" description="Manage users, content, tutorials, hackathons, and organizations from a centralized admin panel." />
            <FeatureCard icon={Activity} title="Health Monitoring" description="Real-time CPU usage, memory stats, and database connection health checks." />
            <FeatureCard icon={BarChart3} title="Error Tracking" description="Automatic error logging middleware captures all server errors with stack traces and severity." />
            <FeatureCard icon={Settings} title="Error Resolution" description="View, filter, and resolve errors from the admin monitoring dashboard." />
            <FeatureCard icon={Cpu} title="System Metrics" description="Historical CPU, memory, and performance metrics tracked over time." />
            <FeatureCard icon={FileText} title="CMS Management" description="Create, edit, publish, and version-control educational content through the admin CMS tab." />
          </div>
        </div>
      ),
    },
    {
      id: "auth-security",
      title: "Auth & Security",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Authentication & Security</h2>
            <p className="text-muted-foreground text-sm">Enterprise-grade security with multi-provider authentication</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeatureCard icon={Lock} title="Replit Auth (OIDC)" description="OpenID Connect authentication supporting Google, GitHub, Apple, and email/password login." />
            <FeatureCard icon={Shield} title="Session Management" description="Secure server-side sessions with PostgreSQL-backed session storage and encryption." />
            <FeatureCard icon={Users} title="Role-Based Access" description="Three access levels: Public, Authenticated, Admin. Plus Club membership tier checks." />
            <FeatureCard icon={CreditCard} title="Stripe Security" description="PCI-compliant payment processing with webhook signature verification." />
            <FeatureCard icon={Lock} title="Middleware Chain" description="isAuthenticated, isAdmin, and isClubMember middleware for granular route protection." />
            <FeatureCard icon={Database} title="Data Integrity" description="Foreign key constraints, unique indexes, and type-safe ORM queries with Drizzle." />
          </div>
        </div>
      ),
    },
    {
      id: "database",
      title: "Database Architecture",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">Database Architecture</h2>
            <p className="text-muted-foreground text-sm">20+ interconnected tables powering the entire platform</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            {[
              { name: "Users & Sessions", count: 2 },
              { name: "Problems & Submissions", count: 3 },
              { name: "Tutorials & Lessons", count: 3 },
              { name: "Discussions & Answers", count: 3 },
              { name: "Badges & Achievements", count: 2 },
              { name: "Hackathons & Teams", count: 5 },
              { name: "Organizations", count: 2 },
              { name: "Certificates & Portfolio", count: 2 },
              { name: "Monthly Challenges", count: 2 },
              { name: "CMS & Versions", count: 3 },
              { name: "Error & Metrics Logs", count: 3 },
              { name: "Daily Challenges", count: 1 },
            ].map(group => (
              <Card key={group.name}>
                <CardContent className="p-3">
                  <p className="text-xs font-semibold">{group.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">{group.count}</p>
                  <p className="text-xs text-muted-foreground">tables</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-1">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">Key Database Features</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Drizzle ORM</Badge>
                <Badge variant="outline">Type-Safe Queries</Badge>
                <Badge variant="outline">Foreign Keys</Badge>
                <Badge variant="outline">Auto-Migrations</Badge>
                <Badge variant="outline">JSON Columns</Badge>
                <Badge variant="outline">Array Columns</Badge>
                <Badge variant="outline">Unique Indexes</Badge>
                <Badge variant="outline">Timestamps</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "api",
      title: "API Architecture",
      content: (
        <div className="flex flex-col gap-5 h-full">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold mb-2">RESTful API Architecture</h2>
            <p className="text-muted-foreground text-sm">100+ endpoints organized into logical modules</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Core APIs", endpoints: "Problems, Submissions, User Stats, Leaderboard, Daily Challenges, Badges" },
              { title: "Content APIs", endpoints: "Tutorials, Lessons, CMS CRUD, Publishing, Versioning, Analytics" },
              { title: "Community APIs", endpoints: "Discussions, Answers, Voting, View Tracking, User Profiles" },
              { title: "Hackathon APIs", endpoints: "CRUD, Registration, Teams, Submissions, Judging Criteria, Scores" },
              { title: "Organization APIs", endpoints: "CRUD, Members, Roles, Slug Lookup, Hosted Events" },
              { title: "Premium APIs", endpoints: "Certificates, Portfolio, Challenges, Stripe Checkout, Subscriptions" },
              { title: "Auth & Admin APIs", endpoints: "Login/Logout, User Session, Admin Routes, User Management" },
              { title: "Monitoring APIs", endpoints: "Health Check, Error Logs, Error Stats, System Metrics, Auto-Fix Logs" },
            ].map(group => (
              <Card key={group.title}>
                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm mb-1">{group.title}</h4>
                  <p className="text-xs text-muted-foreground">{group.endpoints}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "summary",
      title: "Summary",
      content: (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
          <img src={logoImage} alt="BlueCoderHub" className="w-20 h-20 rounded-2xl shadow-lg" />
          <h2 className="text-3xl font-bold">Complete Feature Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
            <StatBox value="8" label="Core Modules" icon={Layers} />
            <StatBox value="27" label="Pages" icon={Monitor} />
            <StatBox value="100+" label="API Endpoints" icon={Server} />
            <StatBox value="20+" label="DB Tables" icon={Database} />
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-xl">
            {[
              "Gamified XP System", "Code Quests", "Built-in IDE", "Tutorials & CMS",
              "AI Chat Companion", "Hackathon Hosting", "Community Forum", "Organizations",
              "Club Membership", "Stripe Payments", "Certificates", "Portfolio Hosting",
              "Leaderboards", "Badges", "Admin Panel", "Health Monitoring",
              "Multi-Auth (OIDC)", "Error Tracking", "Version Control", "Auto-Save"
            ].map(f => (
              <Badge key={f} variant="secondary">{f}</Badge>
            ))}
          </div>
          <p className="text-muted-foreground text-sm max-w-md mt-2">
            Built with React, Express, PostgreSQL, Drizzle ORM, Stripe, OpenAI, and Monaco Editor
          </p>
          <p className="text-xs text-muted-foreground">connect@bluecoderhub.com</p>
        </div>
      ),
    },
  ];

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  }, [slides.length]);

  const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide]);
  const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="presentation-page">
      <div className="flex items-center justify-between p-3 border-b gap-2">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="BlueCoderHub" className="w-8 h-8 rounded-md" />
          <span className="font-semibold text-sm hidden sm:inline">BlueCoderHub Feature Presentation</span>
        </div>
        <SlideCounter current={currentSlide + 1} total={slides.length} />
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            data-testid="btn-prev-slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            data-testid="btn-next-slide"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto min-h-[60vh] flex flex-col justify-center">
          {slides[currentSlide].content}
        </div>
      </div>

      <div className="p-3 border-t flex justify-center gap-1 flex-wrap">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentSlide ? "bg-primary w-6" : "bg-muted-foreground/30"
            }`}
            data-testid={`btn-slide-dot-${i}`}
          />
        ))}
      </div>
    </div>
  );
}

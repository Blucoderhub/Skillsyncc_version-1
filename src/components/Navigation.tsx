import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-user-stats";
import { useQuery } from "@tanstack/react-query";
import { Code2, Swords, Trophy, LogOut, Map, BookOpen, MessageSquare, Calendar, Shield, Target, Building2, Users, Briefcase, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillsynccLogo } from "@/components/SkillsynccLogo";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Map;
};

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Map },
  { href: "/quests", label: "Quests", icon: Swords },
  { href: "/tutorials", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Code2 },
  { href: "/challenges", label: "Challenges", icon: Target },
  { href: "/hackathons", label: "Hackathons", icon: Calendar },
  { href: "/discussions", label: "Community", icon: MessageSquare },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
];

const CANDIDATE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Map },
  { href: "/quests", label: "Quests", icon: Swords },
  { href: "/tutorials", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Code2 },
  { href: "/challenges", label: "Challenges", icon: Target },
  { href: "/hackathons", label: "Hackathons", icon: Calendar },
  { href: "/discussions", label: "Community", icon: MessageSquare },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
];

const CORPORATE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Map },
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/hackathons", label: "Hackathons", icon: Calendar },
  { href: "/leaderboard", label: "Candidate Ranks", icon: Trophy },
  { href: "/discussions", label: "Community", icon: MessageSquare },
];

const HR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Map },
  { href: "/hackathons", label: "Hackathons", icon: Calendar },
  { href: "/leaderboard", label: "Rankings", icon: Trophy },
  { href: "/discussions", label: "Community", icon: MessageSquare },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Map },
  { href: "/quests", label: "Quests", icon: Swords },
  { href: "/tutorials", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Code2 },
  { href: "/challenges", label: "Challenges", icon: Target },
  { href: "/hackathons", label: "Hackathons", icon: Calendar },
  { href: "/discussions", label: "Community", icon: MessageSquare },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
];

function getNavForRole(role: string | null, isAdmin: boolean): NavItem[] {
  if (isAdmin) return ADMIN_NAV;
  switch (role) {
    case "corporate": return CORPORATE_NAV;
    case "hr": return HR_NAV;
    case "student": return STUDENT_NAV;
    case "candidate": return CANDIDATE_NAV;
    default: return STUDENT_NAV;
  }
}

function getRoleBadge(role: string | null, isAdmin: boolean) {
  if (isAdmin) return { label: "Admin", color: "text-red-400" };
  switch (role) {
    case "corporate": return { label: "Corporate", color: "text-purple-400" };
    case "hr": return { label: "HR", color: "text-amber-400" };
    case "student": return { label: "Student", color: "text-blue-400" };
    case "candidate": return { label: "Candidate", color: "text-emerald-400" };
    default: return null;
  }
}

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: stats } = useUserStats();
  
  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const { data: roleData } = useQuery<{ role: string | null; isAdmin: boolean }>({
    queryKey: ["/api/user/role"],
    enabled: !!user,
  });

  const isAdmin = adminCheck?.isAdmin || roleData?.isAdmin || false;
  const userRole = roleData?.role || null;
  const navItems = getNavForRole(userRole, isAdmin);
  const roleBadge = getRoleBadge(userRole, isAdmin);

  if (!user) return null;

  return (
    <header className="shrink-0 z-50 w-full border-b-2 border-border bg-background">
      <div className="max-w-full px-2 sm:px-4 py-2 flex h-14 items-center justify-between gap-1">
        <Link href="/dashboard" className="flex items-center gap-1.5 group shrink-0" data-testid="link-home-logo">
          <SkillsynccLogo size="sm" animate={false} />
          <span className="font-display text-sm text-primary tracking-tighter hidden lg:block">
            Skill<span className="text-secondary">syncc</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 flex-1 justify-center overflow-hidden">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-md text-[9px] sm:text-[10px] transition-colors shrink-0",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                title={item.label}
              >
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          {userRole === "corporate" && (
            <Link
              href="/organizations"
              className={cn(
                "flex items-center gap-1 px-1.5 py-1.5 rounded-md text-[10px] transition-colors",
                location === "/organizations"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              data-testid="nav-organizations"
              title="Organizations"
            >
              <Building2 className="h-3.5 w-3.5" />
            </Link>
          )}
          {isAdmin && (
            <Link 
              href="/admin" 
              className={cn(
                "flex items-center gap-1 px-1.5 py-1.5 rounded-md text-[10px] transition-colors",
                location === "/admin"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              data-testid="nav-admin"
              title="Admin"
            >
              <Shield className="h-3.5 w-3.5" />
            </Link>
          )}
          <Link href="/profile" className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors" data-testid="link-profile">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
              {(user.firstName?.[0] || 'P').toUpperCase()}
            </div>
            <div className="flex flex-col items-start hidden lg:flex">
              <span className="text-[10px] font-bold text-foreground" data-testid="text-username">{user.firstName || 'Player'}</span>
              <span className="text-[9px] text-secondary" data-testid="text-user-level-nav">
                {(userRole === "student" || userRole === "candidate") ? `Lvl. ${stats?.level || 1}` : roleBadge?.label || ""}
              </span>
            </div>
          </Link>
          <button
            onClick={() => logout()}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            title="Log out"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

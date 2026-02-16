import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Building2, Calendar, Users, Trophy, Plus, Eye, ChevronRight, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

type CandidateInfo = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  userRole: string | null;
  institution: string | null;
  createdAt: string;
};

export default function CorporateDashboard() {
  const { user } = useAuth();

  const { data: organizations } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: hostedHackathons } = useQuery<any[]>({
    queryKey: ["/api/hosted-hackathons"],
  });

  const { data: candidates } = useQuery<CandidateInfo[]>({
    queryKey: ["/api/users/candidates"],
  });

  const orgCount = organizations?.length || 0;
  const hackathonCount = hostedHackathons?.length || 0;
  const candidateCount = candidates?.length || 0;
  const activeHackathons = hostedHackathons?.filter(h => h.status === "active" || h.status === "upcoming")?.length || 0;

  return (
    <main className="retro-container space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-xl font-display text-foreground" data-testid="text-corporate-heading">
            Corporate Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.firstName || "Manager"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/organizations">
            <Button variant="outline" className="gap-2" data-testid="button-manage-orgs">
              <Building2 className="w-4 h-4" />
              Organizations
            </Button>
          </Link>
          <Link href="/hackathons/create">
            <Button className="gap-2" data-testid="button-create-hackathon">
              <Plus className="w-4 h-4" />
              Host Hackathon
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Organizations", value: orgCount, icon: Building2, color: "text-purple-400" },
          { label: "Hackathons Hosted", value: hackathonCount, icon: Calendar, color: "text-blue-400" },
          { label: "Active Events", value: activeHackathons, icon: Target, color: "text-emerald-400" },
          { label: "Total Candidates", value: candidateCount, icon: Users, color: "text-amber-400" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-4" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-display text-foreground">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="font-display text-sm text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Your Hackathons
              </h2>
              <Link href="/hackathons">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View All <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            {!hostedHackathons?.length ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No hackathons yet</p>
                <Link href="/hackathons/create">
                  <Button size="sm" className="gap-1">
                    <Plus className="w-3 h-3" /> Create Your First
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {hostedHackathons.slice(0, 5).map((h: any) => (
                  <Link key={h.id} href={`/hackathons/${h.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate cursor-pointer" data-testid={`hackathon-item-${h.id}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground font-medium truncate">{h.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {h.registrationCount || 0} registrations
                        </p>
                      </div>
                      <Badge variant={h.status === "active" ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {h.status || "draft"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="font-display text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Recent Candidates
              </h2>
              <Badge variant="secondary" className="text-[10px]">{candidateCount} total</Badge>
            </div>
            {!candidates?.length ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No candidates registered yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-md border border-border" data-testid={`candidate-item-${c.id}`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {(c.firstName?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground truncate">{c.firstName} {c.lastName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] shrink-0">{c.userRole}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-5">
          <h2 className="font-display text-sm text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/organizations">
              <Card className="p-4 cursor-pointer hover-elevate text-center" data-testid="action-manage-orgs">
                <Building2 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-xs text-foreground font-medium">Manage Organizations</p>
                <p className="text-[10px] text-muted-foreground">Create & edit teams</p>
              </Card>
            </Link>
            <Link href="/hackathons">
              <Card className="p-4 cursor-pointer hover-elevate text-center" data-testid="action-view-hackathons">
                <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-foreground font-medium">View Hackathons</p>
                <p className="text-[10px] text-muted-foreground">Browse all events</p>
              </Card>
            </Link>
            <Link href="/leaderboard">
              <Card className="p-4 cursor-pointer hover-elevate text-center" data-testid="action-leaderboard">
                <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-foreground font-medium">Candidate Rankings</p>
                <p className="text-[10px] text-muted-foreground">View top performers</p>
              </Card>
            </Link>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}

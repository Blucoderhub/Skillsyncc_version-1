import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Users, Calendar, Search, BarChart3, GraduationCap, Briefcase, Trophy, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

type CandidateInfo = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  userRole: string | null;
  institution: string | null;
  createdAt: string;
};

export default function HRDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: candidates, isLoading } = useQuery<CandidateInfo[]>({
    queryKey: ["/api/users/candidates"],
  });

  const { data: hostedHackathons } = useQuery<any[]>({
    queryKey: ["/api/hosted-hackathons"],
  });

  const filteredCandidates = candidates?.filter(c => {
    if (!searchTerm) return true;
    const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
    const email = (c.email || "").toLowerCase();
    const inst = (c.institution || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term) || inst.includes(term);
  });

  const studentCount = candidates?.filter(c => c.userRole === "student").length || 0;
  const candidateCount = candidates?.filter(c => c.userRole === "candidate").length || 0;
  const totalCount = candidates?.length || 0;
  const hackathonCount = hostedHackathons?.length || 0;

  return (
    <main className="retro-container space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-xl font-display text-foreground" data-testid="text-hr-heading">
            HR Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {user?.firstName || "Recruiter"}. Find and evaluate talent.
          </p>
        </div>
        <Link href="/hackathons">
          <Button variant="outline" className="gap-2" data-testid="button-view-hackathons">
            <Calendar className="w-4 h-4" />
            View Hackathons
          </Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Candidates", value: totalCount, icon: Users, color: "text-blue-400" },
          { label: "Students", value: studentCount, icon: GraduationCap, color: "text-emerald-400" },
          { label: "Professionals", value: candidateCount, icon: Briefcase, color: "text-amber-400" },
          { label: "Hackathons", value: hackathonCount, icon: Calendar, color: "text-purple-400" },
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-display text-sm text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Candidate Search
            </h2>
            <Badge variant="secondary" className="text-[10px]">{filteredCandidates?.length || 0} results</Badge>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or institution..."
                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                data-testid="input-candidate-search"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            </div>
          ) : !filteredCandidates?.length ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No candidates match your search" : "No candidates registered yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCandidates.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-md border border-border hover-elevate" data-testid={`hr-candidate-${c.id}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(c.firstName?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground font-medium truncate">{c.firstName} {c.lastName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground truncate">{c.email}</span>
                      {c.institution && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {c.institution}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={c.userRole === "student" ? "default" : "secondary"} className="text-[9px] shrink-0">
                    {c.userRole === "student" ? "Student" : "Professional"}
                  </Badge>
                  <Link href={`/profile/${c.id}`}>
                    <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-view-profile-${c.id}`}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5">
            <h2 className="font-display text-sm text-foreground flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              Recent Hackathons
            </h2>
            {!hostedHackathons?.length ? (
              <div className="text-center py-6">
                <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No hackathons available yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {hostedHackathons.slice(0, 5).map((h: any) => (
                  <Link key={h.id} href={`/hackathons/${h.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate cursor-pointer" data-testid={`hr-hackathon-${h.id}`}>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground font-medium truncate">{h.title}</p>
                        <p className="text-[10px] text-muted-foreground">{h.registrationCount || 0} participants</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-5">
            <h2 className="font-display text-sm text-foreground flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link href="/leaderboard">
                <div className="flex items-center gap-3 p-3 rounded-md border border-border hover-elevate cursor-pointer" data-testid="action-rankings">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs text-foreground font-medium">View Rankings</p>
                    <p className="text-[10px] text-muted-foreground">See top performing candidates</p>
                  </div>
                </div>
              </Link>
              <Link href="/hackathons">
                <div className="flex items-center gap-3 p-3 rounded-md border border-border hover-elevate cursor-pointer" data-testid="action-hackathon-performance">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-foreground font-medium">Hackathon Performance</p>
                    <p className="text-[10px] text-muted-foreground">Review submissions and scores</p>
                  </div>
                </div>
              </Link>
              <Link href="/discussions">
                <div className="flex items-center gap-3 p-3 rounded-md border border-border hover-elevate cursor-pointer" data-testid="action-community">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-foreground font-medium">Community Insights</p>
                    <p className="text-[10px] text-muted-foreground">See what candidates are discussing</p>
                  </div>
                </div>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

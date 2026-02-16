import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Trophy, Users, Calendar, ExternalLink, GitBranch, Clock, Plus, Check, X
} from "lucide-react";

type TabKey = "overview" | "teams" | "submissions";

const statusColors: Record<string, string> = {
  open: "bg-green-500",
  in_progress: "bg-blue-500",
  judging: "bg-yellow-500",
  completed: "bg-muted-foreground",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  judging: "Judging",
  completed: "Completed",
};

export default function HackathonDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [submission, setSubmission] = useState({
    title: "",
    description: "",
    repoUrl: "",
    demoUrl: "",
    videoUrl: "",
  });

  const { data: hackathon, isLoading } = useQuery<any>({
    queryKey: ["/api/hosted-hackathons", id],
  });

  const { data: registration } = useQuery<any>({
    queryKey: ["/api/hosted-hackathons", id, "registration"],
    enabled: !!user,
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/hosted-hackathons", id, "teams"],
    enabled: activeTab === "teams",
  });

  const { data: submissions = [] } = useQuery<any[]>({
    queryKey: ["/api/hosted-hackathons", id, "submissions"],
    enabled: activeTab === "submissions",
  });

  const isRegistered = !!registration?.registered;

  const registerMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/hosted-hackathons/${id}/register`),
    onSuccess: () => {
      toast({ title: "Registered!", description: "You have joined this hackathon." });
      queryClient.invalidateQueries({ queryKey: ["/api/hosted-hackathons", id, "registration"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hosted-hackathons", id] });
    },
    onError: (error: any) => {
      toast({ title: "Registration failed", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/hosted-hackathons/${id}/register`),
    onSuccess: () => {
      toast({ title: "Withdrawn", description: "You have left this hackathon." });
      queryClient.invalidateQueries({ queryKey: ["/api/hosted-hackathons", id, "registration"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hosted-hackathons", id] });
    },
    onError: (error: any) => {
      toast({ title: "Withdrawal failed", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", `/api/hosted-hackathons/${id}/teams`, { name }),
    onSuccess: () => {
      toast({ title: "Team created!", description: "Your team is ready." });
      setIsCreateTeamOpen(false);
      setTeamName("");
      queryClient.invalidateQueries({ queryKey: ["/api/hosted-hackathons", id, "teams"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create team", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: (teamId: number) => apiRequest("POST", `/api/teams/${teamId}/members`),
    onSuccess: () => {
      toast({ title: "Joined team!", description: "You are now a team member." });
      queryClient.invalidateQueries({ queryKey: ["/api/hosted-hackathons", id, "teams"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to join team", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const submitProjectMutation = useMutation({
    mutationFn: (data: typeof submission) => apiRequest("POST", `/api/hosted-hackathons/${id}/submissions`, data),
    onSuccess: () => {
      toast({ title: "Project submitted!", description: "Your submission has been recorded." });
      setIsSubmitOpen(false);
      setSubmission({ title: "", description: "", repoUrl: "", demoUrl: "", videoUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/hosted-hackathons", id, "submissions"] });
    },
    onError: (error: any) => {
      toast({ title: "Submission failed", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="retro-container py-20 text-center">
        <p className="font-display text-primary animate-pulse" data-testid="text-loading">Loading hackathon details...</p>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="retro-container py-20 text-center">
        <p className="font-display text-muted-foreground" data-testid="text-not-found">Hackathon not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/hackathons" data-testid="link-back-hackathons">Back to Hackathons</Link>
        </Button>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "teams", label: "Teams" },
    { key: "submissions", label: "Submissions" },
  ];

  return (
    <div className="retro-container py-8 space-y-8" data-testid="hackathon-detail-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-display text-primary" data-testid="text-hackathon-title">
                {hackathon.title}
              </h1>
              <Badge
                className={`${statusColors[hackathon.status] || "bg-muted-foreground"} text-white`}
                data-testid="badge-hackathon-status"
              >
                {statusLabels[hackathon.status] || hackathon.status}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl" data-testid="text-hackathon-description">
              {hackathon.description}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {user && !isRegistered && (
              <Button
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Registering..." : "Register"}
              </Button>
            )}
            {isRegistered && (
              <>
                <Badge className="bg-green-500 text-white gap-1" data-testid="badge-registered">
                  <Check className="w-3 h-3" /> Registered
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => withdrawMutation.mutate()}
                  disabled={withdrawMutation.isPending}
                  data-testid="button-withdraw"
                >
                  <X className="w-4 h-4 mr-1" />
                  {withdrawMutation.isPending ? "Withdrawing..." : "Withdraw"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium text-sm" data-testid="text-start-date">
                  {hackathon.startDate ? format(new Date(hackathon.startDate), "MMM d, yyyy") : "TBA"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium text-sm" data-testid="text-end-date">
                  {hackathon.endDate ? format(new Date(hackathon.endDate), "MMM d, yyyy") : "TBA"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Prize Pool</p>
                <p className="font-medium text-sm" data-testid="text-prize-pool">
                  {hackathon.prizePool || "TBA"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Participants</p>
                <p className="font-medium text-sm" data-testid="text-participants">
                  {hackathon.registrationCount ?? 0}
                  {hackathon.maxParticipants ? ` / ${hackathon.maxParticipants}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 border-b border-border pb-0 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {hackathon.rules && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-rules">
                    {hackathon.rules}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Trophy className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Prize Pool</p>
                      <p className="font-medium text-sm">{hackathon.prizePool || "TBA"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Max Participants</p>
                      <p className="font-medium text-sm">{hackathon.maxParticipants || "Unlimited"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium text-sm">
                        {hackathon.startDate && hackathon.endDate
                          ? `${format(new Date(hackathon.startDate), "MMM d")} - ${format(new Date(hackathon.endDate), "MMM d, yyyy")}`
                          : "TBA"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium text-sm">{statusLabels[hackathon.status] || hackathon.status}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "teams" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Teams
              </h2>
              {isRegistered && (
                <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-create-team">
                      <Plus className="w-4 h-4" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create a Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">Team Name</label>
                        <Input
                          placeholder="Enter team name"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          data-testid="input-team-name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateTeamOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => createTeamMutation.mutate(teamName)}
                        disabled={!teamName.trim() || createTeamMutation.isPending}
                        data-testid="button-submit-team"
                      >
                        {createTeamMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {teams.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">No teams yet. Be the first to create one!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team: any) => (
                  <Card key={team.id} data-testid={`card-team-${team.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Captain: {team.captainName || team.captain || "Unknown"}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span data-testid={`text-member-count-${team.id}`}>
                          {team.memberCount ?? team.members?.length ?? 0} members
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {isRegistered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => joinTeamMutation.mutate(team.id)}
                          disabled={joinTeamMutation.isPending}
                          data-testid={`button-join-team-${team.id}`}
                        >
                          {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "submissions" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-display flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Submissions
              </h2>
              {isRegistered && (
                <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="button-submit-project">
                      <Plus className="w-4 h-4" />
                      Submit Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Your Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">Project Title *</label>
                        <Input
                          placeholder="My Awesome Project"
                          value={submission.title}
                          onChange={(e) => setSubmission({ ...submission, title: e.target.value })}
                          data-testid="input-submission-title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description *</label>
                        <Textarea
                          placeholder="Describe your project..."
                          value={submission.description}
                          onChange={(e) => setSubmission({ ...submission, description: e.target.value })}
                          data-testid="input-submission-description"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Repository URL</label>
                        <Input
                          placeholder="https://github.com/..."
                          value={submission.repoUrl}
                          onChange={(e) => setSubmission({ ...submission, repoUrl: e.target.value })}
                          data-testid="input-submission-repo"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Demo URL</label>
                        <Input
                          placeholder="https://..."
                          value={submission.demoUrl}
                          onChange={(e) => setSubmission({ ...submission, demoUrl: e.target.value })}
                          data-testid="input-submission-demo"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Video URL</label>
                        <Input
                          placeholder="https://youtube.com/..."
                          value={submission.videoUrl}
                          onChange={(e) => setSubmission({ ...submission, videoUrl: e.target.value })}
                          data-testid="input-submission-video"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => submitProjectMutation.mutate(submission)}
                        disabled={!submission.title.trim() || !submission.description.trim() || submitProjectMutation.isPending}
                        data-testid="button-confirm-submission"
                      >
                        {submitProjectMutation.isPending ? "Submitting..." : "Submit"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">No submissions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {submissions.map((sub: any) => (
                  <Card key={sub.id} data-testid={`card-submission-${sub.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{sub.title}</CardTitle>
                        {sub.score != null && (
                          <Badge variant="secondary" data-testid={`badge-score-${sub.id}`}>
                            Score: {sub.score}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{sub.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {sub.repoUrl && (
                          <Button variant="outline" size="sm" className="gap-1" asChild>
                            <a href={sub.repoUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-repo-${sub.id}`}>
                              <GitBranch className="w-3 h-3" /> Repo
                            </a>
                          </Button>
                        )}
                        {sub.demoUrl && (
                          <Button variant="outline" size="sm" className="gap-1" asChild>
                            <a href={sub.demoUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-demo-${sub.id}`}>
                              <ExternalLink className="w-3 h-3" /> Demo
                            </a>
                          </Button>
                        )}
                        {sub.videoUrl && (
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-video-${sub.id}`}>
                              <ExternalLink className="w-3 h-3" /> Video
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { 
  Users, BookOpen, Calendar, Code, ChevronRight, Shield, Eye,
  Plus, Trash2, Edit, Check, X, BarChart3, Building2, Trophy,
  FileEdit, Activity, AlertTriangle, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type AdminStats = {
  totalUsers: number;
  totalProblems: number;
  totalHackathons: number;
  totalTutorials: number;
  totalSubmissions: number;
  passedSubmissions: number;
};

type UserWithProgress = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean | null;
  createdAt: Date | null;
  progress?: {
    level: number | null;
    xp: number | null;
    solvedCount: number | null;
  };
  submissionsCount: number;
};

type Submission = {
  id: number;
  userId: string;
  problemId: number;
  code: string;
  status: string;
  createdAt: Date | null;
  userName: string;
  problemTitle: string;
  problemSlug: string;
};

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: isAdminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdminCheck?.isAdmin,
  });

  const { data: users } = useQuery<UserWithProgress[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdminCheck?.isAdmin && activeTab === "users",
  });

  const { data: tutorials } = useQuery<any[]>({
    queryKey: ["/api/admin/tutorials"],
    enabled: isAdminCheck?.isAdmin && activeTab === "tutorials",
  });

  const { data: hackathons } = useQuery<any[]>({
    queryKey: ["/api/admin/hackathons"],
    enabled: isAdminCheck?.isAdmin && activeTab === "hackathons",
  });

  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ["/api/admin/submissions"],
    enabled: isAdminCheck?.isAdmin && activeTab === "submissions",
  });

  const { data: organizations } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: isAdminCheck?.isAdmin && activeTab === "organizations",
  });

  const { data: hostedHackathons } = useQuery<any[]>({
    queryKey: ["/api/admin/hosted-hackathons"],
    enabled: isAdminCheck?.isAdmin && activeTab === "hosted-hackathons",
  });

  const { data: cmsContent } = useQuery<any[]>({
    queryKey: ["/api/cms/content"],
    enabled: isAdminCheck?.isAdmin && activeTab === "cms",
  });

  const { data: healthData } = useQuery<any>({
    queryKey: ["/api/health"],
    enabled: isAdminCheck?.isAdmin && activeTab === "monitoring",
    refetchInterval: 30000,
  });

  const { data: errorStats } = useQuery<any>({
    queryKey: ["/api/monitoring/error-stats"],
    enabled: isAdminCheck?.isAdmin && activeTab === "monitoring",
  });

  const { data: errorLogs } = useQuery<any[]>({
    queryKey: ["/api/monitoring/errors"],
    enabled: isAdminCheck?.isAdmin && activeTab === "monitoring",
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
    },
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (isAdminCheck && !isAdminCheck.isAdmin) {
    return (
      <div className="retro-container py-20 text-center">
        <Shield className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-display text-primary mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You don't have admin permissions to access this page.</p>
      </div>
    );
  }

  return (
    <main className="retro-container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-display text-primary">Admin Panel</h1>
        </div>
        <p className="text-muted-foreground">Manage users, content, and review submissions</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto mb-8">
          <TabsList className="inline-flex w-auto min-w-full gap-1">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="cms" className="gap-2" data-testid="tab-cms">
              <FileEdit className="w-4 h-4" /> CMS
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="gap-2" data-testid="tab-tutorials">
              <BookOpen className="w-4 h-4" /> Tutorials
            </TabsTrigger>
            <TabsTrigger value="hackathons" className="gap-2" data-testid="tab-hackathons">
              <Calendar className="w-4 h-4" /> External
            </TabsTrigger>
            <TabsTrigger value="hosted-hackathons" className="gap-2" data-testid="tab-hosted-hackathons">
              <Trophy className="w-4 h-4" /> Hosted
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-2" data-testid="tab-organizations">
              <Building2 className="w-4 h-4" /> Orgs
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2" data-testid="tab-submissions">
              <Code className="w-4 h-4" /> Submissions
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2" data-testid="tab-monitoring">
              <Activity className="w-4 h-4" /> Health
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard 
              icon={<Users className="w-5 h-5" />} 
              label="Total Users" 
              value={stats?.totalUsers || 0} 
              color="text-primary"
            />
            <StatCard 
              icon={<Code className="w-5 h-5" />} 
              label="Problems" 
              value={stats?.totalProblems || 0} 
              color="text-secondary"
            />
            <StatCard 
              icon={<BookOpen className="w-5 h-5" />} 
              label="Tutorials" 
              value={stats?.totalTutorials || 0} 
              color="text-accent"
            />
            <StatCard 
              icon={<Calendar className="w-5 h-5" />} 
              label="Hackathons" 
              value={stats?.totalHackathons || 0} 
              color="text-pink-400"
            />
            <StatCard 
              icon={<Check className="w-5 h-5" />} 
              label="Passed Submissions" 
              value={stats?.passedSubmissions || 0} 
              color="text-green-400"
            />
            <StatCard 
              icon={<BarChart3 className="w-5 h-5" />} 
              label="Total Submissions" 
              value={stats?.totalSubmissions || 0} 
              color="text-blue-400"
            />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users?.map((u) => (
                  <div 
                    key={u.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                    data-testid={`user-row-${u.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {u.firstName || u.lastName 
                            ? `${u.firstName || ''} ${u.lastName || ''}`.trim() 
                            : u.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p>Level {u.progress?.level || 1}</p>
                        <p className="text-muted-foreground">{u.progress?.xp || 0} XP</p>
                      </div>
                      <Badge variant={u.isAdmin ? "default" : "outline"}>
                        {u.isAdmin ? "Admin" : "User"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={u.isAdmin ? "destructive" : "default"}
                        onClick={() => toggleAdminMutation.mutate({ 
                          userId: u.id, 
                          isAdmin: !u.isAdmin 
                        })}
                        data-testid={`toggle-admin-${u.id}`}
                      >
                        {u.isAdmin ? "Revoke Admin" : "Make Admin"}
                      </Button>
                    </div>
                  </div>
                ))}
                {(!users || users.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutorials">
          <TutorialManagement tutorials={tutorials || []} />
        </TabsContent>

        <TabsContent value="hackathons">
          <HackathonManagement hackathons={hackathons || []} />
        </TabsContent>

        <TabsContent value="hosted-hackathons">
          <HostedHackathonManagement hackathons={hostedHackathons || []} />
        </TabsContent>

        <TabsContent value="organizations">
          <OrganizationManagement organizations={organizations || []} />
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Code Submissions</CardTitle>
              <CardDescription>Review user code submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions?.slice(0, 50).map((sub) => (
                  <SubmissionRow key={sub.id} submission={sub} />
                ))}
                {(!submissions || submissions.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No submissions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cms">
          <CmsManagement content={cmsContent || []} />
        </TabsContent>

        <TabsContent value="monitoring">
          <MonitoringDashboard healthData={healthData} errorStats={errorStats} errorLogs={errorLogs || []} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-lg bg-muted", color)}>{icon}</div>
          <div className="text-right">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TutorialManagement({ tutorials }: { tutorials: any[] }) {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    title: "", slug: "", description: "", category: "Python", 
    difficulty: "Beginner", order: 0
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/tutorials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tutorials"] });
      setIsAddOpen(false);
      setForm({ title: "", slug: "", description: "", category: "Python", difficulty: "Beginner", order: 0 });
      toast({ title: "Tutorial created successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/tutorials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tutorials"] });
      toast({ title: "Tutorial deleted" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Tutorial Management</CardTitle>
          <CardDescription>Create and manage learning tutorials</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-tutorial">
              <Plus className="w-4 h-4 mr-2" /> Add Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tutorial</DialogTitle>
              <DialogDescription>Create a new tutorial course</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="input-tutorial-title"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input 
                  value={form.slug} 
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  data-testid="input-tutorial-slug"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  data-testid="input-tutorial-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger data-testid="select-tutorial-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Python">Python</SelectItem>
                      <SelectItem value="JavaScript">JavaScript</SelectItem>
                      <SelectItem value="HTML">HTML</SelectItem>
                      <SelectItem value="CSS">CSS</SelectItem>
                      <SelectItem value="SQL">SQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger data-testid="select-tutorial-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                data-testid="button-save-tutorial"
              >
                Create Tutorial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tutorials.map((t) => (
            <div 
              key={t.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              data-testid={`tutorial-row-${t.id}`}
            >
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-muted-foreground">{t.category} • {t.difficulty}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t.lessonsCount || 0} lessons</Badge>
                <Button 
                  size="icon" 
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(t.id)}
                  data-testid={`delete-tutorial-${t.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {tutorials.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tutorials yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HackathonManagement({ hackathons }: { hackathons: any[] }) {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: "", description: "", url: "", platform: "Devpost",
    startDate: "", endDate: "", tags: ""
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/hackathons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hackathons"] });
      setIsAddOpen(false);
      setForm({ title: "", description: "", url: "", platform: "Devpost", startDate: "", endDate: "", tags: "" });
      toast({ title: "Hackathon added successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/hackathons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hackathons"] });
      toast({ title: "Hackathon deleted" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Hackathon Management</CardTitle>
          <CardDescription>Add and manage hackathon listings</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-hackathon">
              <Plus className="w-4 h-4 mr-2" /> Add Hackathon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Hackathon</DialogTitle>
              <DialogDescription>Add a new hackathon to the tracker</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="input-hackathon-title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  data-testid="input-hackathon-description"
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input 
                  value={form.url} 
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  data-testid="input-hackathon-url"
                />
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger data-testid="select-hackathon-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Devpost">Devpost</SelectItem>
                    <SelectItem value="Hack2Skill">Hack2Skill</SelectItem>
                    <SelectItem value="Devfolio">Devfolio</SelectItem>
                    <SelectItem value="MLH">MLH</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={form.startDate} 
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    data-testid="input-hackathon-start"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input 
                    type="date"
                    value={form.endDate} 
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    data-testid="input-hackathon-end"
                  />
                </div>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input 
                  value={form.tags} 
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="AI, Web3, Mobile"
                  data-testid="input-hackathon-tags"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => createMutation.mutate({
                  ...form,
                  tags: form.tags.split(",").map(t => t.trim()).filter(Boolean)
                })}
                disabled={createMutation.isPending}
                data-testid="button-save-hackathon"
              >
                Add Hackathon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hackathons.map((h) => (
            <div 
              key={h.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              data-testid={`hackathon-row-${h.id}`}
            >
              <div>
                <p className="font-medium">{h.title}</p>
                <p className="text-sm text-muted-foreground">{h.platform} • {new Date(h.startDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={h.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </a>
                <Button 
                  size="icon" 
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(h.id)}
                  data-testid={`delete-hackathon-${h.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {hackathons.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hackathons yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HostedHackathonManagement({ hackathons }: { hackathons: any[] }) {
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/hosted-hackathons/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hosted-hackathons"] });
      toast({ title: "Hackathon status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const statusOptions = ["draft", "open", "in_progress", "judging", "completed"];
  const statusColors: Record<string, string> = {
    draft: "outline",
    open: "default",
    in_progress: "default",
    judging: "secondary",
    completed: "outline",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hosted Hackathons</CardTitle>
        <CardDescription>Review and moderate platform-hosted hackathons</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hackathons.map((h) => (
            <div 
              key={h.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border flex-wrap gap-2"
              data-testid={`hosted-hackathon-row-${h.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{h.title}</p>
                <p className="text-xs text-muted-foreground">
                  by {h.organizationName || 'Unknown Org'} | {h.registrationCount || 0} registrations
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={(statusColors[h.status] as any) || "outline"}>
                  {(h.status || 'draft').replace('_', ' ')}
                </Badge>
                <Select 
                  value={h.status || 'draft'} 
                  onValueChange={(v) => updateStatusMutation.mutate({ id: h.id, status: v })}
                >
                  <SelectTrigger className="w-32" data-testid={`select-status-${h.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {hackathons.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hosted hackathons yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizationManagement({ organizations }: { organizations: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>View and manage registered organizations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {organizations.map((org) => (
            <div 
              key={org.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border flex-wrap gap-2"
              data-testid={`org-row-${org.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Owner: {org.ownerName || org.ownerId} | Members: {org.memberCount || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{org.hackathonCount || 0} hackathons</Badge>
                {org.verified && (
                  <Badge variant="default">Verified</Badge>
                )}
              </div>
            </div>
          ))}
          {organizations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No organizations yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubmissionRow({ submission }: { submission: Submission }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
      data-testid={`submission-row-${submission.id}`}
    >
      <div className="flex items-center gap-4">
        <Badge variant={submission.status === "Passed" ? "default" : "destructive"}>
          {submission.status}
        </Badge>
        <div>
          <p className="font-medium">{submission.problemTitle}</p>
          <p className="text-xs text-muted-foreground">
            by {submission.userName} • {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : 'Unknown'}
          </p>
        </div>
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" data-testid={`view-submission-${submission.id}`}>
            <Eye className="w-4 h-4 mr-2" /> View Code
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submission Review</DialogTitle>
            <DialogDescription>
              {submission.problemTitle} by {submission.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-background rounded-lg border p-4 max-h-96 overflow-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap">{submission.code}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CmsManagement({ content }: { content: any[] }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cms/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/content"] });
      toast({ title: "Content deleted" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/cms/content/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/content"] });
      toast({ title: "Content published" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>Create and manage tutorials, guides, and educational content</CardDescription>
        </div>
        <Button onClick={() => navigate("/cms/new")} data-testid="btn-create-content">
          <Plus className="w-4 h-4 mr-2" /> New Content
        </Button>
      </CardHeader>
      <CardContent>
        {content.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No content yet. Create your first piece of content.</p>
        ) : (
          <div className="space-y-3">
            {content.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border" data-testid={`cms-item-${item.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <FileEdit className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-xs">
                        {item.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{item.contentType}</Badge>
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.status !== "published" && (
                    <Button size="icon" variant="ghost" onClick={() => publishMutation.mutate(item.id)} disabled={publishMutation.isPending} data-testid={`btn-publish-${item.id}`}>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => navigate(`/cms/edit/${item.id}`)} data-testid={`btn-edit-${item.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending} data-testid={`btn-delete-${item.id}`}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MonitoringDashboard({ healthData, errorStats, errorLogs }: { healthData: any; errorStats: any; errorLogs: any[] }) {
  const { toast } = useToast();

  const resolveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/monitoring/errors/${id}/resolve`, { fixApplied: "Manually resolved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring/errors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring/error-stats"] });
      toast({ title: "Error resolved" });
    },
  });

  const statusColor = healthData?.status === "healthy" ? "text-green-500" : healthData?.status === "warning" ? "text-yellow-500" : "text-destructive";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className={cn("w-8 h-8 mx-auto mb-2", statusColor)} />
            <p className="text-sm font-medium">System Status</p>
            <p className={cn("text-lg font-bold capitalize", statusColor)}>{healthData?.status || "Unknown"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
            <p className="text-2xl font-bold">{healthData?.cpu ?? "--"}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
            <p className="text-2xl font-bold">{healthData?.memory ?? "--"}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Uptime</p>
            <p className="text-2xl font-bold">{healthData?.uptime ? `${Math.floor(healthData.uptime / 3600)}h` : "--"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Total Errors</p>
            <p className="text-2xl font-bold">{errorStats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <X className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Unresolved</p>
            <p className="text-2xl font-bold">{errorStats?.unresolved || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Auto-Fixed</p>
            <p className="text-2xl font-bold">{errorStats?.autoFixed || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>Application error log with resolution tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {errorLogs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No errors logged. System is running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errorLogs.slice(0, 20).map((err: any) => (
                <div key={err.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border gap-3" data-testid={`error-row-${err.id}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={err.severity === "critical" ? "destructive" : "secondary"} className="text-xs">{err.severity}</Badge>
                      <Badge variant="outline" className="text-xs">{err.errorType}</Badge>
                      {err.isResolved && <Badge className="text-xs bg-green-500/20 text-green-400">Resolved</Badge>}
                      <span className="text-xs text-muted-foreground">x{err.occurrences}</span>
                    </div>
                    <p className="text-sm mt-1 truncate">{err.errorMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last: {err.lastOccurred ? new Date(err.lastOccurred).toLocaleString() : "Unknown"}
                      {err.endpoint && ` | ${err.endpoint}`}
                    </p>
                  </div>
                  {!err.isResolved && (
                    <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(err.id)} disabled={resolveMutation.isPending} data-testid={`btn-resolve-${err.id}`}>
                      <Check className="w-3 h-3 mr-1" /> Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { 
  Users, BookOpen, Calendar, Code, ChevronRight, Shield, Eye,
  Plus, Trash2, Edit, Check, X, BarChart3
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
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
            <BarChart3 className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="gap-2" data-testid="tab-tutorials">
            <BookOpen className="w-4 h-4" /> Tutorials
          </TabsTrigger>
          <TabsTrigger value="hackathons" className="gap-2" data-testid="tab-hackathons">
            <Calendar className="w-4 h-4" /> Hackathons
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2" data-testid="tab-submissions">
            <Code className="w-4 h-4" /> Submissions
          </TabsTrigger>
        </TabsList>

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

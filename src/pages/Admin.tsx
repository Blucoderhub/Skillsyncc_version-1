import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation, Link } from "wouter";
import { 
  Users, User, BookOpen, Calendar, Code, ChevronRight, Shield, Eye,
  Plus, Trash2, Edit, Check, X, BarChart3, Building2, Trophy,
  FileEdit, Activity, AlertTriangle, CheckCircle2, Save, Upload
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
import MarkdownEditor from "@/components/MarkdownEditor";
import EnhancedTutorialForm from "@/components/EnhancedTutorialForm";

type AdminStats = {
  totalUsers: number;
  totalProblems: number;
  totalHackathons: number;
  totalSubmissions: number;
  recentUsers: any[];
  recentSubmissions: any[];
};

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: tutorials, isLoading: tutorialsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/tutorials"],
  });

  const { data: hackathons, isLoading: hackathonsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/hackathons"],
  });

  if (authLoading || statsLoading || usersLoading || tutorialsLoading || hackathonsLoading) {
    return (
      <div className="retro-container text-center py-20">
        <p className="font-display text-primary animate-pulse">Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" replace />;
  }

  if (user.userRole !== "admin") {
    return <Redirect to="/dashboard" replace />;
  }

  return (
    <div className="retro-container">
      <div className="mb-8">
        <h1 className="text-4xl font-display mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your learning platform</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Users className="w-6 h-6" />} 
          label="Total Users" 
          value={stats?.totalUsers || 0} 
          color="text-blue-400"
        />
        <StatCard 
          icon={<Code className="w-6 h-6" />} 
          label="Total Problems" 
          value={stats?.totalProblems || 0} 
          color="text-green-400"
        />
        <StatCard 
          icon={<Trophy className="w-6 h-6" />} 
          label="Total Hackathons" 
          value={stats?.totalHackathons || 0} 
          color="text-yellow-400"
        />
        <StatCard 
          icon={<FileEdit className="w-6 h-6" />} 
          label="Total Submissions" 
          value={stats?.totalSubmissions || 0} 
          color="text-purple-400"
        />
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement users={users || []} />
        </TabsContent>

        <TabsContent value="tutorials">
          <TutorialManagement tutorials={tutorials || []} />
        </TabsContent>

        <TabsContent value="hackathons">
          <HackathonManagement hackathons={hackathons || []} />
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
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

function UserManagement({ users }: { users: any[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAdminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/admin`, { isAdmin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User admin status updated" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage platform users and their roles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Role: {user.userRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.userRole === "admin" ? "default" : "secondary"}>
                  {user.userRole}
                </Badge>
                {user.userRole !== "admin" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateAdminMutation.mutate({ userId: user.id, isAdmin: true })}
                    disabled={updateAdminMutation.isPending}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Make Admin
                  </Button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TutorialManagement({ tutorials }: { tutorials: any[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/tutorials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tutorials"] });
      toast({ title: "Tutorial deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting tutorial", 
        description: error instanceof Error ? error.message : "Failed to delete tutorial",
        variant: "destructive"
      });
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Tutorial Management</CardTitle>
          <CardDescription>Create and manage learning tutorials with rich content</CardDescription>
        </div>
        <EnhancedTutorialForm />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tutorials.map((t) => (
            <div 
              key={t.id} 
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors"
              data-testid={`tutorial-row-${t.id}`}
            >
              <div className="flex-1">
                <p className="font-medium text-lg">{t.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.category} • {t.difficulty} • {t.xpReward || 500} XP
                </p>
                {t.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {t.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Badge variant="outline">{t.lessonsCount || 0} lessons</Badge>
                <EnhancedTutorialForm 
                  mode="edit" 
                  tutorial={t}
                  trigger={
                    <Button size="sm" variant="ghost" data-testid={`edit-tutorial-${t.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  }
                />
                <Button 
                  size="icon" 
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(t.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`delete-tutorial-${t.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {tutorials.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No tutorials yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first tutorial to start building your learning content
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HackathonManagement({ hackathons }: { hackathons: any[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          <CardDescription>Create and manage coding competitions</CardDescription>
        </div>
        <Link href="/admin/hackathons/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Create Hackathon
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hackathons.map((hackathon) => (
            <div key={hackathon.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="font-medium">{hackathon.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(hackathon.startDate).toLocaleDateString()} - {new Date(hackathon.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hackathon.status === "active" ? "default" : "secondary"}>
                  {hackathon.status}
                </Badge>
                <Button 
                  size="icon" 
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(hackathon.id)}
                  disabled={deleteMutation.isPending}
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

function Analytics({ stats }: { stats?: AdminStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Analytics</CardTitle>
        <CardDescription>Overview of platform performance and engagement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-display text-lg">Recent Activity</h3>
            <div className="space-y-3">
              {stats?.recentUsers?.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">Joined recently</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-display text-lg">Recent Submissions</h3>
            <div className="space-y-3">
              {stats?.recentSubmissions?.slice(0, 5).map((submission, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-sm font-medium">Problem Solved</p>
                    <p className="text-xs text-muted-foreground">Submitted recently</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

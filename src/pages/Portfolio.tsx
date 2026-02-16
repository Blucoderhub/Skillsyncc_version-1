import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Code2, ExternalLink, Github, Plus, Heart, Eye, Star, Folder, Crown, Lock, AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import type { Project } from "@shared/schema";

interface ProjectFormData {
  title: string;
  description: string;
  liveUrl: string;
  repoUrl: string;
  techStack: string;
  isPublic: boolean;
}

export default function Portfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>();

  const { data: subscription } = useQuery<{ membershipStatus: string; membershipTier: string }>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const isClubMember = subscription?.membershipStatus === "active" && 
    ['club_monthly', 'club_yearly'].includes(subscription?.membershipTier || '');

  const { data: myProjects = [], isLoading: projectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: ["/api/portfolio"],
    enabled: !!user && isClubMember,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      return await apiRequest("POST", "/api/portfolio", {
        title: data.title,
        description: data.description,
        techStack: data.techStack.split(",").map(t => t.trim()).filter(Boolean),
        liveUrl: data.liveUrl || null,
        repoUrl: data.repoUrl || null,
        imageUrl: null,
        isPublic: data.isPublic,
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Project created!", 
        description: "Your project has been added to your portfolio." 
      });
      setIsCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: any) => {
      if (error?.message?.includes("Club membership required")) {
        toast({ 
          title: "Club Membership Required", 
          description: "Upgrade to Club to create portfolio projects.",
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Failed to create project", 
          description: error?.message || "Please try again.",
          variant: "destructive" 
        });
      }
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  const featuredProjects = [
    {
      id: 1,
      title: "Weather Dashboard",
      description: "A beautiful weather app built with React and OpenWeather API",
      tags: ["React", "API", "CSS"],
      likes: 42,
      views: 156,
      demoUrl: "https://example.com",
      repoUrl: "https://github.com/example",
      author: "CodeMaster",
      featured: true,
    },
    {
      id: 2,
      title: "Task Manager",
      description: "Full-stack task management app with authentication",
      tags: ["Node.js", "Express", "MongoDB"],
      likes: 38,
      views: 120,
      demoUrl: "https://example.com",
      author: "DevNinja",
      featured: true,
    },
    {
      id: 3,
      title: "Pixel Art Editor",
      description: "Create retro pixel art directly in the browser",
      tags: ["JavaScript", "Canvas", "CSS"],
      likes: 65,
      views: 230,
      demoUrl: "https://example.com",
      author: "PixelPro",
      featured: true,
    },
  ];

  return (
    <div className="retro-container py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Folder className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display text-primary">Project Showcase</h1>
          </div>
          <p className="text-muted-foreground">
            Build your portfolio and showcase your projects to the community
          </p>
        </div>
        {isClubMember && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-project">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Project Title *</label>
                    <Input 
                      placeholder="My Awesome Project" 
                      {...register("title", { required: "Title is required" })}
                      data-testid="input-project-title" 
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea 
                      placeholder="Describe your project..." 
                      {...register("description", { required: "Description is required" })}
                      data-testid="input-project-description" 
                    />
                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Demo URL (optional)</label>
                    <Input 
                      placeholder="https://..." 
                      {...register("liveUrl")}
                      data-testid="input-demo-url" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Repository URL (optional)</label>
                    <Input 
                      placeholder="https://github.com/..." 
                      {...register("repoUrl")}
                      data-testid="input-repo-url" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Technologies (comma separated)</label>
                    <Input 
                      placeholder="React, Node.js, CSS" 
                      {...register("techStack")}
                      data-testid="input-tags" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProjectMutation.isPending}
                    data-testid="button-submit-project"
                  >
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isClubMember && (
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="flex items-center justify-between py-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg">Unlimited Project Hosting</h3>
                <p className="text-sm text-muted-foreground">
                  Join Club to host unlimited projects in your portfolio
                </p>
              </div>
            </div>
            <Button asChild data-testid="button-join-club-portfolio">
              <Link href="/pricing">Join Club</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* My Projects */}
      {user && (
        <section className="mb-12">
          <h2 className="text-xl font-display mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            My Projects
          </h2>
          
          {projectsLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground animate-pulse">Loading projects...</p>
              </CardContent>
            </Card>
          ) : projectsError ? (
            <Card>
              <CardContent className="py-8 text-center">
                {!isClubMember ? (
                  <>
                    <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Upgrade to Club to create portfolio projects</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Unable to load projects</p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : myProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myProjects.map((project) => (
                <Card key={project.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {project.visibility === 'public' ? "public" : "private"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(project.tags || []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {project.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {project.views || 0}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    {project.demoUrl && (
                      <Button size="sm" variant="outline" className="gap-1" asChild>
                        <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" /> Demo
                        </a>
                      </Button>
                    )}
                    {project.repoUrl && (
                      <Button size="sm" variant="ghost" className="gap-1" asChild>
                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="w-3 h-3" /> Code
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : isClubMember ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Folder className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No projects yet</p>
                <p className="text-sm text-muted-foreground">Create your first project to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="text-center py-8">
                <Crown className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upgrade to Club to create projects
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Featured Projects */}
      <section>
        <h2 className="text-xl font-display mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Featured Projects
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredProjects.map((project) => (
            <Card key={project.id} className="hover-elevate">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  {project.featured && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">by {project.author}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {project.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {project.views}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                {project.demoUrl && (
                  <Button size="sm" variant="outline" className="gap-1" asChild>
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" /> Demo
                    </a>
                  </Button>
                )}
                {project.repoUrl && (
                  <Button size="sm" variant="ghost" className="gap-1" asChild>
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-3 h-3" /> Code
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

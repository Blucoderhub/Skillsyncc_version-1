import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  Users,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";

interface OrganizationFormData {
  name: string;
  description: string;
  website: string;
  industry: string;
}

interface Organization {
  id: number;
  name: string;
  description: string;
  industry: string;
  website: string;
  memberCount: number;
  role: string;
}

export default function Organizations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormData>();

  const {
    data: organizations = [],
    isLoading: orgsLoading,
    error: orgsError,
  } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: !!user,
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      return await apiRequest("POST", "/api/organizations", {
        name: data.name,
        description: data.description,
        website: data.website || null,
        industry: data.industry,
      });
    },
    onSuccess: () => {
      toast({
        title: "Organization created!",
        description: "Your organization has been created successfully.",
      });
      setIsCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create organization",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrganizationFormData) => {
    createOrgMutation.mutate(data);
  };

  const industryOptions = [
    "Technology",
    "Education",
    "Finance",
    "Healthcare",
    "Media",
    "Other",
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "bg-primary/20 text-primary";
      case "admin":
        return "bg-secondary/20 text-secondary";
      case "member":
        return "bg-muted/50 text-muted-foreground";
      default:
        return "bg-muted/50 text-muted-foreground";
    }
  };

  return (
    <div className="retro-container py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display text-primary">
              My Organizations
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage organizations to collaborate with your team
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-organization">
              <Plus className="w-4 h-4" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">
                    Organization Name *
                  </label>
                  <Input
                    placeholder="My Organization"
                    {...register("name", {
                      required: "Organization name is required",
                    })}
                    data-testid="input-org-name"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea
                    placeholder="Describe your organization..."
                    {...register("description", {
                      required: "Description is required",
                    })}
                    data-testid="input-org-description"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Website (optional)
                  </label>
                  <Input
                    placeholder="https://..."
                    {...register("website")}
                    data-testid="input-org-website"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Industry *</label>
                  <Select
                    onValueChange={(value) => {
                      register("industry", {
                        required: "Industry is required",
                      }).onChange({
                        target: { value },
                      });
                    }}
                    defaultValue=""
                  >
                    <SelectTrigger data-testid="select-org-industry">
                      <SelectValue placeholder="Select an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.industry.message}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  data-testid="button-submit-org"
                >
                  {createOrgMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organizations Grid */}
      {orgsLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground animate-pulse">
              Loading organizations...
            </p>
          </CardContent>
        </Card>
      ) : orgsError ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Unable to load organizations
            </p>
          </CardContent>
        </Card>
      ) : organizations.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              data-testid={`card-organization-${org.id}`}
            >
              <Card className="pixel-card overflow-hidden h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {org.name}
                      </CardTitle>
                      <Badge
                        className={`text-xs ${getRoleBadgeColor(org.role)}`}
                        data-testid={`badge-role-${org.id}`}
                      >
                        {org.role || "Member"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                    {org.description}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Industry:</span>
                      <Badge variant="outline" className="text-xs">
                        {org.industry}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span
                        className="text-muted-foreground"
                        data-testid={`text-member-count-${org.id}`}
                      >
                        {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                        data-testid={`link-website-${org.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit Website
                      </a>
                    )}
                  </div>

                  <Link href={`/organizations/${org.id}`}>
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      data-testid={`button-manage-${org.id}`}
                    >
                      Manage
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No organizations yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first organization to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

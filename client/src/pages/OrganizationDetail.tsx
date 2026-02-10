import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Building2, Users, Globe, ArrowLeft, UserPlus, Trash2, Shield, Crown
} from "lucide-react";

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  judge: Shield,
  member: Users,
};

const roleBadgeStyles: Record<string, string> = {
  owner: "bg-primary/20 text-primary",
  admin: "bg-secondary/20 text-secondary-foreground",
  judge: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  member: "bg-muted/50 text-muted-foreground",
};

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");

  const { data: organization, isLoading, error } = useQuery<any>({
    queryKey: ["/api/organizations", id],
    enabled: !!id,
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations", id, "members"],
    enabled: !!id && !!user,
  });

  const isOwnerOrAdmin = members.some(
    (m: any) => m.userId === user?.id && ["owner", "admin"].includes(m.role)
  );

  const addMemberMutation = useMutation({
    mutationFn: (data: { userId: string; memberRole: string }) =>
      apiRequest("POST", `/api/organizations/${id}/members`, data),
    onSuccess: () => {
      toast({ title: "Member added", description: "The member has been added to the organization." });
      setIsAddMemberOpen(false);
      setNewMemberUserId("");
      setNewMemberRole("member");
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", id, "members"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add member", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest("DELETE", `/api/organizations/${id}/members/${userId}`),
    onSuccess: () => {
      toast({ title: "Member removed", description: "The member has been removed from the organization." });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", id, "members"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove member", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="retro-container py-20 text-center">
        <p className="font-display text-primary animate-pulse" data-testid="text-loading">Loading organization details...</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="retro-container py-20 text-center">
        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <p className="font-display text-muted-foreground" data-testid="text-not-found">Organization not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/organizations" data-testid="link-back-organizations">Back to Organizations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="retro-container py-8 space-y-8" data-testid="organization-detail-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Button variant="ghost" asChild data-testid="button-back">
          <Link href="/organizations" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Organizations
          </Link>
        </Button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Building2 className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display text-primary" data-testid="text-org-name">
                {organization.name}
              </h1>
              {organization.verified && (
                <Badge className="bg-green-500 text-white" data-testid="badge-verified">
                  Verified
                </Badge>
              )}
            </div>
            {organization.description && (
              <p className="text-muted-foreground max-w-2xl" data-testid="text-org-description">
                {organization.description}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              {organization.industry && (
                <Badge variant="outline" data-testid="badge-industry">
                  {organization.industry}
                </Badge>
              )}
              {organization.website && (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline transition-colors"
                  data-testid="link-website"
                >
                  <Globe className="w-4 h-4" />
                  {organization.website}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isOwnerOrAdmin && (
              <Button variant="outline" asChild data-testid="button-create-hackathon">
                <Link href="/hackathons/create">Create Hackathon</Link>
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Members ({members.length})
            </CardTitle>
            {isOwnerOrAdmin && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-add-member">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">User ID</label>
                      <Input
                        placeholder="Enter user ID"
                        value={newMemberUserId}
                        onChange={(e) => setNewMemberUserId(e.target.value)}
                        data-testid="input-member-user-id"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {["member", "admin", "judge"].map((role) => (
                          <Button
                            key={role}
                            type="button"
                            variant={newMemberRole === role ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewMemberRole(role)}
                            className="toggle-elevate"
                            data-testid={`button-role-${role}`}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => addMemberMutation.mutate({ userId: newMemberUserId, memberRole: newMemberRole })}
                      disabled={!newMemberUserId.trim() || addMemberMutation.isPending}
                      data-testid="button-confirm-add-member"
                    >
                      {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No members yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member: any) => {
                  const RoleIcon = roleIcons[member.role] || Users;
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/30 flex-wrap gap-2"
                      data-testid={`member-row-${member.userId}`}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <RoleIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium" data-testid={`text-member-id-${member.userId}`}>
                          {member.userId}
                        </span>
                        <Badge
                          className={`text-xs ${roleBadgeStyles[member.role] || roleBadgeStyles.member}`}
                          data-testid={`badge-member-role-${member.userId}`}
                        >
                          {member.role}
                        </Badge>
                      </div>
                      {isOwnerOrAdmin && member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMemberMutation.mutate(member.userId)}
                          disabled={removeMemberMutation.isPending}
                          data-testid={`button-remove-member-${member.userId}`}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
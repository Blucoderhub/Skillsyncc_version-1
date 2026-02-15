import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rocket, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Organization {
  id: number;
  name: string;
}

interface CreateHackathonFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: string;
  prizePool: string;
  rules: string;
  imageUrl: string;
  tags: string;
  hostOrgId: string;
}

export default function CreateHackathon() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateHackathonFormData>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxParticipants: "",
    prizePool: "",
    rules: "",
    imageUrl: "",
    tags: "",
    hostOrgId: "",
  });

  const {
    data: organizations = [],
    isLoading: orgsLoading,
  } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateHackathonFormData) => {
      return await apiRequest("POST", "/api/hosted-hackathons", {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline).toISOString()
          : null,
        maxParticipants: data.maxParticipants
          ? parseInt(data.maxParticipants, 10)
          : null,
        prizePool: data.prizePool || null,
        rules: data.rules || null,
        imageUrl: data.imageUrl || null,
        tags: data.tags
          ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        hostOrgId: data.hostOrgId ? parseInt(data.hostOrgId, 10) : null,
        url: "",
        platform: "Skillsyncc",
      });
    },
    onSuccess: () => {
      toast({
        title: "Hackathon created!",
        description: "Your hackathon has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hosted-hackathons"] });
      navigate("/hackathons");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create hackathon",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      hostOrgId: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDate) {
      toast({
        title: "Validation Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.endDate) {
      toast({
        title: "Validation Error",
        description: "End date is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.hostOrgId) {
      toast({
        title: "Validation Error",
        description: "Please select a host organization",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="retro-container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Rocket className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-display text-primary">Create Hackathon</h1>
      </div>

      <Card className="pixel-card max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display">New Hackathon Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Web Development Challenge 2026"
                value={formData.title}
                onChange={handleChange}
                data-testid="input-hackathon-title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your hackathon, its goals, and what participants will learn..."
                rows={4}
                value={formData.description}
                onChange={handleChange}
                data-testid="input-hackathon-description"
              />
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  data-testid="input-start-date"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  End Date *
                </Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {/* Registration Deadline & Max Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registration Deadline */}
              <div className="space-y-2">
                <Label
                  htmlFor="registrationDeadline"
                  className="text-sm font-medium"
                >
                  Registration Deadline
                </Label>
                <Input
                  id="registrationDeadline"
                  name="registrationDeadline"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  data-testid="input-registration-deadline"
                />
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label
                  htmlFor="maxParticipants"
                  className="text-sm font-medium"
                >
                  Max Participants
                </Label>
                <Input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  data-testid="input-max-participants"
                />
              </div>
            </div>

            {/* Prize Pool */}
            <div className="space-y-2">
              <Label htmlFor="prizePool" className="text-sm font-medium">
                Prize Pool
              </Label>
              <Input
                id="prizePool"
                name="prizePool"
                placeholder="e.g., $5,000"
                value={formData.prizePool}
                onChange={handleChange}
                data-testid="input-prize-pool"
              />
            </div>

            {/* Rules */}
            <div className="space-y-2">
              <Label htmlFor="rules" className="text-sm font-medium">
                Rules
              </Label>
              <Textarea
                id="rules"
                name="rules"
                placeholder="Enter the rules and guidelines for your hackathon..."
                rows={4}
                value={formData.rules}
                onChange={handleChange}
                data-testid="input-rules"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm font-medium">
                Image URL
              </Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={handleChange}
                data-testid="input-image-url"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags (comma-separated)
              </Label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g., web, javascript, react, nodejs"
                value={formData.tags}
                onChange={handleChange}
                data-testid="input-tags"
              />
            </div>

            {/* Host Organization */}
            <div className="space-y-2">
              <Label htmlFor="hostOrg" className="text-sm font-medium">
                Host Organization *
              </Label>
              <Select
                value={formData.hostOrgId}
                onValueChange={handleSelectChange}
                disabled={orgsLoading || organizations.length === 0}
              >
                <SelectTrigger
                  id="hostOrg"
                  data-testid="select-host-organization"
                >
                  <SelectValue placeholder="Select your organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {organizations.length === 0 && !orgsLoading && (
                <p className="text-xs text-muted-foreground">
                  You need to create or be part of an organization first.
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/hackathons")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || orgsLoading}
                className="flex-1 gap-2"
                data-testid="button-submit-hackathon"
              >
                {createMutation.isPending ? "Creating..." : "Create Hackathon"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

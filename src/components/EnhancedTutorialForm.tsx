import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Plus, Save, Upload } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface EnhancedTutorialFormProps {
  trigger?: React.ReactNode;
  tutorial?: any;
  mode?: "create" | "edit";
}

export default function EnhancedTutorialForm({ 
  trigger, 
  tutorial, 
  mode = "create" 
}: EnhancedTutorialFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: tutorial?.title || "",
    slug: tutorial?.slug || "",
    description: tutorial?.description || "",
    category: tutorial?.category || "Python",
    difficulty: tutorial?.difficulty || "Beginner",
    order: tutorial?.order || 0,
    xpReward: tutorial?.xpReward || 500,
    imageUrl: tutorial?.imageUrl || "",
    videoUrl: tutorial?.videoUrl || "",
    videoThumbnail: tutorial?.videoThumbnail || "",
    videoDuration: tutorial?.videoDuration || "",
    content: tutorial?.content || "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => 
      mode === "create" 
        ? apiRequest("POST", "/api/admin/tutorials", data)
        : apiRequest("PUT", `/api/admin/tutorials/${tutorial.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tutorials"] });
      setIsOpen(false);
      setForm({
        title: "", slug: "", description: "", category: "Python", 
        difficulty: "Beginner", order: 0, xpReward: 500, imageUrl: "", 
        videoUrl: "", videoThumbnail: "", videoDuration: "", content: ""
      });
      toast({ 
        title: mode === "create" ? "Tutorial created successfully" : "Tutorial updated successfully" 
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save tutorial",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ title: "Please fill in title and slug", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-tutorial">
            <Plus className="w-4 h-4 mr-2" /> 
            {mode === "create" ? "Add Tutorial" : "Edit Tutorial"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Tutorial" : "Edit Tutorial"}
          </DialogTitle>
          <DialogDescription>
            Create engaging learning content with rich markdown formatting
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title *</Label>
              <Input 
                value={form.title} 
                onChange={(e) => {
                  const title = e.target.value;
                  setForm({ ...form, title });
                  if (mode === "create" && !form.slug) {
                    setForm(prev => ({ ...prev, slug: generateSlug(title) }));
                  }
                }}
                placeholder="Enter tutorial title"
                data-testid="input-tutorial-title"
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input 
                value={form.slug} 
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="tutorial-slug"
                data-testid="input-tutorial-slug"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              value={form.description} 
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the tutorial"
              rows={2}
              data-testid="input-tutorial-description"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                  <SelectItem value="React">React</SelectItem>
                  <SelectItem value="Node.js">Node.js</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
            <div>
              <Label>XP Reward</Label>
              <Input 
                type="number" 
                value={form.xpReward} 
                onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) || 0 })}
                placeholder="500"
              />
            </div>
          </div>

          <div>
            <Label>Image URL (Optional)</Label>
            <Input 
              value={form.imageUrl} 
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Video Support */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Video URL (Optional)</Label>
              <Input 
                value={form.videoUrl} 
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or direct video URL"
              />
            </div>
            <div>
              <Label>Video Thumbnail (Optional)</Label>
              <Input 
                value={form.videoThumbnail} 
                onChange={(e) => setForm({ ...form, videoThumbnail: e.target.value })}
                placeholder="https://example.com/video-thumbnail.jpg"
              />
            </div>
          </div>
          <div>
            <Label>Video Duration (Optional)</Label>
            <Input 
              value={form.videoDuration} 
              onChange={(e) => setForm({ ...form, videoDuration: e.target.value })}
              placeholder="15:30 (minutes:seconds)"
            />
          </div>

          {/* Content Editor */}
          <div>
            <Label>Tutorial Content</Label>
            <div className="mt-2">
              <MarkdownEditor
                value={form.content}
                onChange={(content) => setForm({ ...form, content })}
                placeholder="Write your tutorial content here... Use markdown for formatting, code blocks, lists, etc."
                height="400px"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || !form.title.trim() || !form.slug.trim()}
            data-testid="button-save-tutorial"
          >
            {createMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === "create" ? "Create Tutorial" : "Update Tutorial"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, Eye, CheckCircle2, Clock, Plus, Search, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Discussion } from "@shared/schema";

type DiscussionWithAuthor = Discussion & { authorName: string };

export default function Discussions() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");

  const { data: discussions, isLoading } = useQuery<DiscussionWithAuthor[]>({
    queryKey: ['/api/discussions'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; tags: string[] }) => {
      const response = await apiRequest('POST', '/api/discussions', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Question Posted!", description: "Your question is now live." });
      queryClient.invalidateQueries({ queryKey: ['/api/discussions'] });
      setDialogOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      navigate(`/discussions/${data.id}`);
    },
  });

  const filteredDiscussions = discussions?.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="retro-container text-center py-20">
        <p className="font-display text-primary animate-pulse">Loading Discussions...</p>
      </div>
    );
  }

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "recently";
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="retro-container space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl text-primary drop-shadow-lg flex items-center gap-3">
            <MessageSquare className="w-10 h-10" />
            Community
          </h1>
          <p className="text-muted-foreground mt-2">
            Ask questions, share knowledge, and help fellow coders
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-ask-question">
              <Plus className="w-4 h-4" />
              Ask Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What's your question?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  data-testid="input-question-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Details</Label>
                <Textarea
                  id="content"
                  placeholder="Explain your question in detail..."
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  data-testid="input-question-content"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="python, algorithms, help"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  data-testid="input-question-tags"
                />
              </div>
              <Button
                onClick={() => {
                  createMutation.mutate({
                    title: newTitle,
                    content: newContent,
                    tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
                  });
                }}
                disabled={!newTitle.trim() || !newContent.trim() || createMutation.isPending}
                className="w-full"
                data-testid="button-submit-question"
              >
                {createMutation.isPending ? "Posting..." : "Post Question"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search discussions..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-discussions"
        />
      </div>

      <div className="space-y-4">
        {filteredDiscussions?.map((discussion, i) => (
          <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="pixel-card p-5 cursor-pointer group hover:border-primary/30 transition-colors"
              data-testid={`card-discussion-${discussion.id}`}
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2 text-center min-w-[60px]">
                  <div className="flex items-center gap-1 text-sm">
                    <ThumbsUp className="w-4 h-4" />
                    {discussion.upvotes || 0}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm px-2 py-1 rounded",
                    (discussion.answersCount || 0) > 0
                      ? "bg-green-500/10 text-green-500"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <MessageSquare className="w-4 h-4" />
                    {discussion.answersCount || 0}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    {discussion.views || 0}
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold normal-case group-hover:text-primary transition-colors">
                      {discussion.isSolved && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 inline mr-2" />
                      )}
                      {discussion.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {discussion.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    {discussion.tags?.map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(discussion.createdAt)} by {discussion.authorName}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}

        {(!filteredDiscussions || filteredDiscussions.length === 0) && (
          <div className="pixel-card p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "No discussions match your search" : "No discussions yet. Be the first to ask!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

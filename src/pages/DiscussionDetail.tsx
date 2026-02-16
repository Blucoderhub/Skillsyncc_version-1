import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, ThumbsDown, ChevronLeft, CheckCircle2, Clock, User, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Discussion, Answer } from "@shared/schema";

type DiscussionWithDetails = Discussion & {
  authorName: string;
  answers: (Answer & { authorName: string })[];
};

export default function DiscussionDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [newAnswer, setNewAnswer] = useState("");

  const { data: discussion, isLoading } = useQuery<DiscussionWithDetails>({
    queryKey: ['/api/discussions', id],
  });

  const answerMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/discussions/${id}/answers`, { content });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Answer Posted!", description: "Thanks for helping!" });
      queryClient.invalidateQueries({ queryKey: ['/api/discussions', id] });
      setNewAnswer("");
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (value: number) => {
      const response = await apiRequest('POST', `/api/discussions/${id}/vote`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions', id] });
    },
  });

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "recently";
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="retro-container text-center py-20">
        <p className="font-display text-primary animate-pulse">Loading Discussion...</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="retro-container text-center py-20">
        <p className="text-muted-foreground">Discussion not found</p>
        <Link href="/discussions">
          <Button variant="outline" className="mt-4">Back to Discussions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="retro-container space-y-6">
      <Link href="/discussions">
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-discussions">
          <ChevronLeft className="w-4 h-4" />
          Back to Discussions
        </Button>
      </Link>

      <div className="pixel-card p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => voteMutation.mutate(1)}
              data-testid="button-upvote"
            >
              <ThumbsUp className="w-5 h-5" />
            </Button>
            <span className="text-lg font-bold">{discussion.upvotes || 0}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => voteMutation.mutate(-1)}
              data-testid="button-downvote"
            >
              <ThumbsDown className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-grow">
            <h1 className="text-2xl font-bold normal-case">
              {discussion.isSolved && (
                <CheckCircle2 className="w-6 h-6 text-green-500 inline mr-2" />
              )}
              {discussion.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {discussion.authorName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTimeAgo(discussion.createdAt)}
              </span>
            </div>
            <div className="mt-4 prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{discussion.content}</p>
            </div>
            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex gap-2 mt-4">
                {discussion.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {discussion.answers?.length || 0} Answers
        </h2>

        {discussion.answers?.map((answer, i) => (
          <motion.div
            key={answer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "pixel-card p-5",
              answer.isAccepted && "border-green-500/30 bg-green-500/5"
            )}
            data-testid={`card-answer-${answer.id}`}
          >
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2 min-w-[50px]">
                <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{answer.upvotes || 0}</span>
                {answer.isAccepted && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="flex-grow">
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{answer.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {answer.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(answer.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="pixel-card p-5 space-y-4">
          <h3 className="font-bold">Your Answer</h3>
          <Textarea
            placeholder="Share your knowledge..."
            rows={6}
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            data-testid="input-answer"
          />
          <Button
            onClick={() => answerMutation.mutate(newAnswer)}
            disabled={!newAnswer.trim() || answerMutation.isPending}
            className="gap-2"
            data-testid="button-submit-answer"
          >
            <Send className="w-4 h-4" />
            {answerMutation.isPending ? "Posting..." : "Post Answer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

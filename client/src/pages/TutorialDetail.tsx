import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, CheckCircle2, Circle, Play, Star, Code2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Tutorial, Lesson } from "@shared/schema";
import { useState } from "react";

type TutorialWithLessons = Tutorial & { lessons: Lesson[] };

export default function TutorialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const { data: tutorial, isLoading } = useQuery<TutorialWithLessons>({
    queryKey: ['/api/tutorials', slug],
  });

  const completeMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await apiRequest('POST', `/api/lessons/${lessonId}/complete`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Lesson Complete!",
        description: `You earned ${data.xpEarned} XP`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
    },
  });

  if (isLoading) {
    return (
      <div className="retro-container text-center py-20">
        <p className="font-display text-primary animate-pulse">Loading Tutorial...</p>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="retro-container text-center py-20">
        <p className="text-muted-foreground">Tutorial not found</p>
        <Link href="/tutorials">
          <Button variant="outline" className="mt-4">Back to Tutorials</Button>
        </Link>
      </div>
    );
  }

  const currentLesson = selectedLesson || tutorial.lessons?.[0];

  return (
    <div className="retro-container space-y-6">
      <Link href="/tutorials">
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-tutorials">
          <ChevronLeft className="w-4 h-4" />
          Back to Tutorials
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="pixel-card p-4">
            <h2 className="font-bold text-lg mb-2 normal-case">{tutorial.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{tutorial.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="w-3 h-3 text-yellow-500" />
              {tutorial.xpReward} XP total
            </div>
            {tutorial.videoDuration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Video className="w-3 h-3" />
                {tutorial.videoDuration}
              </div>
            )}
          </div>

          <div className="pixel-card p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Lessons
            </h3>
            <div className="space-y-2">
              {tutorial.lessons?.map((lesson, i) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
                    currentLesson?.id === lesson.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  )}
                  data-testid={`button-lesson-${lesson.id}`}
                >
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm flex-grow normal-case">{lesson.title}</span>
                  <Circle className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {/* Video Player */}
          {tutorial.videoUrl && (
            <Card className="mb-6 overflow-hidden">
              <div className="aspect-video bg-muted">
                {tutorial.videoUrl.includes('youtube.com') || tutorial.videoUrl.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full"
                    src={tutorial.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    title={tutorial.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    className="w-full h-full"
                    controls
                    poster={tutorial.videoThumbnail || undefined}
                  >
                    <source src={tutorial.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
              {tutorial.videoThumbnail && !tutorial.videoUrl.includes('youtube') && (
                <div className="p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">Video tutorial for {tutorial.title}</p>
                </div>
              )}
            </Card>
          )}

          {currentLesson ? (
            <motion.div
              key={currentLesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pixel-card p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold normal-case">{currentLesson.title}</h1>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {currentLesson.xpReward} XP
                </span>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {currentLesson.content}
                </div>
              </div>

              {currentLesson.codeExample && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Try it yourself
                  </h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm font-mono text-foreground">
                      {currentLesson.codeExample}
                    </code>
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  onClick={() => completeMutation.mutate(currentLesson.id)}
                  disabled={completeMutation.isPending}
                  className="gap-2"
                  data-testid="button-complete-lesson"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {completeMutation.isPending ? "Completing..." : "Mark as Complete"}
                </Button>

                {tutorial.lessons && tutorial.lessons.indexOf(currentLesson) < tutorial.lessons.length - 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextIndex = tutorial.lessons.indexOf(currentLesson) + 1;
                      setSelectedLesson(tutorial.lessons[nextIndex]);
                    }}
                    className="gap-2"
                    data-testid="button-next-lesson"
                  >
                    Next Lesson
                    <Play className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="pixel-card p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a lesson to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

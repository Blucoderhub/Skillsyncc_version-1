import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft, Clock, Code, CheckCircle2, XCircle, BookOpen, Star
} from "lucide-react";

type ContentSection = {
  id: string;
  type: string;
  content?: string;
  language?: string;
  code?: string;
  runnable?: boolean;
  expectedOutput?: string;
  explanation?: string;
  url?: string;
  alt?: string;
  caption?: string;
  question?: string;
  questionType?: string;
  options?: string[];
  correctAnswer?: number;
  starterCode?: string;
  solution?: string;
  instructions?: string;
};

export default function ContentViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [showQuizResults, setShowQuizResults] = useState<Record<string, boolean>>({});
  const [interactiveCode, setInteractiveCode] = useState<Record<string, string>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});

  const { data: content, isLoading } = useQuery<any>({
    queryKey: ["/api/cms/content/slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/cms/content/slug/${slug}`);
      if (!res.ok) throw new Error("Content not found");
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/cms/content/${content.id}/complete`);
    },
    onSuccess: () => {
      toast({ title: "Tutorial completed!", description: "Great job finishing this content." });
    },
  });

  const handleQuizAnswer = (sectionId: string, optionIndex: number) => {
    setQuizAnswers(prev => ({ ...prev, [sectionId]: optionIndex }));
    setShowQuizResults(prev => ({ ...prev, [sectionId]: true }));
  };

  const renderSection = (section: ContentSection) => {
    switch (section.type) {
      case "text":
        return (
          <div key={section.id} className="prose prose-invert max-w-none" data-testid={`text-section-${section.id}`}>
            <div dangerouslySetInnerHTML={{ __html: section.content || "" }} />
          </div>
        );

      case "code":
        return (
          <Card key={section.id} className="bg-[#1e1e1e] overflow-hidden" data-testid={`code-section-${section.id}`}>
            <CardContent className="p-0">
              <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
                <Code className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">{section.language}</span>
                {section.runnable && <Badge variant="outline" className="text-xs">Runnable</Badge>}
              </div>
              <pre className="p-4 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre"><code>{section.code}</code></pre>
              {section.explanation && (
                <div className="px-4 py-3 border-t border-border/40 text-sm text-muted-foreground bg-muted/30">
                  {section.explanation}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "interactive_code":
        return (
          <Card key={section.id} className="overflow-hidden" data-testid={`interactive-section-${section.id}`}>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Interactive Code</span>
                  <Badge variant="outline" className="text-xs">{section.language}</Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSolution(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                  data-testid={`btn-toggle-solution-${section.id}`}
                >
                  {showSolution[section.id] ? "Hide Solution" : "Show Solution"}
                </Button>
              </div>
              {section.instructions && (
                <div className="px-4 py-2 bg-muted/30 text-sm border-b">{section.instructions}</div>
              )}
              <div className="border-b">
                <Editor
                  height="200px"
                  language={section.language || "javascript"}
                  theme="vs-dark"
                  value={interactiveCode[section.id] ?? section.starterCode ?? ""}
                  onChange={(v) => setInteractiveCode(prev => ({ ...prev, [section.id]: v || "" }))}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                />
              </div>
              {showSolution[section.id] && section.solution && (
                <div className="border-t">
                  <div className="px-3 py-1 bg-green-500/10 text-xs font-medium text-green-400">Solution</div>
                  <pre className="p-4 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre bg-[#1e1e1e]"><code>{section.solution}</code></pre>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "image":
        return section.url ? (
          <figure key={section.id} className="my-4" data-testid={`image-section-${section.id}`}>
            <img src={section.url} alt={section.alt || ""} className="rounded-md max-w-full mx-auto" />
            {section.caption && (
              <figcaption className="text-sm text-muted-foreground mt-2 text-center">{section.caption}</figcaption>
            )}
          </figure>
        ) : null;

      case "quiz":
        const isAnswered = showQuizResults[section.id];
        const selectedAnswer = quizAnswers[section.id];
        const isCorrect = selectedAnswer === section.correctAnswer;
        return (
          <Card key={section.id} data-testid={`quiz-section-${section.id}`}>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold">{section.question}</p>
              <div className="space-y-2">
                {(section.options || []).map((opt, i) => {
                  let classes = "p-3 rounded-md border cursor-pointer transition-colors";
                  if (isAnswered) {
                    if (i === section.correctAnswer) classes += " border-green-500 bg-green-500/10";
                    else if (i === selectedAnswer && !isCorrect) classes += " border-destructive bg-destructive/10";
                    else classes += " border-border opacity-60";
                  } else {
                    classes += selectedAnswer === i ? " border-primary bg-primary/10" : " border-border hover-elevate";
                  }
                  return (
                    <div
                      key={i}
                      className={classes}
                      onClick={() => !isAnswered && handleQuizAnswer(section.id, i)}
                      data-testid={`quiz-option-${section.id}-${i}`}
                    >
                      <div className="flex items-center gap-2">
                        {isAnswered && i === section.correctAnswer && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                        {isAnswered && i === selectedAnswer && !isCorrect && i !== section.correctAnswer && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                        <span>{opt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isAnswered && section.explanation && (
                <div className={`p-3 rounded-md text-sm ${isCorrect ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                  {section.explanation}
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin" /></div>;
  }

  if (!content) {
    return (
      <div className="retro-container py-20 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Content Not Found</h1>
        <p className="text-muted-foreground mb-4">The content you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/tutorials")} data-testid="btn-back-tutorials">Back to Tutorials</Button>
      </div>
    );
  }

  const sections: ContentSection[] = content.contentJson?.sections || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" onClick={() => navigate(-1 as any)} className="mb-4" data-testid="btn-back">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-['Press_Start_2P'] text-primary mb-4" data-testid="content-title">
            {content.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge data-testid="badge-difficulty">{content.difficultyLevel}</Badge>
            <Badge variant="outline" data-testid="badge-category">{content.category}</Badge>
            <Badge variant="outline" data-testid="badge-type">{content.contentType}</Badge>
            {content.estimatedMinutes && (
              <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{content.estimatedMinutes} min</Badge>
            )}
            {content.isPremium && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Star className="w-3 h-3 mr-1" />Premium</Badge>}
          </div>
        </div>

        <div className="space-y-6">
          {sections.map(renderSection)}
        </div>

        {sections.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              data-testid="btn-complete"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {completeMutation.isPending ? "Completing..." : "Mark as Complete"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

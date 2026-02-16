import { useParams, useLocation } from "wouter";
import { useProblem, useSubmitCode } from "@/hooks/use-problems";
import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import { Play, CheckCircle, XCircle, RotateCcw, ChevronLeft, Loader2 } from "lucide-react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ProblemDetail() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const { data: problem, isLoading } = useProblem(slug!);
  const submitMutation = useSubmitCode();
  const { toast } = useToast();
  
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Set initial code when problem loads
  useEffect(() => {
    if (problem?.starterCode && !initialized) {
      setCode(problem.starterCode);
      setInitialized(true);
    }
  }, [problem, initialized]);

  if (isLoading) return <div className="text-center py-20 animate-pulse text-primary">Loading Quest...</div>;
  if (!problem) return <div className="text-center py-20 text-destructive">Quest not found</div>;

  const handleRun = () => {
    setOutput(null);
    submitMutation.mutate(
      { id: problem.id, code, language: "python" },
      {
        onSuccess: (data) => {
          setOutput(data.output);
          if (data.passed) {
            setShowConfetti(true);
            toast({
              title: "Quest Completed!",
              description: `You earned ${data.xpEarned || 10} XP!`,
              variant: "default",
              className: "bg-secondary text-secondary-foreground border-secondary"
            });
            setTimeout(() => setShowConfetti(false), 5000);
          } else {
            toast({
              title: "Tests Failed",
              description: "Check your logic and try again.",
              variant: "destructive"
            });
          }
        },
        onError: (err) => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-background">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      {/* Left Panel: Problem Description */}
      <div className="w-full md:w-1/3 border-r-2 border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border bg-background/50 flex items-center gap-4">
          <button 
            onClick={() => setLocation("/quests")}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-sm tracking-tight">{problem.title}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-primary">Example</h3>
            <div className="bg-background border border-border rounded-lg p-3 font-mono text-xs">
              <div className="text-muted-foreground mb-1">Input:</div>
              <div className="mb-2 pl-2 border-l-2 border-primary/50">
                {problem.testCases[0]?.input || "None"}
              </div>
              <div className="text-muted-foreground mb-1">Output:</div>
              <div className="pl-2 border-l-2 border-secondary/50">
                {problem.testCases[0]?.expected || "None"}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-background/50 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Difficulty: <span className="text-foreground font-bold">{problem.difficulty}</span></span>
          <span className="text-muted-foreground">XP Reward: <span className="text-secondary font-bold">+{problem.xpReward} XP</span></span>
        </div>
      </div>

      {/* Right Panel: Editor */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        <div className="h-full relative">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', monospace",
              padding: { top: 20 },
              scrollBeyondLastLine: false,
            }}
          />
          
          {/* Action Bar Overlay */}
          <div className="absolute bottom-6 right-6 flex gap-3 z-10">
            <button 
              onClick={() => setCode(problem.starterCode)}
              className="p-3 bg-card border border-border text-muted-foreground rounded-lg shadow-lg hover:text-foreground transition-colors"
              title="Reset Code"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={handleRun}
              disabled={submitMutation.isPending}
              className={cn(
                "pixel-btn-primary flex items-center gap-2",
                submitMutation.isPending && "opacity-80 cursor-not-allowed"
              )}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
              {submitMutation.isPending ? "Running..." : "Run Code"}
            </button>
          </div>
        </div>

        {/* Output Console */}
        <AnimatePresence>
          {output !== null && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "30%" }}
              exit={{ height: 0 }}
              className="border-t-2 border-border bg-card overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50">
                <span className="text-xs font-mono uppercase text-muted-foreground">Console Output</span>
                <button 
                  onClick={() => setOutput(null)}
                  className="text-xs hover:text-foreground text-muted-foreground"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                <div className="flex items-start gap-3">
                  {submitMutation.data?.passed ? (
                    <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <p className={submitMutation.data?.passed ? "text-secondary" : "text-destructive"}>
                      {submitMutation.data?.passed ? "All Test Cases Passed!" : "Execution Failed"}
                    </p>
                    <pre className="text-muted-foreground whitespace-pre-wrap">{output}</pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

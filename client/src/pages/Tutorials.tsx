import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Star, ChevronRight, Code2, FileCode, Database, Globe, Cpu, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tutorial } from "@shared/schema";
import { SiPython, SiHtml5, SiCss3, SiJavascript } from "react-icons/si";

export default function Tutorials() {
  const { data: tutorials, isLoading } = useQuery<Tutorial[]>({
    queryKey: ['/api/tutorials'],
  });

  if (isLoading) {
    return (
      <div className="retro-container text-center py-20">
        <p className="font-display text-primary animate-pulse">Loading Courses...</p>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Python: "from-green-500/20 to-green-600/10 border-green-500/30",
    HTML: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    CSS: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    JavaScript: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
    SQL: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    Algorithms: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Python": return <SiPython className="w-6 h-6 text-green-500" />;
      case "HTML": return <SiHtml5 className="w-6 h-6 text-orange-500" />;
      case "CSS": return <SiCss3 className="w-6 h-6 text-blue-500" />;
      case "JavaScript": return <SiJavascript className="w-6 h-6 text-yellow-500" />;
      case "SQL": return <Database className="w-6 h-6 text-purple-500" />;
      case "Algorithms": return <Cpu className="w-6 h-6 text-pink-500" />;
      default: return <Code2 className="w-6 h-6 text-muted-foreground" />;
    }
  };

  return (
    <div className="retro-container space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl text-primary drop-shadow-lg flex items-center justify-center gap-3">
          <BookOpen className="w-10 h-10" />
          Learning Paths
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Master programming from the ground up. Follow structured courses to build your skills step by step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials?.map((tutorial, i) => (
          <Link key={tutorial.id} href={`/tutorials/${tutorial.slug}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "pixel-card p-6 bg-gradient-to-br cursor-pointer group h-full flex flex-col",
                categoryColors[tutorial.category] || "from-muted/20 to-muted/10 border-muted/30"
              )}
              data-testid={`card-tutorial-${tutorial.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center">
                  {getCategoryIcon(tutorial.category)}
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded font-mono uppercase border",
                  tutorial.difficulty === "Beginner" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                  tutorial.difficulty === "Intermediate" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                  "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {tutorial.difficulty}
                </span>
              </div>

              <h3 className="text-lg font-bold normal-case group-hover:text-primary transition-colors mb-2">
                {tutorial.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">
                {tutorial.description}
              </p>

              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {tutorial.lessonsCount || 0} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {tutorial.xpReward} XP
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {(!tutorials || tutorials.length === 0) && (
        <div className="pixel-card p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tutorials available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

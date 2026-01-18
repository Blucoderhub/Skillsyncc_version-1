import { useQuery } from "@tanstack/react-query";
import { useUserStats } from "@/hooks/use-user-stats";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Trophy, Flame, Target, ChevronRight, Star, Calendar, Clock, Zap, BookOpen, MessageSquare, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ProblemResponse, DailyChallenge } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useUserStats();
  
  const { data: problems, isLoading: problemsLoading } = useQuery<ProblemResponse[]>({
    queryKey: ['/api/problems'],
  });

  const { data: dailyChallenge } = useQuery<DailyChallenge & { problem: ProblemResponse }>({
    queryKey: ['/api/daily-challenge'],
  });

  if (statsLoading || problemsLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-display text-primary animate-pulse">Loading User Data...</p>
        </div>
      </div>
    );
  }

  const currentLevelXP = stats?.xp || 0;
  const xpForNextLevel = ((stats?.level || 1) + 1) * 500;
  const progressPercent = Math.min((currentLevelXP / xpForNextLevel) * 100, 100);

  const nextQuest = problems?.find(p => !p.isSolved) || problems?.[0];
  const solvedCount = problems?.filter(p => p.isSolved).length || 0;

  return (
    <main className="retro-container space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 pixel-card p-6 bg-gradient-to-br from-card to-card/50 relative overflow-hidden"
          data-testid="card-level-progress"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-32 h-32 text-primary" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <span className="text-primary" data-testid="text-user-level">Level {stats?.level || 1}</span>
              <span className="text-sm text-muted-foreground font-body normal-case">Architect</span>
            </h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span data-testid="text-current-xp">XP: {currentLevelXP.toLocaleString()}</span>
                <span>Next Level: {xpForNextLevel.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden border border-border">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-secondary relative"
                  data-testid="progress-xp"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)50%,rgba(255,255,255,0.15)75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {xpForNextLevel - currentLevelXP > 0 
                  ? `${(xpForNextLevel - currentLevelXP).toLocaleString()} XP until next level`
                  : "Ready to level up!"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="pixel-card p-6 flex flex-col justify-center items-center text-center bg-background border-secondary/20"
          data-testid="card-streak"
        >
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
            <Flame className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-3xl font-display text-secondary mb-1" data-testid="text-streak">{stats?.streak || 0}</h3>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">Day Streak</p>
        </motion.div>
      </div>

      {dailyChallenge?.problem && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          data-testid="section-daily-challenge"
        >
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-500" />
            Daily Challenge
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Resets at midnight
            </span>
          </h3>
          <Link href={`/quests/${dailyChallenge.problem.slug}`}>
            <div 
              className="pixel-card p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 cursor-pointer group"
              data-testid="card-daily-challenge"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {dailyChallenge.bonusXp}x XP Bonus
                    </span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded font-mono uppercase border",
                      dailyChallenge.problem.difficulty === "Easy" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                      dailyChallenge.problem.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {dailyChallenge.problem.difficulty}
                    </span>
                  </div>
                  <h4 className="text-xl group-hover:text-yellow-500 transition-colors normal-case font-bold" data-testid="text-daily-title">
                    {dailyChallenge.problem.title}
                  </h4>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
                    {dailyChallenge.problem.description}
                  </p>
                </div>
                <Button variant="default" data-testid="button-accept-daily">
                  <Zap className="w-4 h-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          </Link>
        </motion.section>
      )}

      <section data-testid="section-next-quest">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          Continue Your Journey
        </h3>
        {nextQuest ? (
          <Link href={`/quests/${nextQuest.slug}`}>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="pixel-card p-6 bg-accent/5 border-accent/20 cursor-pointer group flex items-center justify-between"
              data-testid="card-next-quest"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-mono uppercase border",
                    nextQuest.difficulty === "Easy" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    nextQuest.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {nextQuest.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{nextQuest.category}</span>
                </div>
                <h4 className="text-xl group-hover:text-accent transition-colors normal-case font-bold" data-testid="text-next-quest-title">{nextQuest.title}</h4>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{nextQuest.description}</p>
              </div>
              <div className="h-10 w-10 bg-background rounded-lg border-2 border-border flex items-center justify-center group-hover:border-accent transition-colors">
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
              </div>
            </motion.div>
          </Link>
        ) : (
          <div className="pixel-card p-6 text-center text-muted-foreground">
            All quests completed! Check back for more challenges.
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Problems Solved", value: solvedCount, icon: Star, color: "text-yellow-500", testId: "stat-solved" },
          { label: "Current Level", value: stats?.level || 1, icon: Trophy, color: "text-purple-500", testId: "stat-level" },
          { label: "Total XP", value: currentLevelXP.toLocaleString(), icon: Zap, color: "text-blue-500", testId: "stat-xp" },
          { label: "Day Streak", value: stats?.streak || 0, icon: Flame, color: "text-orange-500", testId: "stat-streak" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="pixel-card p-4 flex flex-col items-center justify-center text-center gap-2"
            data-testid={stat.testId}
          >
            <stat.icon className={cn("w-5 h-5", stat.color)} />
            <span className="text-2xl font-display">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/tutorials">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pixel-card p-5 cursor-pointer group hover:border-primary/30 transition-colors"
            data-testid="card-quick-learn"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-bold group-hover:text-primary transition-colors">Learn</h4>
                <p className="text-xs text-muted-foreground">Structured tutorials and courses</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:text-primary" />
            </div>
          </motion.div>
        </Link>

        <Link href="/discussions">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pixel-card p-5 cursor-pointer group hover:border-secondary/30 transition-colors"
            data-testid="card-quick-community"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h4 className="font-bold group-hover:text-secondary transition-colors">Community</h4>
                <p className="text-xs text-muted-foreground">Ask questions and help others</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:text-secondary" />
            </div>
          </motion.div>
        </Link>

        <Link href="/practice">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pixel-card p-5 cursor-pointer group hover:border-accent/30 transition-colors"
            data-testid="card-quick-practice"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Code2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h4 className="font-bold group-hover:text-accent transition-colors">Practice</h4>
                <p className="text-xs text-muted-foreground">Code in 8+ languages</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:text-accent" />
            </div>
          </motion.div>
        </Link>
      </div>
    </main>
  );
}

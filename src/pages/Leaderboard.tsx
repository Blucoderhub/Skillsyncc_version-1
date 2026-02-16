import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Star, Flame, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { LeaderboardEntry } from "@shared/schema";

export default function Leaderboard() {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
  });

  if (isLoading) {
    return (
      <div className="retro-container text-center py-20">
        <p className="font-display text-primary animate-pulse">Loading Rankings...</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm text-muted-foreground">#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30";
    if (rank === 2) return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30";
    if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30";
    return "";
  };

  return (
    <div className="retro-container space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl text-primary drop-shadow-lg flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Top coders ranked by XP. Climb the ranks and become a legend!
        </p>
      </div>

      {leaderboard && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
            const isFirst = i === 1;
            return entry ? (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "pixel-card p-4 text-center",
                  isFirst && "transform scale-110 z-10 border-yellow-500/30"
                )}
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white">
                  {entry.username[0].toUpperCase()}
                </div>
                <div className="mb-2">{getRankIcon(entry.rank)}</div>
                <h3 className="font-bold normal-case truncate">{entry.username}</h3>
                <p className="text-sm text-primary font-mono">{entry.xp.toLocaleString()} XP</p>
                <p className="text-xs text-muted-foreground">Level {entry.level}</p>
              </motion.div>
            ) : null;
          })}
        </div>
      )}

      <div className="space-y-3">
        {leaderboard?.map((entry, i) => {
          const isCurrentUser = user?.id === entry.userId;
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={cn(
                "pixel-card p-4 flex items-center gap-4",
                getRankStyle(entry.rank),
                isCurrentUser && "ring-2 ring-primary"
              )}
              data-testid={`row-leaderboard-${entry.rank}`}
            >
              <div className="w-10 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center font-bold text-foreground">
                {entry.username[0].toUpperCase()}
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold normal-case">{entry.username}</h3>
                  {isCurrentUser && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded">You</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Level {entry.level} Coder
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-primary font-mono">
                  <Star className="w-4 h-4" />
                  {entry.xp.toLocaleString()} XP
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {entry.solvedCount} solved
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {entry.badgeCount} badges
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {(!leaderboard || leaderboard.length === 0) && (
          <div className="pixel-card p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No rankings yet. Start solving problems to appear here!</p>
          </div>
        )}
      </div>
    </div>
  );
}

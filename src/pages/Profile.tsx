import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { User, Trophy, Star, Flame, Award, Calendar, Target, Code2, BookOpen, CheckCircle2, Crown, FolderKanban, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-user-stats";
import { Button } from "@/components/ui/button";
import type { Badge, User as UserType } from "@shared/schema";

type UserBadge = Badge & { earnedAt: Date };

export default function Profile() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useUserStats();

  const { data: badges, isLoading: badgesLoading } = useQuery<UserBadge[]>({
    queryKey: ['/api/user/badges'],
  });

  const { data: allBadges } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });

  if (statsLoading || badgesLoading) {
    return (
      <div className="retro-container text-center py-20">
        <p className="font-display text-primary animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  const currentLevelXP = stats?.xp || 0;
  const xpForNextLevel = ((stats?.level || 1) + 1) * 500;
  const progressPercent = Math.min((currentLevelXP / xpForNextLevel) * 100, 100);

  const earnedBadgeIds = new Set(badges?.map(b => b.id) || []);

  const getBadgeIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Sword: Target,
      Lightbulb: Star,
      Shield: Award,
      Star: Star,
      Award: Award,
      Flame: Flame,
      Code2: Code2,
      Brain: BookOpen,
    };
    return icons[iconName] || Award;
  };

  return (
    <div className="retro-container space-y-8">
      <div className="pixel-card p-8 bg-gradient-to-br from-card to-card/50">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-lg">
            {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>

          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">
              {user?.firstName || 'Coder'}
            </h1>
            <p className="text-muted-foreground">
              Level {stats?.level || 1} Architect
            </p>

            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span>XP: {currentLevelXP}</span>
                <span>Next Level: {xpForNextLevel}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="pixel-card p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
              <span className="text-2xl font-bold">{stats?.level || 1}</span>
              <p className="text-xs text-muted-foreground">Level</p>
            </div>
            <div className="pixel-card p-4 text-center">
              <Flame className="w-6 h-6 mx-auto text-orange-500 mb-2" />
              <span className="text-2xl font-bold">{stats?.streak || 0}</span>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Problems Solved", value: stats?.solvedCount || 0, icon: CheckCircle2, color: "text-green-500" },
          { label: "Total XP", value: stats?.xp || 0, icon: Star, color: "text-yellow-500" },
          { label: "Badges Earned", value: badges?.length || 0, icon: Award, color: "text-purple-500" },
          { label: "Days Active", value: stats?.streak || 0, icon: Calendar, color: "text-blue-500" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="pixel-card p-4 text-center"
          >
            <stat.icon className={cn("w-6 h-6 mx-auto mb-2", stat.color)} />
            <span className="text-2xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</span>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" />
          Achievements
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allBadges?.map((badge, i) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            const IconComponent = getBadgeIcon(badge.icon);
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "pixel-card p-4 text-center relative",
                  !isEarned && "opacity-40 grayscale"
                )}
                data-testid={`card-badge-${badge.id}`}
              >
                {isEarned && (
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                  isEarned ? "bg-primary/20" : "bg-muted"
                )}>
                  <IconComponent className={cn("w-6 h-6", isEarned ? badge.color : "text-muted-foreground")} />
                </div>
                <h3 className="font-bold text-sm normal-case">{badge.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
              </motion.div>
            );
          })}
        </div>

        {(!allBadges || allBadges.length === 0) && (
          <div className="pixel-card p-8 text-center">
            <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No badges available yet. Start solving problems to earn achievements!</p>
          </div>
        )}
      </div>

      {/* Club Membership Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Crown className="w-6 h-6 text-primary" />
          Club Membership
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/pricing">
            <div className="pixel-card p-6 text-center hover-elevate cursor-pointer transition-all h-full">
              <Crown className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-bold mb-2">Upgrade to Club</h3>
              <p className="text-xs text-muted-foreground">Unlock all courses, certificates, and exclusive perks</p>
            </div>
          </Link>
          <Link href="/certificates">
            <div className="pixel-card p-6 text-center hover-elevate cursor-pointer transition-all h-full">
              <GraduationCap className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <h3 className="font-bold mb-2">My Certificates</h3>
              <p className="text-xs text-muted-foreground">View and download your earned certificates</p>
            </div>
          </Link>
          <Link href="/portfolio">
            <div className="pixel-card p-6 text-center hover-elevate cursor-pointer transition-all h-full">
              <FolderKanban className="w-8 h-8 mx-auto mb-3 text-blue-500" />
              <h3 className="font-bold mb-2">My Portfolio</h3>
              <p className="text-xs text-muted-foreground">Showcase your projects to the world</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

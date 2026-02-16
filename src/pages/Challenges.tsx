import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Calendar, Clock, Gift, Users, Crown, Lock, Zap, Target, AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MonthlyChallenge } from "@shared/schema";

export default function Challenges() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: subscription } = useQuery<{ membershipStatus: string; membershipTier: string }>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const { data: challenges = [], isLoading } = useQuery<MonthlyChallenge[]>({
    queryKey: ["/api/challenges"],
  });

  const isClubMember = subscription?.membershipStatus === "active" && 
    ['club_monthly', 'club_yearly'].includes(subscription?.membershipTier || '');

  const submitMutation = useMutation({
    mutationFn: async ({ challengeId, projectUrl, description }: { challengeId: number; projectUrl: string; description: string }) => {
      return await apiRequest('POST', `/api/challenges/${challengeId}/submit`, { projectUrl, description });
    },
    onSuccess: () => {
      toast({
        title: "Submission received!",
        description: "Your challenge submission has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to submit";
      if (message.includes("Club membership required")) {
        toast({
          title: "Club Membership Required",
          description: "Upgrade to Club to submit to challenges.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission failed",
          description: message,
          variant: "destructive",
        });
      }
    },
  });

  const activeChallenges = challenges.filter(c => c.isActive && c.endDate && new Date(c.endDate) >= new Date());
  const upcomingChallenges = challenges.filter(c => !c.isActive && c.startDate && new Date(c.startDate) > new Date());
  const pastChallenges = challenges.filter(c => c.endDate && new Date(c.endDate) < new Date());

  const currentChallenge = activeChallenges[0];
  const daysLeft = currentChallenge && currentChallenge.endDate
    ? Math.max(0, Math.ceil((new Date(currentChallenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleJoinChallenge = () => {
    if (!isClubMember) {
      toast({
        title: "Club Membership Required",
        description: "Join the Club to participate in challenges.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Challenge joined!",
      description: "You can now submit your project before the deadline.",
    });
  };

  if (isLoading) {
    return (
      <div className="retro-container py-8 text-center">
        <p className="text-muted-foreground animate-pulse">Loading challenges...</p>
      </div>
    );
  }

  const pastWinners = [
    {
      id: 101,
      challenge: "Holiday Hackathon 2025",
      winner: "Moses James",
      project: "Gift Exchange App",
      prize: "Software Developer at Deloitte",
    },
    {
      id: 102,
      challenge: "Data Viz Challenge",
      winner: "Alan Geirnaert",
      project: "Climate Dashboard",
      prize: "Featured Project + $250",
    },
  ];

  return (
    <div className="retro-container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display text-primary">Monthly Challenges</h1>
        </div>
        <p className="text-muted-foreground">
          Compete for prizes, build your portfolio, and showcase your skills
        </p>
      </div>

      {/* Current Challenge */}
      {currentChallenge ? (
        <section className="mb-12">
          <h2 className="text-xl font-display mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Current Challenge
          </h2>
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-green-500 mb-2">Active</Badge>
                  <CardTitle className="text-2xl">{currentChallenge.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentChallenge.month}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-primary">
                    <Clock className="w-5 h-5" />
                    {daysLeft} days left
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{currentChallenge.description}</p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Gift className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Prize</p>
                    <p className="font-medium text-sm">{currentChallenge.prize || 'TBA'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Month</p>
                    <p className="font-medium text-sm">{currentChallenge.month}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium text-sm">
                      {currentChallenge.endDate && new Date(currentChallenge.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {currentChallenge.rules && (
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h4 className="font-medium mb-2">Rules</h4>
                  <p className="text-sm text-muted-foreground">{currentChallenge.rules}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 flex-wrap">
              {isClubMember ? (
                <Button 
                  size="lg" 
                  onClick={handleJoinChallenge}
                  data-testid="button-join-challenge"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Join Challenge
                </Button>
              ) : (
                <Button size="lg" asChild data-testid="button-upgrade-challenge">
                  <Link href="/pricing">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Join
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </section>
      ) : (
        <section className="mb-12">
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-lg mb-2">No Active Challenge</h3>
              <p className="text-muted-foreground">Check back soon for the next monthly challenge!</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Upcoming Challenges */}
      {upcomingChallenges.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-display mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Upcoming Challenges
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingChallenges.map((challenge) => (
              <Card key={challenge.id} className={!isClubMember ? "opacity-75" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2 gap-1">
                        <Crown className="w-3 h-3" /> Club Only
                      </Badge>
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">{challenge.month}</p>
                    </div>
                    {!isClubMember && (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-primary" />
                    <span>{challenge.prize || 'Prize TBA'}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  {!isClubMember ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/pricing">Upgrade to Club</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Starts {challenge.startDate && new Date(challenge.startDate).toLocaleDateString()}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Past Winners */}
      <section>
        <h2 className="text-xl font-display mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Hall of Fame
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {pastWinners.map((winner) => (
            <Card key={winner.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-yellow-500/20">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{winner.challenge}</p>
                    <h3 className="font-medium text-lg">{winner.winner}</h3>
                    <p className="text-sm text-muted-foreground">Project: {winner.project}</p>
                    <Badge variant="secondary" className="mt-2">{winner.prize}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {!isClubMember && (
        <Card className="mt-12 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="flex items-center justify-between py-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg">Access Club-Exclusive Challenges</h3>
                <p className="text-sm text-muted-foreground">
                  Join Club to participate in exclusive challenges with bigger prizes
                </p>
              </div>
            </div>
            <Button asChild data-testid="button-join-club-challenges">
              <Link href="/pricing">Join Club</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

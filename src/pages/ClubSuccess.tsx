import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, CheckCircle2, Sparkles, BookOpen, Award, MessageSquare } from "lucide-react";

export default function ClubSuccess() {
  return (
    <div className="retro-container py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-display text-primary mb-4">
            Welcome to the Club!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your subscription is now active. You have full access to all premium features.
          </p>
        </div>

        <Card className="mb-8 border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Crown className="w-6 h-6 text-primary" />
              <span className="font-display text-lg">Club Member Benefits</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm">All Courses Unlocked</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm">Course Certificates</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="text-sm">Code Mentors</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm">Unlimited AI Help</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/tutorials">Start Learning</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

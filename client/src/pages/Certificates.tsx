import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download, Lock, Crown, Calendar, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import type { Certificate, Tutorial } from "@shared/schema";

export default function Certificates() {
  const { user } = useAuth();

  const { data: subscription } = useQuery<{ membershipStatus: string; membershipTier: string }>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const { data: tutorials = [] } = useQuery<Tutorial[]>({
    queryKey: ["/api/tutorials"],
  });

  const isClubMember = subscription?.membershipStatus === "active" && 
    ['club_monthly', 'club_yearly'].includes(subscription?.membershipTier || '');

  const { data: earnedCertificates = [], isLoading: certsLoading, error: certsError } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    enabled: !!user && isClubMember,
  });

  const requiresUpgrade = !isClubMember && !!user;

  return (
    <div className="retro-container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display text-primary">Certificates</h1>
        </div>
        <p className="text-muted-foreground">
          Earn certificates by completing courses and showcase your achievements
        </p>
      </div>

      {requiresUpgrade && (
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="flex items-center justify-between py-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg">Unlock Course Certificates</h3>
                <p className="text-sm text-muted-foreground">
                  Join Club to earn certificates for completed courses
                </p>
              </div>
            </div>
            <Button asChild data-testid="button-join-club-certs">
              <Link href="/pricing">Join Club</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Earned Certificates */}
      <section className="mb-12">
        <h2 className="text-xl font-display mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-green-500" />
          Earned Certificates
        </h2>
        
        {certsLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p className="animate-pulse">Loading certificates...</p>
            </CardContent>
          </Card>
        ) : certsError ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {requiresUpgrade 
                  ? "Upgrade to Club to view and earn certificates" 
                  : "Unable to load certificates"}
              </p>
            </CardContent>
          </Card>
        ) : earnedCertificates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedCertificates.map((cert) => (
              <Card key={cert.id} className="border-2 border-green-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                      Earned
                    </Badge>
                    <Award className="w-8 h-8 text-green-500" />
                  </div>
                  <CardTitle className="text-lg mt-2">{cert.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Course completion certificate
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </div>
                    <Button size="sm" variant="outline" className="gap-1" data-testid={`button-download-cert-${cert.id}`}>
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                  {cert.verificationCode && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Verification: {cert.verificationCode}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isClubMember ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No certificates earned yet</p>
              <p className="text-sm">Complete courses to earn certificates</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Join Club to access certificates</p>
              <p className="text-sm">Complete courses and earn verifiable certificates</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Available Certificates */}
      <section>
        <h2 className="text-xl font-display mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-muted-foreground" />
          Available Certificates
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutorials.slice(0, 6).map((tutorial) => (
            <Card key={tutorial.id} className="relative">
              {!isClubMember && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit">
                  {tutorial.category}
                </Badge>
                <CardTitle className="text-lg mt-2">{tutorial.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {tutorial.description}
                </p>
                <Button 
                  asChild 
                  variant={isClubMember ? "default" : "outline"} 
                  size="sm" 
                  className="w-full"
                  data-testid={`button-course-${tutorial.slug}`}
                >
                  <Link href={`/tutorials/${tutorial.slug}`}>
                    {isClubMember ? "Start Course" : "Preview Course"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

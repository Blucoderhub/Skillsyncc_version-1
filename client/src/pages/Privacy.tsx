import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="retro-container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4" data-testid="btn-back">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="font-display text-3xl text-primary mb-2" data-testid="text-page-title">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you use BlueCoderHub, we collect information you provide directly, such as your name, email address, and profile details through our authentication provider. We also collect usage data including your coding submissions, progress, XP earned, and interaction with the platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">2. How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use your information to provide and improve BlueCoderHub services, track your learning progress, manage your account, display your profile and achievements on leaderboards, process Club membership subscriptions, and communicate with you about platform updates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">3. Data Storage & Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard encryption. Code submissions are processed in sandboxed environments. We do not sell your personal information to third parties.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">4. Cookies & Tracking</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. Analytics cookies help us understand how users interact with the platform so we can improve the experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">5. Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to access, update, or delete your personal data. You can export your progress data or request account deletion by contacting us at connect@bluecoderhub.com.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">6. Contact Us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:connect@bluecoderhub.com" className="text-primary hover:underline" data-testid="link-email">
                connect@bluecoderhub.com
              </a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

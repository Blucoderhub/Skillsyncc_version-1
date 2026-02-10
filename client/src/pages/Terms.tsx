import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="retro-container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4" data-testid="btn-back">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="font-display text-3xl text-primary mb-2" data-testid="text-page-title">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing and using BlueCoderHub, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">2. User Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the security of your account. You must provide accurate information during registration. You may not use the platform for any illegal or unauthorized purpose.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">3. Code Submissions</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You retain ownership of the code you submit. By submitting code to challenges, hackathons, or practice problems, you grant BlueCoderHub a non-exclusive license to execute and evaluate your code for grading and display purposes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">4. Club Membership</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Club membership is a paid subscription service. Subscriptions are billed monthly or annually through our payment processor, Stripe. You may cancel your subscription at any time through your account settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">5. Community Guidelines</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Users must treat others with respect in discussions, forums, and hackathon teams. Plagiarism, harassment, or sharing solutions to active challenges is prohibited and may result in account suspension.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">6. Intellectual Property</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All platform content, including coding problems, tutorials, and course materials, is the property of BlueCoderHub. You may not reproduce, distribute, or create derivative works from our content without permission.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">7. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              BlueCoderHub is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform, including but not limited to loss of data or code submissions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-display text-lg text-primary">8. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at{" "}
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

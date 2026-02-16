import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="pixel-card p-12 text-center max-w-md mx-4">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-display text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8">
          The page you are looking for has been lost in cyberspace.
        </p>

        <Link href="/">
          <a className="pixel-btn-primary inline-block w-full">
            Return Home
          </a>
        </Link>
      </div>
    </div>
  );
}

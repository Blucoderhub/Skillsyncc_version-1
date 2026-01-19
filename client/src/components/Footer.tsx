import { Link } from "wouter";
import { Terminal, Mail } from "lucide-react";
import { SiGithub, SiLinkedin, SiX, SiInstagram, SiDiscord, SiYoutube } from "react-icons/si";

export function Footer() {
  const socialLinks = [
    { icon: SiGithub, href: "https://github.com/Blucoderhub", label: "GitHub" },
    { icon: SiLinkedin, href: "https://linkedin.com/company/bluecoderhub", label: "LinkedIn" },
    { icon: SiX, href: "https://x.com/bluecoderhub", label: "X (Twitter)" },
    { icon: SiInstagram, href: "https://instagram.com/bluecoderhub", label: "Instagram" },
    { icon: SiDiscord, href: "https://discord.gg/bluecoderhub", label: "Discord" },
    { icon: SiYoutube, href: "https://youtube.com/@bluecoderhub", label: "YouTube" },
  ];

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="retro-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-primary p-2 rounded-lg">
                <Terminal className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-lg text-primary tracking-tighter">
                BlueCoder<span className="text-secondary">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your gamified journey to mastering code. Learn, practice, and compete with coders worldwide.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-sm text-primary">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link href="/quests" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-quests">
                Quests
              </Link>
              <Link href="/tutorials" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-tutorials">
                Learn
              </Link>
              <Link href="/practice" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-practice">
                Practice
              </Link>
              <Link href="/hackathons" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-hackathons">
                Hackathons
              </Link>
              <Link href="/discussions" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-discussions">
                Community
              </Link>
              <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-leaderboard">
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-sm text-primary">Connect</h4>
            <a 
              href="mailto:connect@bluecoderhub.com" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="footer-email"
            >
              <Mail className="w-4 h-4" />
              connect@bluecoderhub.com
            </a>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title={social.label}
                  data-testid={`footer-social-${social.label.toLowerCase().replace(/[^a-z]/g, '')}`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BlueCoderHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

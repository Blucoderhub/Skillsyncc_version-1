import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code2, Swords, Trophy, BookOpen, 
  MessageSquare, Calendar, Shield, Zap, 
  Globe, LayoutGrid, Rocket, Target, Users, Crown, Quote, Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Globe, color: "text-blue-400" },
  { href: "/quests", label: "Quests", icon: Swords, color: "text-red-400" },
  { href: "/tutorials", label: "Learn", icon: BookOpen, color: "text-green-400" },
  { href: "/practice", label: "Practice", icon: Code2, color: "text-purple-400" },
  { href: "/hackathons", label: "Events", icon: Calendar, color: "text-pink-400" },
  { href: "/discussions", label: "Forum", icon: MessageSquare, color: "text-yellow-400" },
  { href: "/leaderboard", label: "Ranks", icon: Trophy, color: "text-orange-400" },
];

export default function Landing() {
  const { user } = useAuth();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020617] text-white overflow-hidden font-inter">
      {/* Dynamic Background Animation */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(2,6,23,1))]" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
            backgroundSize: "40px 40px",
            transform: `translate(${mousePos.x * -0.01}px, ${mousePos.y * -0.01}px)`
          }}
        />
        {/* Animated Glows */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]" 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col min-h-screen">
        {/* Minimal Hero Brand */}
        <header className="flex justify-between items-center mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Skill<span className="text-primary">syncc</span>
              </span>
              <span className="text-[8px] text-gray-500 tracking-wider">Powered by Bluecoderhub</span>
            </div>
          </motion.div>

          <div className="flex gap-4">
            {user ? (
              <Button asChild variant="outline" className="border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 rounded-xl">
                <Link href="/dashboard">Enter Hub</Link>
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button asChild variant="ghost" className="text-gray-400 hover:text-white rounded-xl">
                  <a href="/api/login">Login</a>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-white border-0 shadow-lg shadow-primary/20 rounded-xl px-8">
                  <a href="/api/login">Get Started</a>
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Central Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 tracking-widest uppercase">
              <Zap className="w-3 h-3" /> Gamified Learning Evolution
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
              Master the <span className="bg-clip-text text-transparent bg-gradient-to-b from-primary via-primary to-secondary">Cyber Realm</span> of Code
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              Level up your logic, survive the hackathons, and conquer the leaderboard in the ultimate ed-tech RPG for developers.
            </p>
          </motion.div>

          {/* Animated Navigation Portal */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 w-full max-w-6xl mt-12 px-4">
            {NAV_ITEMS.map((item, idx) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx, type: "spring", stiffness: 200 }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Link href={item.href}>
                  <div className={cn(
                    "group relative p-4 bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden transition-all duration-500 cursor-pointer rounded-2xl h-full flex flex-col items-center justify-center gap-3",
                    hoveredIndex === idx ? "border-primary/50 -translate-y-2 ring-1 ring-primary/20 bg-white/10" : "hover:border-white/20"
                  )}>
                    <div className={cn(
                      "p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform duration-500",
                      item.color.replace('text-', 'bg-').replace('-400', '/10')
                    )}>
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase group-hover:text-primary transition-colors">{item.label}</span>
                    
                    {/* Interactive hover glow */}
                    <AnimatePresence>
                      {hoveredIndex === idx && (
                        <motion.div 
                          layoutId="portal-glow"
                          className="absolute inset-0 bg-primary/10 blur-2xl pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Success Stories Section */}
        <section className="py-16 border-t border-white/5">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold mb-4 tracking-widest uppercase">
              <Star className="w-3 h-3" /> Success Stories
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Learners <span className="text-primary">Level Up</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From beginners to professionals, see how our community transforms their careers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Alan Geirnaert",
                flag: "France",
                role: "Fullstack Developer at App'Ines",
                quote: "I completed every course, project tutorial, and code challenge... Five months later, I landed a real internship as a Fullstack Developer.",
                highlight: "Retail to Tech"
              },
              {
                name: "Moses James",
                flag: "USA",
                role: "Software Developer at Deloitte",
                quote: "After winning 1st place at the Holiday Hackathon, everything changed. Five months later, I landed my first tech job at Deloitte.",
                highlight: "Hackathon Winner"
              },
              {
                name: "Anjali Sharma",
                flag: "India",
                role: "Fullstack Developer at Noida",
                quote: "I met with incredible mentors who reviewed my resume and encouraged me. I've genuinely fallen in love with the platform.",
                highlight: "Career Changer"
              },
            ].map((story, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {story.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{story.name}</p>
                        <p className="text-xs text-gray-500">{story.flag}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                        {story.highlight}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 italic">"{story.quote}"</p>
                    <p className="text-xs text-gray-500">{story.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Club CTA Section */}
        <section className="py-16 border-t border-white/5">
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 backdrop-blur-xl max-w-4xl mx-auto">
            <CardContent className="py-12 px-8 text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Join the Club</h2>
              <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                Make your career change to tech with unlimited access to learning content, 
                Club-only perks, and personalized support. Starting at just $9.99/month.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <BookOpen className="w-4 h-4 text-primary" /> All Courses
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Trophy className="w-4 h-4 text-primary" /> Certificates
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MessageSquare className="w-4 h-4 text-primary" /> Code Mentors
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Zap className="w-4 h-4 text-primary" /> Unlimited AI
                </div>
              </div>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer Stats */}
        <footer className="mt-auto pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500 pb-8">
          <div className="flex gap-12">
            <div><span className="text-white font-bold">50k+</span> Active Coders</div>
            <div><span className="text-white font-bold">120+</span> Quests Available</div>
            <div><span className="text-white font-bold">15+</span> Tech Tracks</div>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Global Node Active
          </div>
        </footer>
      </div>
    </div>
  );
}

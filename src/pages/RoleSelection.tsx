import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, GraduationCap, Users, UserCheck, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SkillsynccLogo } from "@/components/SkillsynccLogo";
import { apiRequest } from "@/lib/queryClient";

type RoleOption = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Building2;
  color: string;
  features: string[];
  needsCompany?: boolean;
  needsInstitution?: boolean;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "student",
    title: "Student",
    subtitle: "College & School Students",
    description: "Learn to code with gamified quests, challenges, and structured courses. Track your progress and compete on leaderboards.",
    icon: GraduationCap,
    color: "from-blue-500 to-cyan-500",
    features: ["Code Quests & Challenges", "Interactive Tutorials", "XP & Level Progression", "Leaderboard Rankings", "AI Coding Companion", "Certificates"],
    needsInstitution: true,
  },
  {
    id: "candidate",
    title: "Candidate",
    subtitle: "Job Seekers & Professionals",
    description: "Sharpen your coding skills, build a portfolio, participate in hackathons, and showcase your achievements to employers.",
    icon: UserCheck,
    color: "from-emerald-500 to-green-500",
    features: ["Code Practice & IDE", "Portfolio Builder", "Hackathon Participation", "Skill Assessments", "AI Coding Companion", "Community & Discussions"],
  },
  {
    id: "corporate",
    title: "Corporate",
    subtitle: "Managers & Companies",
    description: "Host hackathons, manage organizations, evaluate candidates, and build your employer brand through coding events.",
    icon: Building2,
    color: "from-purple-500 to-violet-500",
    features: ["Host Hackathons", "Organization Management", "Candidate Dashboard", "Judging & Scoring", "Team Management", "Performance Analytics"],
    needsCompany: true,
  },
  {
    id: "hr",
    title: "HR",
    subtitle: "Recruiters & Talent Teams",
    description: "Discover talented candidates, review their hackathon performance, coding achievements, and skills profile.",
    icon: Briefcase,
    color: "from-amber-500 to-orange-500",
    features: ["Candidate Search", "Performance Reports", "Hackathon Analytics", "Skill Assessments View", "Shortlist Candidates", "Export Reports"],
    needsCompany: true,
  },
];

export default function RoleSelection() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [institution, setInstitution] = useState("");

  const roleMutation = useMutation({
    mutationFn: async (data: { role: string; companyName?: string; institution?: string }) => {
      const res = await apiRequest("POST", "/api/user/role", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
      navigate("/dashboard");
    },
  });

  const selectedOption = ROLE_OPTIONS.find(r => r.id === selectedRole);

  const handleContinue = () => {
    if (!selectedRole) return;
    if (selectedOption?.needsCompany && !companyName.trim()) return;
    if (selectedOption?.needsInstitution && !institution.trim()) return;

    roleMutation.mutate({
      role: selectedRole,
      ...(companyName ? { companyName } : {}),
      ...(institution ? { institution } : {}),
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 p-6">
        <SkillsynccLogo size="md" animate={false} />
        <div>
          <span className="font-display text-lg text-primary tracking-tighter">
            Skill<span className="text-secondary">syncc</span>
          </span>
          <p className="text-[10px] text-muted-foreground">Powered by Bluecoderhub</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">Welcome to Skillsyncc</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display text-foreground mb-2" data-testid="text-role-heading">
              Choose Your Account Type
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Select the role that best describes you. This determines the features and dashboard you'll see.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {ROLE_OPTIONS.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 h-full flex flex-col",
                    selectedRole === role.id
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "hover-elevate"
                  )}
                  onClick={() => setSelectedRole(role.id)}
                  data-testid={`card-role-${role.id}`}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3",
                    role.color
                  )}>
                    <role.icon className="w-5 h-5 text-white" />
                  </div>

                  <h3 className="font-display text-sm text-foreground mb-0.5">{role.title}</h3>
                  <p className="text-[10px] text-muted-foreground mb-2">{role.subtitle}</p>
                  <p className="text-xs text-muted-foreground mb-3 flex-1">{role.description}</p>

                  <div className="space-y-1">
                    {role.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className={cn(
                          "w-1 h-1 rounded-full",
                          selectedRole === role.id ? "bg-primary" : "bg-muted-foreground/40"
                        )} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {selectedOption && (selectedOption.needsCompany || selectedOption.needsInstitution) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="max-w-md mx-auto mb-6"
            >
              <Card className="p-4">
                {selectedOption.needsCompany && (
                  <div>
                    <label className="text-xs text-foreground font-medium mb-1.5 block">Company / Organization Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter your company name"
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      data-testid="input-company-name"
                    />
                  </div>
                )}
                {selectedOption.needsInstitution && (
                  <div>
                    <label className="text-xs text-foreground font-medium mb-1.5 block">School / College Name</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="Enter your institution name"
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      data-testid="input-institution"
                    />
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={handleContinue}
              disabled={
                !selectedRole || 
                roleMutation.isPending ||
                (selectedOption?.needsCompany && !companyName.trim()) ||
                (selectedOption?.needsInstitution && !institution.trim())
              }
              className="gap-2 px-8"
              data-testid="button-continue-role"
            >
              {roleMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground rounded-full border-t-transparent animate-spin" />
              ) : (
                <>
                  Continue as {selectedOption?.title || "..."}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {roleMutation.isError && (
            <p className="text-center text-destructive text-xs mt-3" data-testid="text-role-error">
              Failed to set your account type. Please try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

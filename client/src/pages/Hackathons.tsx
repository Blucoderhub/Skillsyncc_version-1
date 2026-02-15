import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Calendar, Tag, Plus, Users, Trophy, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const statusColors: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  judging: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-muted text-muted-foreground border-border",
  listed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function Hackathons() {
  const [activeTab, setActiveTab] = useState<"hosted" | "external">("hosted");

  const { data: externalHackathons, isLoading: loadingExternal } = useQuery({
    queryKey: ["/api/hackathons"],
  });

  const { data: hostedHackathons, isLoading: loadingHosted } = useQuery({
    queryKey: ["/api/hosted-hackathons"],
  });

  const isLoading = activeTab === "hosted" ? loadingHosted : loadingExternal;

  return (
    <div className="retro-container space-y-8">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl text-primary drop-shadow-lg" data-testid="text-hackathons-title">Hackathons</h1>
        <p className="text-muted-foreground">Compete, collaborate, and build something amazing.</p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "hosted" ? "default" : "outline"}
            onClick={() => setActiveTab("hosted")}
            data-testid="button-tab-hosted"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Platform Hackathons
          </Button>
          <Button
            variant={activeTab === "external" ? "default" : "outline"}
            onClick={() => setActiveTab("external")}
            data-testid="button-tab-external"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            External Events
          </Button>
        </div>

        <Link href="/hackathons/create">
          <Button data-testid="button-create-hackathon">
            <Plus className="h-4 w-4 mr-2" />
            Host a Hackathon
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="py-20 text-center">
          <p className="font-display text-primary animate-pulse">Loading hackathons...</p>
        </div>
      )}

      {activeTab === "hosted" && !loadingHosted && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(hostedHackathons as any[])?.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold mb-2">No Platform Hackathons Yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to host a hackathon on Skillsyncc!</p>
              <Link href="/hackathons/create">
                <Button data-testid="button-create-first-hackathon">
                  <Plus className="h-4 w-4 mr-2" />
                  Host a Hackathon
                </Button>
              </Link>
            </div>
          )}
          {(hostedHackathons as any[])?.map((hackathon: any, i: number) => (
            <motion.article
              key={hackathon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="pixel-card overflow-hidden flex flex-col h-full group"
              data-testid={`card-hackathon-${hackathon.id}`}
            >
              <div className="h-40 bg-muted relative overflow-hidden">
                <img
                  src={hackathon.imageUrl || "https://images.unsplash.com/photo-1504384308090-c54be3852f92?auto=format&fit=crop&w=800&q=80"}
                  alt={hackathon.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${statusColors[hackathon.status] || statusColors.listed}`}>
                    {(hackathon.status || "listed").replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{hackathon.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                  {hackathon.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(hackathon.startDate), "MMM d")} - {format(new Date(hackathon.endDate), "MMM d, yyyy")}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {hackathon.prizePool && (
                      <div className="flex items-center gap-1 text-xs text-yellow-400">
                        <Trophy className="h-3 w-3" />
                        <span>{hackathon.prizePool}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{hackathon.registrationCount || 0}{hackathon.maxParticipants ? `/${hackathon.maxParticipants}` : ''}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {hackathon.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[10px] px-2 py-1 bg-accent/10 text-accent rounded-full border border-accent/20 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {tag}
                      </span>
                    ))}
                  </div>

                  <Link href={`/hackathons/${hackathon.id}`}>
                    <Button className="w-full" variant="default" data-testid={`button-view-hackathon-${hackathon.id}`}>
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {activeTab === "external" && !loadingExternal && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(externalHackathons as any[])?.map((hackathon: any, i: number) => (
            <motion.article
              key={hackathon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="pixel-card overflow-hidden flex flex-col h-full group"
              data-testid={`card-external-hackathon-${hackathon.id}`}
            >
              <div className="h-40 bg-muted relative overflow-hidden">
                <img
                  src={hackathon.imageUrl || "https://images.unsplash.com/photo-1504384308090-c54be3852f92?auto=format&fit=crop&w=800&q=80"}
                  alt={hackathon.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-background/90 text-foreground text-[10px] font-bold px-2 py-1 rounded border border-border uppercase">
                    {hackathon.platform}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{hackathon.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                  {hackathon.description}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(hackathon.startDate), "MMM d")} - {format(new Date(hackathon.endDate), "MMM d, yyyy")}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {hackathon.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[10px] px-2 py-1 bg-accent/10 text-accent rounded-full border border-accent/20 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {tag}
                      </span>
                    ))}
                  </div>

                  <a
                    href={hackathon.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full pixel-btn-primary flex items-center justify-center gap-2 text-xs py-3 mt-2"
                    data-testid={`link-external-hackathon-${hackathon.id}`}
                  >
                    Register Now <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}

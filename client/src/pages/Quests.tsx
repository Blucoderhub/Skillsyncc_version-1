import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Swords, Lock, Search, Filter, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { ProblemResponse } from "@shared/schema";

export default function Quests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const { data: problems, isLoading } = useQuery<ProblemResponse[]>({
    queryKey: ['/api/problems', { category: selectedCategory, difficulty: selectedDifficulty, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      if (searchTerm) params.append('search', searchTerm);
      
      const url = `/api/problems${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="retro-container text-center py-20">
        <p className="font-display text-primary animate-pulse">Scanning Quest Log...</p>
      </div>
    );
  }

  const categories = ["all", "Python", "Algorithms", "Web", "JavaScript", "SQL", "Data Structures"];
  const difficulties = ["all", "Easy", "Medium", "Hard"];

  const groupedProblems = problems?.reduce((acc, problem) => {
    if (!acc[problem.category]) acc[problem.category] = [];
    acc[problem.category].push(problem);
    return acc;
  }, {} as Record<string, ProblemResponse[]>) || {};

  const solvedCount = problems?.filter(p => p.isSolved).length || 0;
  const totalCount = problems?.length || 0;

  return (
    <div className="retro-container space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl text-primary drop-shadow-lg flex items-center justify-center gap-3">
          <Swords className="w-10 h-10" />
          Quest Log
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose your path, adventurer. Each quest brings you closer to mastery.
        </p>
      </div>

      <div className="pixel-card p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-grow min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search quests..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-quests"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[120px]" data-testid="select-difficulty">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map(diff => (
                <SelectItem key={diff} value={diff}>
                  {diff === 'all' ? 'All Levels' : diff}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground ml-auto flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          {solvedCount}/{totalCount} completed
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Object.entries(groupedProblems).map(([category, categoryProblems], idx) => (
          <motion.div 
            key={category} 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <h2 className="text-xl flex items-center gap-3 font-bold">
              <Swords className="h-5 w-5 text-secondary" />
              {category} Region
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                {categoryProblems.filter(p => p.isSolved).length}/{categoryProblems.length}
              </span>
            </h2>
            
            <div className="space-y-3">
              {categoryProblems.map((problem, i) => (
                <Link key={problem.id} href={`/quests/${problem.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "pixel-card p-4 flex items-center justify-between group cursor-pointer border-l-4",
                      problem.isSolved 
                        ? "border-l-green-500 bg-green-500/5" 
                        : "border-l-muted-foreground/30 hover:border-l-primary"
                    )}
                    data-testid={`card-quest-${problem.id}`}
                  >
                    <div className="flex items-center gap-4">
                      {problem.isSolved ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                      <div>
                        <h3 className="font-bold text-sm normal-case group-hover:text-primary transition-colors">
                          {problem.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-mono uppercase",
                            problem.difficulty === "Easy" ? "bg-green-500/20 text-green-500" :
                            problem.difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-500" :
                            "bg-red-500/20 text-red-500"
                          )}>
                            {problem.difficulty}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {problem.xpReward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {problem.isSolved ? (
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">
                        Completed
                      </span>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs group-hover:bg-primary group-hover:text-primary-foreground">
                        <Zap className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {(!problems || problems.length === 0) && (
        <div className="pixel-card p-12 text-center">
          <Swords className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all'
              ? "No quests match your filters"
              : "No quests available yet"}
          </p>
        </div>
      )}
    </div>
  );
}

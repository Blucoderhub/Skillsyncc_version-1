import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Mic, Square, ChevronDown, Sparkles, GraduationCap, Lightbulb, Bug, HelpCircle, SearchCode, RotateCcw } from "lucide-react";
import { useVoiceRecorder, useVoiceStream } from "../../replit_integrations/audio";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiOpenai, SiGoogle } from "react-icons/si";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type AIModel = {
  id: string;
  name: string;
  provider: string;
};

type AIMode = {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
};

const MODELS: AIModel[] = [
  { id: "gpt-5", name: "GPT-5", provider: "openai" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet", provider: "anthropic" },
  { id: "claude-haiku-4-5", name: "Claude Haiku", provider: "anthropic" },
  { id: "gemini-2.5-flash", name: "Gemini Flash", provider: "gemini" },
  { id: "gemini-2.5-pro", name: "Gemini Pro", provider: "gemini" },
];

const AI_MODES: AIMode[] = [
  { id: "tutor", name: "Tutor", icon: "GraduationCap", description: "Step-by-step teaching", color: "text-blue-400" },
  { id: "code_review", name: "Review", icon: "SearchCode", description: "Code feedback", color: "text-emerald-400" },
  { id: "hint", name: "Hint", icon: "Lightbulb", description: "Progressive hints", color: "text-amber-400" },
  { id: "debug", name: "Debug", icon: "Bug", description: "Fix bugs", color: "text-red-400" },
  { id: "quiz", name: "Quiz", icon: "HelpCircle", description: "Practice questions", color: "text-violet-400" },
];

function getModeIcon(iconName: string) {
  switch (iconName) {
    case "GraduationCap": return <GraduationCap className="w-3.5 h-3.5" />;
    case "SearchCode": return <SearchCode className="w-3.5 h-3.5" />;
    case "Lightbulb": return <Lightbulb className="w-3.5 h-3.5" />;
    case "Bug": return <Bug className="w-3.5 h-3.5" />;
    case "HelpCircle": return <HelpCircle className="w-3.5 h-3.5" />;
    default: return <Sparkles className="w-3.5 h-3.5" />;
  }
}

function getProviderIcon(provider: string) {
  switch (provider) {
    case "openai": return <SiOpenai className="w-3 h-3" />;
    case "anthropic": return <Sparkles className="w-3 h-3" />;
    case "gemini": return <SiGoogle className="w-3 h-3" />;
    default: return <Sparkles className="w-3 h-3" />;
  }
}

function getProviderColor(provider: string) {
  switch (provider) {
    case "openai": return "text-green-400";
    case "anthropic": return "text-orange-400";
    case "gemini": return "text-blue-400";
    default: return "text-primary";
  }
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block bg-background/80 rounded-md p-2 my-2 text-xs font-mono overflow-x-auto border border-border">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-background/60 rounded px-1 py-0.5 text-xs font-mono text-secondary">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="my-1">{children}</pre>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        h2: ({ children }) => <h2 className="font-bold text-sm mt-3 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="font-semibold text-sm mt-2 mb-1">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(MODELS[0]);
  const [selectedMode, setSelectedMode] = useState<AIMode>(AI_MODES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const recorder = useVoiceRecorder();
  const stream = useVoiceStream({
    onUserTranscript: (text) => {
      setMessages(prev => [...prev, { role: "user", text }]);
    },
    onTranscript: (delta, full) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === "assistant") {
          return [...prev.slice(0, -1), { role: "assistant", text: full }];
        }
        return [...prev, { role: "assistant", text: full }];
      });
    },
    onError: (err) => console.error(err)
  });

  const ensureConversation = useCallback(async (): Promise<number> => {
    if (conversationId) return conversationId;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Syncc AI Chat" }),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.id);
        return data.id;
      }
    } catch {}
    setConversationId(1);
    return 1;
  }, [conversationId]);

  const loadGreeting = useCallback(async (mode: string) => {
    try {
      const res = await fetch(`/api/ai/greeting?mode=${mode}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessages([{ role: "assistant", text: data.greeting }]);
        setGreetingLoaded(true);
      }
    } catch {
      setMessages([{ role: "assistant", text: "Hey! I'm Syncc AI, your coding companion. What would you like to learn today?" }]);
      setGreetingLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !greetingLoaded) {
      loadGreeting(selectedMode.id);
    }
  }, [isOpen, greetingLoaded, loadGreeting, selectedMode.id]);

  const handleModeChange = (mode: AIMode) => {
    setSelectedMode(mode);
    setMessages([]);
    setGreetingLoaded(false);
    loadGreeting(mode.id);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setGreetingLoaded(false);
    loadGreeting(selectedMode.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput("");
    setIsLoading(true);
    
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setMessages(prev => [...prev, { role: "assistant", text: "..." }]);
    
    try {
      const convId = await ensureConversation();
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: userText,
          model: selectedModel.id,
          provider: selectedModel.provider,
          mode: selectedMode.id,
        }),
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Failed to send message");
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      
      const decoder = new TextDecoder();
      let fullResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullResponse += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", text: fullResponse };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: "Sorry, I encountered an error. Please try again." };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVoiceToggle = async () => {
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      const convId = await ensureConversation();
      await stream.streamVoiceResponse(`/api/conversations/${convId}/messages`, blob);
    } else {
      await recorder.startRecording();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-[420px] h-[560px] pixel-card flex flex-col z-50 overflow-hidden"
            data-testid="chat-widget-panel"
          >
            <div className="bg-primary/10 p-2.5 border-b border-border">
              <div className="flex justify-between items-center gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse flex-shrink-0" />
                  <span className="text-xs font-display text-foreground truncate">Syncc AI</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-1.5 text-[10px] gap-1"
                        data-testid="button-model-selector"
                      >
                        <span className={cn("flex items-center gap-1", getProviderColor(selectedModel.provider))}>
                          {getProviderIcon(selectedModel.provider)}
                          <span className="truncate max-w-[80px]">{selectedModel.name}</span>
                        </span>
                        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel className="text-xs">OpenAI</DropdownMenuLabel>
                      {MODELS.filter(m => m.provider === "openai").map(model => (
                        <DropdownMenuItem 
                          key={model.id}
                          onClick={() => setSelectedModel(model)}
                          className="gap-2"
                          data-testid={`menu-item-${model.id}`}
                        >
                          <SiOpenai className="w-3 h-3 text-green-400" />
                          {model.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">Anthropic</DropdownMenuLabel>
                      {MODELS.filter(m => m.provider === "anthropic").map(model => (
                        <DropdownMenuItem 
                          key={model.id}
                          onClick={() => setSelectedModel(model)}
                          className="gap-2"
                          data-testid={`menu-item-${model.id}`}
                        >
                          <Sparkles className="w-3 h-3 text-orange-400" />
                          {model.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">Google</DropdownMenuLabel>
                      {MODELS.filter(m => m.provider === "gemini").map(model => (
                        <DropdownMenuItem 
                          key={model.id}
                          onClick={() => setSelectedModel(model)}
                          className="gap-2"
                          data-testid={`menu-item-${model.id}`}
                        >
                          <SiGoogle className="w-3 h-3 text-blue-400" />
                          {model.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleNewChat}
                    title="New chat"
                    data-testid="button-new-chat"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    data-testid="button-close-chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-1">
                {AI_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all flex-1 justify-center",
                      selectedMode.id === mode.id
                        ? "bg-background/80 border border-border shadow-sm"
                        : "hover:bg-background/40"
                    )}
                    title={mode.description}
                    data-testid={`mode-${mode.id}`}
                  >
                    <span className={cn(selectedMode.id === mode.id ? mode.color : "text-muted-foreground")}>
                      {getModeIcon(mode.icon)}
                    </span>
                    <span className={cn(
                      "hidden sm:inline",
                      selectedMode.id === mode.id ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {mode.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "max-w-[90%] rounded-lg p-3 text-sm leading-relaxed",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground ml-auto rounded-tr-none" 
                      : "bg-muted text-foreground mr-auto rounded-tl-none border border-border"
                  )}
                  data-testid={`message-${msg.role}-${idx}`}
                >
                  {msg.role === "assistant" && msg.text !== "..." ? (
                    <MarkdownMessage content={msg.text} />
                  ) : msg.text === "..." ? (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-2.5 border-t border-border bg-card/50">
              <div className="flex gap-2">
                <button
                  onClick={handleVoiceToggle}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    recorder.state === "recording" 
                      ? "bg-destructive text-destructive-foreground animate-pulse" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                  data-testid="button-voice"
                >
                  {recorder.state === "recording" ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Ask Syncc AI (${selectedMode.name} mode)...`}
                  className="flex-1 bg-background border border-border rounded-md px-3 text-sm focus:outline-none focus:border-primary/50"
                  disabled={isLoading}
                  data-testid="input-chat-message"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className={cn(
                    "p-2 bg-primary text-primary-foreground rounded-md",
                    isLoading ? "opacity-50" : "hover:bg-primary/90"
                  )}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-50 border-2 border-primary-foreground/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid="button-open-chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6 text-primary-foreground" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="h-7 w-7 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

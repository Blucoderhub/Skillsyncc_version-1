import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, Square, ChevronDown, Sparkles } from "lucide-react";
import { useVoiceRecorder, useVoiceStream } from "../../replit_integrations/audio";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

const MODELS: AIModel[] = [
  { id: "gpt-5", name: "GPT-5", provider: "openai" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "openai" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet", provider: "anthropic" },
  { id: "claude-haiku-4-5", name: "Claude Haiku", provider: "anthropic" },
  { id: "gemini-2.5-flash", name: "Gemini Flash", provider: "gemini" },
  { id: "gemini-2.5-pro", name: "Gemini Pro", provider: "gemini" },
];

function getProviderIcon(provider: string) {
  switch (provider) {
    case "openai":
      return <SiOpenai className="w-3 h-3" />;
    case "anthropic":
      return <Sparkles className="w-3 h-3" />;
    case "gemini":
      return <SiGoogle className="w-3 h-3" />;
    default:
      return <Sparkles className="w-3 h-3" />;
  }
}

function getProviderColor(provider: string) {
  switch (provider) {
    case "openai":
      return "text-green-400";
    case "anthropic":
      return "text-orange-400";
    case "gemini":
      return "text-blue-400";
    default:
      return "text-primary";
  }
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Greetings, BlueCoder! Select an AI model and ask me anything about coding." }
  ]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(MODELS[0]);
  const [isLoading, setIsLoading] = useState(false);
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
      const response = await fetch(`/api/conversations/1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: userText,
          model: selectedModel.id,
          provider: selectedModel.provider
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
      await stream.streamVoiceResponse("/api/conversations/1/messages", blob);
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
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] pixel-card flex flex-col z-50 overflow-hidden"
            data-testid="chat-widget-panel"
          >
            <div className="bg-primary/10 p-3 border-b border-border flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse flex-shrink-0" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs font-display gap-1"
                      data-testid="button-model-selector"
                    >
                      <span className={cn("flex items-center gap-1", getProviderColor(selectedModel.provider))}>
                        {getProviderIcon(selectedModel.provider)}
                        <span className="truncate max-w-[100px]">{selectedModel.name}</span>
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
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
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "max-w-[85%] rounded-lg p-3 text-sm font-body leading-relaxed",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground ml-auto rounded-tr-none" 
                      : "bg-muted text-foreground mr-auto rounded-tl-none border border-border"
                  )}
                  data-testid={`message-${msg.role}-${idx}`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-border bg-card/50">
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
                  placeholder="Ask anything..."
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

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-primary rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 border-2 border-primary-foreground/20"
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-7 w-7 text-primary-foreground" />
      </button>
    </>
  );
}

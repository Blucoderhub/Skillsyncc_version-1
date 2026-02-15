import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Eye, EyeOff, Bold, Italic, Code, List, ListOrdered, Heading, Link, Image, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
}

export default function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your content here...",
  height = "400px",
  className 
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector(".markdown-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const toolbarItems = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: Code, label: "Code", action: () => insertMarkdown("`", "`") },
    { icon: Heading, label: "Heading", action: () => insertMarkdown("## ", "") },
    { icon: List, label: "Bullet List", action: () => insertMarkdown("- ", "") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("1. ", "") },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ", "") },
    { icon: Link, label: "Link", action: () => insertMarkdown("[", "](url)") },
    { icon: Image, label: "Image", action: () => insertMarkdown("![", "](image-url)") },
  ];

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-1">
          {toolbarItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={item.action}
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative" style={{ height }}>
        {!showPreview ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="markdown-textarea w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4 font-mono text-sm"
          />
        ) : (
          <div className="h-full overflow-auto p-4 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {value || "*Start typing to see preview...*"}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="p-2 border-t text-xs text-muted-foreground bg-muted/30">
        <div className="flex items-center justify-between">
          <span>Markdown supported. Use toolbar or type markdown syntax directly.</span>
          <span>{value.length} characters</span>
        </div>
      </div>
    </div>
  );
}

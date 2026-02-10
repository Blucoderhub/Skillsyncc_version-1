import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import {
  Save, Eye, EyeOff, Upload, Plus, Trash2, ChevronUp, ChevronDown,
  FileText, Code, Image, HelpCircle, ArrowLeft, Clock, Zap
} from "lucide-react";

type ContentSection = {
  id: string;
  type: string;
  content?: string;
  language?: string;
  code?: string;
  runnable?: boolean;
  expectedOutput?: string;
  explanation?: string;
  url?: string;
  alt?: string;
  caption?: string;
  question?: string;
  questionType?: string;
  options?: string[];
  correctAnswer?: number;
  starterCode?: string;
  solution?: string;
  instructions?: string;
  testCases?: Array<{ description: string; test: string }>;
};

type ContentData = {
  title: string;
  contentType: string;
  templateType: string;
  category: string;
  subCategory: string;
  tags: string[];
  difficultyLevel: string;
  estimatedMinutes: number | null;
  contentJson: { version: string; sections: ContentSection[] };
  status: string;
  metaTitle: string;
  metaDescription: string;
  isPremium: boolean;
};

const defaultContent: ContentData = {
  title: "",
  contentType: "tutorial",
  templateType: "standard_tutorial",
  category: "web-development",
  subCategory: "",
  tags: [],
  difficultyLevel: "beginner",
  estimatedMinutes: null,
  contentJson: { version: "1.0", sections: [] },
  status: "draft",
  metaTitle: "",
  metaDescription: "",
  isPremium: false,
};

const CATEGORIES = [
  { value: "web-development", label: "Web Development" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "data-science", label: "Data Science & AI" },
  { value: "blockchain", label: "Blockchain & Web3" },
  { value: "devops", label: "DevOps & Cloud" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "algorithms", label: "Algorithms" },
  { value: "databases", label: "Databases" },
];

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

export default function ContentEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = !!id;

  const [content, setContent] = useState<ContentData>(defaultContent);
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const { data: existingContent, isLoading } = useQuery<any>({
    queryKey: ["/api/cms/content", id],
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingContent && isEditMode) {
      setContent({
        title: existingContent.title || "",
        contentType: existingContent.contentType || "tutorial",
        templateType: existingContent.templateType || "standard_tutorial",
        category: existingContent.category || "web-development",
        subCategory: existingContent.subCategory || "",
        tags: existingContent.tags || [],
        difficultyLevel: existingContent.difficultyLevel || "beginner",
        estimatedMinutes: existingContent.estimatedMinutes || null,
        contentJson: existingContent.contentJson || { version: "1.0", sections: [] },
        status: existingContent.status || "draft",
        metaTitle: existingContent.metaTitle || "",
        metaDescription: existingContent.metaDescription || "",
        isPremium: existingContent.isPremium || false,
      });
    }
  }, [existingContent, isEditMode]);

  const saveMutation = useMutation({
    mutationFn: async (data: { content: ContentData; publish?: boolean }) => {
      if (isEditMode) {
        const res = await apiRequest("PATCH", `/api/cms/content/${id}`, {
          ...data.content,
          isAutoSave: false,
          changeLog: `Manual save`,
        });
        if (data.publish) {
          await apiRequest("POST", `/api/cms/content/${id}/publish`);
        }
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/cms/content", {
          ...data.content,
          status: data.publish ? "published" : "draft",
        });
        return res.json();
      }
    },
    onSuccess: (result: any, variables) => {
      toast({
        title: variables.publish ? "Content published!" : "Content saved!",
        description: variables.publish ? "Your content is now live." : "Draft saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/content"] });
      if (!isEditMode && result?.id) {
        navigate(`/cms/edit/${result.id}`);
      }
    },
    onError: (error: any) => {
      toast({ title: "Save failed", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const autoSaveMutation = useMutation({
    mutationFn: async () => {
      if (!isEditMode) return;
      await apiRequest("PATCH", `/api/cms/content/${id}`, {
        ...content,
        isAutoSave: true,
      });
    },
    onSuccess: () => {
      toast({ title: "Auto-saved", description: "Changes saved automatically." });
    },
  });

  useEffect(() => {
    if (!isEditMode || !content.title) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      autoSaveMutation.mutate();
    }, 30000);
    setAutoSaveTimer(timer);
    return () => { if (timer) clearTimeout(timer); };
  }, [content.contentJson]);

  const addSection = useCallback((type: string) => {
    const newSection: ContentSection = {
      id: `section-${Date.now()}`,
      type,
      ...(type === "text" && { content: "" }),
      ...(type === "code" && { language: "javascript", code: "", runnable: false, explanation: "" }),
      ...(type === "interactive_code" && { language: "javascript", starterCode: "", solution: "", instructions: "", testCases: [] }),
      ...(type === "image" && { url: "", alt: "", caption: "" }),
      ...(type === "quiz" && { question: "", questionType: "multiple_choice", options: ["", "", "", ""], correctAnswer: 0, explanation: "" }),
    };
    setContent(prev => ({
      ...prev,
      contentJson: { ...prev.contentJson, sections: [...prev.contentJson.sections, newSection] },
    }));
  }, []);

  const updateSection = useCallback((sectionId: string, updates: Partial<ContentSection>) => {
    setContent(prev => ({
      ...prev,
      contentJson: {
        ...prev.contentJson,
        sections: prev.contentJson.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s),
      },
    }));
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setContent(prev => ({
      ...prev,
      contentJson: {
        ...prev.contentJson,
        sections: prev.contentJson.sections.filter(s => s.id !== sectionId),
      },
    }));
  }, []);

  const moveSection = useCallback((sectionId: string, direction: "up" | "down") => {
    setContent(prev => {
      const sections = [...prev.contentJson.sections];
      const index = sections.findIndex(s => s.id === sectionId);
      if (direction === "up" && index > 0) {
        [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
      } else if (direction === "down" && index < sections.length - 1) {
        [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
      }
      return { ...prev, contentJson: { ...prev.contentJson, sections } };
    });
  }, []);

  const addTag = useCallback(() => {
    if (tagInput.trim()) {
      setContent(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  }, [tagInput]);

  const removeTag = useCallback((index: number) => {
    setContent(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  }, []);

  const renderSectionEditor = (section: ContentSection, index: number) => {
    const sectionIcons: Record<string, any> = { text: FileText, code: Code, interactive_code: Zap, image: Image, quiz: HelpCircle };
    const SectionIcon = sectionIcons[section.type] || FileText;
    const sectionLabels: Record<string, string> = { text: "Text Section", code: "Code Block", interactive_code: "Interactive Code", image: "Image", quiz: "Quiz" };

    return (
      <Card key={section.id} className="border-border/60" data-testid={`section-card-${section.id}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 py-3 px-4">
          <div className="flex items-center gap-2">
            <SectionIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{sectionLabels[section.type] || section.type}</span>
            <Badge variant="outline" className="text-xs">{index + 1}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => moveSection(section.id, "up")} disabled={index === 0} data-testid={`btn-move-up-${section.id}`}>
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => moveSection(section.id, "down")} disabled={index === content.contentJson.sections.length - 1} data-testid={`btn-move-down-${section.id}`}>
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => deleteSection(section.id)} data-testid={`btn-delete-${section.id}`}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {section.type === "text" && (
            <Textarea
              value={section.content || ""}
              onChange={(e) => updateSection(section.id, { content: e.target.value })}
              placeholder="Enter text content (supports HTML)..."
              className="min-h-[150px] font-mono text-sm"
              data-testid={`input-text-${section.id}`}
            />
          )}

          {(section.type === "code" || section.type === "interactive_code") && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Select value={section.language || "javascript"} onValueChange={(v) => updateSection(section.id, { language: v })}>
                  <SelectTrigger className="w-[180px]" data-testid={`select-lang-${section.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {section.type === "code" && (
                  <div className="flex items-center gap-2">
                    <Switch checked={section.runnable || false} onCheckedChange={(v) => updateSection(section.id, { runnable: v })} data-testid={`switch-runnable-${section.id}`} />
                    <Label className="text-sm">Runnable</Label>
                  </div>
                )}
              </div>
              <div className="border rounded-md overflow-hidden">
                <Editor
                  height="200px"
                  language={section.language || "javascript"}
                  theme="vs-dark"
                  value={section.type === "code" ? (section.code || "") : (section.starterCode || "")}
                  onChange={(v) => updateSection(section.id, section.type === "code" ? { code: v || "" } : { starterCode: v || "" })}
                  options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: "on", scrollBeyondLastLine: false }}
                />
              </div>
              {section.type === "code" && (
                <Input
                  value={section.explanation || ""}
                  onChange={(e) => updateSection(section.id, { explanation: e.target.value })}
                  placeholder="Explanation for this code block..."
                  data-testid={`input-explanation-${section.id}`}
                />
              )}
              {section.type === "interactive_code" && (
                <>
                  <Input value={section.instructions || ""} onChange={(e) => updateSection(section.id, { instructions: e.target.value })} placeholder="Instructions for the learner..." data-testid={`input-instructions-${section.id}`} />
                  <div className="border rounded-md overflow-hidden">
                    <div className="px-3 py-1 bg-muted text-xs font-medium">Solution Code</div>
                    <Editor height="150px" language={section.language || "javascript"} theme="vs-dark" value={section.solution || ""} onChange={(v) => updateSection(section.id, { solution: v || "" })} options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }} />
                  </div>
                </>
              )}
            </div>
          )}

          {section.type === "image" && (
            <div className="space-y-3">
              <Input value={section.url || ""} onChange={(e) => updateSection(section.id, { url: e.target.value })} placeholder="Image URL..." data-testid={`input-image-url-${section.id}`} />
              <Input value={section.alt || ""} onChange={(e) => updateSection(section.id, { alt: e.target.value })} placeholder="Alt text (accessibility)..." data-testid={`input-image-alt-${section.id}`} />
              <Input value={section.caption || ""} onChange={(e) => updateSection(section.id, { caption: e.target.value })} placeholder="Caption (optional)..." data-testid={`input-image-caption-${section.id}`} />
              {section.url && (
                <div className="mt-2 rounded-md overflow-hidden border max-w-sm">
                  <img src={section.url} alt={section.alt || "Preview"} className="w-full h-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
          )}

          {section.type === "quiz" && (
            <div className="space-y-3">
              <Input value={section.question || ""} onChange={(e) => updateSection(section.id, { question: e.target.value })} placeholder="Question..." data-testid={`input-question-${section.id}`} />
              <div className="space-y-2">
                {(section.options || []).map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${section.id}`} checked={section.correctAnswer === i} onChange={() => updateSection(section.id, { correctAnswer: i })} className="accent-primary" data-testid={`radio-option-${section.id}-${i}`} />
                    <Input value={option} onChange={(e) => {
                      const newOptions = [...(section.options || [])];
                      newOptions[i] = e.target.value;
                      updateSection(section.id, { options: newOptions });
                    }} placeholder={`Option ${i + 1}`} data-testid={`input-option-${section.id}-${i}`} />
                  </div>
                ))}
              </div>
              <Textarea value={section.explanation || ""} onChange={(e) => updateSection(section.id, { explanation: e.target.value })} placeholder="Explanation (shown after answer)..." rows={2} data-testid={`input-quiz-explanation-${section.id}`} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPreview = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-['Press_Start_2P'] text-primary">{content.title || "Untitled"}</h1>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>{content.difficultyLevel}</Badge>
        <Badge variant="outline">{content.category}</Badge>
        {content.estimatedMinutes && <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{content.estimatedMinutes} min</Badge>}
      </div>
      {content.contentJson.sections.map((section) => (
        <div key={section.id} className="mb-4">
          {section.type === "text" && (
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: section.content || "" }} />
          )}
          {(section.type === "code" || section.type === "interactive_code") && (
            <Card className="bg-[#1e1e1e]">
              <CardContent className="p-0">
                <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
                  <Code className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">{section.language}</span>
                </div>
                <pre className="p-4 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre"><code>{section.type === "code" ? section.code : section.starterCode}</code></pre>
                {section.explanation && <div className="px-4 py-2 border-t border-border/40 text-sm text-muted-foreground">{section.explanation}</div>}
              </CardContent>
            </Card>
          )}
          {section.type === "image" && section.url && (
            <figure className="my-4">
              <img src={section.url} alt={section.alt || ""} className="rounded-md max-w-full" />
              {section.caption && <figcaption className="text-sm text-muted-foreground mt-2 text-center">{section.caption}</figcaption>}
            </figure>
          )}
          {section.type === "quiz" && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="font-semibold">{section.question}</p>
                <div className="space-y-2">
                  {(section.options || []).map((opt, i) => (
                    <div key={i} className={`p-2 rounded-md border cursor-pointer ${i === section.correctAnswer ? "border-green-500 bg-green-500/10" : "border-border"}`}>
                      {opt}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );

  if (isLoading && isEditMode) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} data-testid="btn-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold font-['Press_Start_2P'] text-primary">
            {isEditMode ? "Edit Content" : "Create Content"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} data-testid="btn-toggle-preview">
            {showPreview ? <><EyeOff className="w-4 h-4 mr-2" />Hide Preview</> : <><Eye className="w-4 h-4 mr-2" />Preview</>}
          </Button>
          <Button variant="outline" onClick={() => saveMutation.mutate({ content })} disabled={saveMutation.isPending} data-testid="btn-save-draft">
            <Save className="w-4 h-4 mr-2" />{saveMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={() => saveMutation.mutate({ content, publish: true })} disabled={saveMutation.isPending} data-testid="btn-publish">
            <Upload className="w-4 h-4 mr-2" />Publish
          </Button>
        </div>
      </div>

      {showPreview ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
          {renderPreview()}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={content.title} onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))} placeholder="Content Title" className="text-xl font-bold" data-testid="input-title" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={content.contentType} onValueChange={(v) => setContent(prev => ({ ...prev, contentType: v }))}>
                      <SelectTrigger data-testid="select-content-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                        <SelectItem value="reference">Reference Guide</SelectItem>
                        <SelectItem value="challenge">Challenge</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="video_lesson">Video Lesson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={content.difficultyLevel} onValueChange={(v) => setContent(prev => ({ ...prev, difficultyLevel: v }))}>
                      <SelectTrigger data-testid="select-difficulty"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={content.category} onValueChange={(v) => setContent(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated Time (min)</Label>
                    <Input type="number" value={content.estimatedMinutes || ""} onChange={(e) => setContent(prev => ({ ...prev, estimatedMinutes: e.target.value ? parseInt(e.target.value) : null }))} placeholder="30" data-testid="input-estimated-time" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg">Content Sections</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => addSection("text")} data-testid="btn-add-text"><FileText className="w-3 h-3 mr-1" />Text</Button>
                  <Button size="sm" variant="outline" onClick={() => addSection("code")} data-testid="btn-add-code"><Code className="w-3 h-3 mr-1" />Code</Button>
                  <Button size="sm" variant="outline" onClick={() => addSection("interactive_code")} data-testid="btn-add-interactive"><Zap className="w-3 h-3 mr-1" />Interactive</Button>
                  <Button size="sm" variant="outline" onClick={() => addSection("image")} data-testid="btn-add-image"><Image className="w-3 h-3 mr-1" />Image</Button>
                  <Button size="sm" variant="outline" onClick={() => addSection("quiz")} data-testid="btn-add-quiz"><HelpCircle className="w-3 h-3 mr-1" />Quiz</Button>
                </div>
              </CardHeader>
              <CardContent>
                {content.contentJson.sections.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No sections yet. Add your first section above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.contentJson.sections.map((section, index) => renderSectionEditor(section, index))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">SEO Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={content.metaTitle} onChange={(e) => setContent(prev => ({ ...prev, metaTitle: e.target.value }))} placeholder="Meta Title" data-testid="input-meta-title" />
                <Textarea value={content.metaDescription} onChange={(e) => setContent(prev => ({ ...prev, metaDescription: e.target.value }))} placeholder="Meta Description" rows={3} data-testid="input-meta-description" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Tags</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} data-testid="input-tag" />
                  <Button size="sm" variant="outline" onClick={addTag} data-testid="btn-add-tag"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeTag(i)} data-testid={`tag-${i}`}>
                      {tag} <span className="ml-1">x</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-semibold">Premium Content</Label>
                    <p className="text-xs text-muted-foreground mt-1">Club members only</p>
                  </div>
                  <Switch checked={content.isPremium} onCheckedChange={(v) => setContent(prev => ({ ...prev, isPremium: v }))} data-testid="switch-premium" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Status</CardTitle></CardHeader>
              <CardContent>
                <Badge variant={content.status === "published" ? "default" : "secondary"} data-testid="badge-status">
                  {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {content.contentJson.sections.length} sections
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Languages,
  Sparkles,
  CheckCircle,
  MessageSquare,
  BookOpen,
  Palette,
  ListOrdered,
  FileEdit,
  Scissors,
  PenTool,
  Target,
  AlignLeft,
  LayoutTemplate,
  ChevronDown
} from "lucide-react";

interface DocsPromptExamplesProps {
  onSelectPrompt: (prompt: string) => void;
  fileName?: string;
}

const promptCategories = [
  {
    title: "✏️ Writing & Editing",
    icon: FileEdit,
    color: "text-blue-500",
    prompts: [
      { label: "Rewrite paragraph", value: "Rewrite the first paragraph to be more engaging" },
      { label: "Improve clarity", value: "Make this document clearer and easier to understand" },
      { label: "Add introduction", value: "Add a compelling introduction to this document" },
      { label: "Write conclusion", value: "Write a strong conclusion for this document" },
      { label: "Expand content", value: "Expand on the main points with more details and examples" },
      { label: "Shorten text", value: "Make this document more concise by removing unnecessary content" },
      { label: "Rewrite for audience", value: "Rewrite this for a non-technical audience" },
      { label: "Add section", value: "Add a new section about [topic] with relevant content" },
      { label: "Improve transitions", value: "Add better transition sentences between paragraphs" },
      { label: "Restructure document", value: "Reorganize the content for better logical flow" },
      { label: "Remove redundancy", value: "Remove repetitive sentences and consolidate similar ideas" },
      { label: "Enhance opening", value: "Rewrite the opening to grab reader attention immediately" },
    ]
  },
  {
    title: "✓ Grammar & Spelling",
    icon: CheckCircle,
    color: "text-green-500",
    prompts: [
      { label: "Fix all errors", value: "Fix all grammar and spelling errors in this document" },
      { label: "Check punctuation", value: "Correct all punctuation errors" },
      { label: "Fix sentence structure", value: "Improve sentence structure throughout the document" },
      { label: "Remove redundancy", value: "Remove redundant words and phrases" },
      { label: "Fix verb tenses", value: "Make verb tenses consistent throughout" },
      { label: "Active voice", value: "Convert passive voice sentences to active voice" },
      { label: "Fix spacing", value: "Correct spacing around punctuation and between words" },
      { label: "Consistent capitalization", value: "Fix inconsistent capitalization throughout the document" },
      { label: "Oxford comma", value: "Add Oxford commas for consistency" },
      { label: "Contractions", value: "Remove or add contractions consistently throughout" },
      { label: "Subject-verb agreement", value: "Fix all subject-verb agreement errors" },
      { label: "Pronoun clarity", value: "Improve pronoun usage for better clarity" },
    ]
  },
  {
    title: "🌐 Translation",
    icon: Languages,
    color: "text-purple-500",
    prompts: [
      { label: "Translate to English", value: "Translate this document to English" },
      { label: "Translate to Spanish", value: "Translate this document to Spanish" },
      { label: "Translate to Indonesian", value: "Translate this document to Indonesian (Bahasa Indonesia)" },
      { label: "Translate to French", value: "Translate this document to French" },
      { label: "Translate to German", value: "Translate this document to German" },
      { label: "Translate to Chinese", value: "Translate this document to Chinese (Simplified)" },
      { label: "Translate to Japanese", value: "Translate this document to Japanese" },
      { label: "Translate to Korean", value: "Translate this document to Korean" },
    ]
  },
  {
    title: "🎨 Tone & Style",
    icon: Palette,
    color: "text-orange-500",
    prompts: [
      { label: "Make it formal", value: "Rewrite this document in a formal, professional tone" },
      { label: "Make it casual", value: "Rewrite this in a casual, friendly tone" },
      { label: "Make it persuasive", value: "Make this document more persuasive and convincing" },
      { label: "Academic style", value: "Convert this to academic writing style" },
      { label: "Business style", value: "Rewrite in professional business communication style" },
      { label: "Conversational", value: "Make this more conversational and engaging" },
      { label: "Authoritative tone", value: "Rewrite to establish authority and expertise on the topic" },
      { label: "Friendly & approachable", value: "Rewrite in a warm, approachable, and friendly tone" },
      { label: "Technical to plain", value: "Simplify technical jargon into plain language" },
      { label: "Creative writing", value: "Add creative elements and vivid descriptions" },
      { label: "Urgent & motivating", value: "Rewrite to create sense of urgency and motivation" },
      { label: "Inspirational", value: "Rewrite with an inspirational and empowering tone" },
    ]
  },
  {
    title: "📋 Summarization",
    icon: Target,
    color: "text-cyan-500",
    prompts: [
      { label: "Summarize document", value: "Create a brief summary of this document" },
      { label: "Key points only", value: "Extract the key points from this document as bullet points" },
      { label: "Executive summary", value: "Write an executive summary for this document" },
      { label: "One paragraph summary", value: "Summarize this entire document in one paragraph" },
      { label: "Abstract", value: "Create an academic abstract for this document" },
      { label: "TL;DR version", value: "Create a TL;DR (too long; didn't read) version" },
    ]
  },
  {
    title: "📝 Formatting",
    icon: ListOrdered,
    color: "text-indigo-500",
    prompts: [
      { label: "Convert to bullet points", value: "Convert this text into organized bullet points" },
      { label: "Add headings", value: "Add clear headings and subheadings to organize this document" },
      { label: "Create numbered list", value: "Convert this into a numbered step-by-step list" },
      { label: "Format as table", value: "Convert the data in this text into a markdown table" },
      { label: "Add paragraphs", value: "Break this text into proper paragraphs with clear transitions" },
      { label: "Create outline", value: "Create an outline structure for this document" },
    ]
  },
  {
    title: "📄 Templates",
    icon: LayoutTemplate,
    color: "text-pink-500",
    prompts: [
      { label: "Business letter", value: "Rewrite this as a formal business letter format" },
      { label: "Email format", value: "Format this as a professional email" },
      { label: "Meeting minutes", value: "Format this as meeting minutes" },
      { label: "Report format", value: "Structure this as a formal report with sections" },
      { label: "Proposal format", value: "Reformat this as a business proposal" },
      { label: "Press release", value: "Rewrite this as a press release format" },
      { label: "Case study", value: "Structure this content as a professional case study" },
      { label: "Whitepaper", value: "Convert this into whitepaper format with executive summary" },
      { label: "FAQ format", value: "Reformat this as a Frequently Asked Questions (FAQ) document" },
      { label: "Policy document", value: "Structure this as an official policy document" },
      { label: "Job description", value: "Transform this into a detailed job description" },
      { label: "Contract template", value: "Format this as a legal contract with standard sections" },
    ]
  },
  {
    title: "✨ Creative Enhancement",
    icon: Sparkles,
    color: "text-amber-500",
    prompts: [
      { label: "Add examples", value: "Add relevant examples to illustrate the main points" },
      { label: "Add analogies", value: "Add analogies and metaphors to make concepts clearer" },
      { label: "Make it engaging", value: "Rewrite to be more engaging and interesting to read" },
      { label: "Add storytelling", value: "Add storytelling elements to make it more compelling" },
      { label: "Add statistics", value: "Suggest where to add statistics or data to strengthen arguments" },
      { label: "Improve flow", value: "Improve the flow and transitions between paragraphs" },
      { label: "Add visual formatting", value: "Add formatting with headers, bold text, and emphasis for readability" },
      { label: "Include quotes", value: "Add relevant quotes to support key points" },
      { label: "Create call-to-action", value: "Add compelling calls-to-action to motivate reader response" },
      { label: "Add personal touch", value: "Add personal anecdotes to make the content more relatable" },
      { label: "Enhance credibility", value: "Add credentials, certifications, and authority markers" },
      { label: "Make memorable", value: "Rewrite key points with memorable phrases and memorable phrasing" },
    ]
  }
];

export const DocsPromptExamples = ({ onSelectPrompt, fileName }: DocsPromptExamplesProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryTitle: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryTitle)) {
      newExpanded.delete(categoryTitle);
    } else {
      newExpanded.add(categoryTitle);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="flex flex-col items-center justify-center py-3 px-3 text-center animate-in fade-in duration-500">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      
      <h4 className="mb-1 font-semibold text-foreground text-sm">
        {fileName ? `Editing "${fileName}"` : "Document AI Assistant"}
      </h4>
      <p className="max-w-[280px] text-xs text-muted-foreground mb-3">
        {fileName 
          ? "Tell me how to improve your document:"
          : "Upload a document to start"}
      </p>

      <div className="w-full space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
        {promptCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.title);
          const displayedPrompts = isExpanded ? category.prompts : category.prompts.slice(0, 2);
          const hasMore = category.prompts.length > 3;

          return (
            <Card key={category.title} className="p-2 bg-accent/30 border-border/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-1 gap-1">
                <div className="flex items-center gap-2 flex-1">
                  <category.icon className={`h-4 w-4 ${category.color}`} />
                  <span className="text-sm font-medium text-foreground">{category.title}</span>
                  {hasMore && (
                    <span className="text-xs text-muted-foreground ml-auto mr-2">
                      {displayedPrompts.length}/{category.prompts.length}
                    </span>
                  )}
                </div>
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategory(category.title)}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {displayedPrompts.map((prompt) => (
                  <Badge
                    key={prompt.label}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs py-1"
                    onClick={() => onSelectPrompt(prompt.value)}
                  >
                    {prompt.label}
                  </Badge>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        💡 Click any example or type your own command
      </p>
    </div>
  );
};

export default DocsPromptExamples;

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent = ({ content }: MarkdownContentProps) => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Check if content is long (more than 500 characters)
  const isLongContent = content.length > 500;
  const [isExpanded, setIsExpanded] = useState(!isLongContent);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ 
      title: "Copied!", 
      description: "Code copied to clipboard",
      duration: 2000 
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    const language = match ? match[1] : "";

    if (!inline && language) {
      return (
        <div className="relative group my-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={() => copyToClipboard(code)}
          >
            {copiedCode === code ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            className="rounded-lg text-sm"
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };

  const contentToRender = isLongContent && !isExpanded 
    ? content.slice(0, 500) + "..." 
    : content;

  return (
    <div className="prose prose-sm max-w-none text-sm text-accent-foreground prose-headings:text-accent-foreground prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:rounded prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:my-2 prose-strong:text-accent-foreground prose-a:text-primary">
      {isLongContent ? (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock,
            }}
          >
            {contentToRender}
          </ReactMarkdown>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 gap-1 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show more
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      ) : (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code: CodeBlock,
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
};

export default MarkdownContent;

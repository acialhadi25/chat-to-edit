import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      title: 'Copied!',
      description: 'Code copied to clipboard',
      duration: 2000,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');
    const language = match ? match[1] : '';

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

  const contentToRender = isLongContent && !isExpanded ? content.slice(0, 500) + '...' : content;

  return (
    <div className="prose prose-sm max-w-none text-sm text-accent-foreground prose-headings:text-accent-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-2 prose-ul:space-y-1 prose-ol:my-2 prose-ol:space-y-1 prose-li:my-0.5 prose-li:leading-relaxed prose-code:rounded prose-code:bg-background/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-xs prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:max-w-full prose-strong:text-accent-foreground prose-strong:font-semibold prose-a:text-primary prose-blockquote:border-l-primary prose-blockquote:bg-background/30 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:my-2 prose-hr:my-3 prose-hr:border-border prose-table:text-xs prose-table:my-2">
      {isLongContent ? (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock,
              h1: ({ children }) => <h1 className="text-lg font-semibold mt-2 mb-1.5 text-accent-foreground">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold mt-2 mb-1.5 text-accent-foreground">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-accent-foreground">{children}</h3>,
              ul: ({ children }) => <ul className="space-y-1 my-2 list-disc pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="space-y-1 my-2 list-decimal pl-5">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
            }}
          >
            {contentToRender}
          </ReactMarkdown>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs">
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
            h1: ({ children }) => <h1 className="text-lg font-semibold mt-2 mb-1.5 text-accent-foreground">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-semibold mt-2 mb-1.5 text-accent-foreground">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-accent-foreground">{children}</h3>,
            ul: ({ children }) => <ul className="space-y-1 my-2 list-disc pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="space-y-1 my-2 list-decimal pl-5">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
};

export default MarkdownContent;

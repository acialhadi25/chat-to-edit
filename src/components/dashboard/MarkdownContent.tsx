import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent = ({ content }: MarkdownContentProps) => {
  return (
    <div className="prose prose-sm max-w-none text-sm text-accent-foreground prose-headings:text-accent-foreground prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:rounded prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-background/50 prose-pre:text-foreground prose-strong:text-accent-foreground prose-a:text-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;

import { Link } from "react-router-dom";
import { FileSpreadsheet, FileText, FileType, ArrowRight } from "lucide-react";

interface ToolCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}

const ToolCard = ({ to, icon, title, description, badge, disabled }: ToolCardProps) => {
  const content = (
    <div
      className={`group relative flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center transition-all hover:border-primary/40 hover:shadow-lg ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {badge && (
        <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
          {badge}
        </span>
      )}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
      <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        {disabled ? "Coming Soon" : "Open"}
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );

  if (disabled) return content;
  return <Link to={to}>{content}</Link>;
};

const ToolSelector = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
          Choose a Tool
        </h1>
        <p className="text-muted-foreground">
          Select an AI-powered editor to get started
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard
          to="/dashboard/excel"
          icon={<FileSpreadsheet className="h-8 w-8" />}
          title="Chat to Excel"
          description="Upload Excel files & manipulate data, formulas, and formatting via AI chat."
        />
        <ToolCard
          to="/dashboard/pdf"
          icon={<FileText className="h-8 w-8" />}
          title="Chat to PDF"
          description="Merge, split, extract pages, add watermarks, and more — all via chat."
        />
        <ToolCard
          to="/dashboard/docs"
          icon={<FileType className="h-8 w-8" />}
          title="Chat to Docs"
          description="AI writing assistant — rewrite, translate, summarize, and format documents."
        />
      </div>
    </div>
  );
};

export default ToolSelector;

import { DataChange } from "@/types/excel";
import { ArrowRight } from "lucide-react";

interface ActionPreviewProps {
  changes: DataChange[];
  totalChanges: number;
}

const ActionPreview = ({ changes, totalChanges }: ActionPreviewProps) => {
  if (changes.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Preview Perubahan ({totalChanges} cell):
      </p>
      <div className="space-y-1.5">
        {changes.map((change, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs"
          >
            <span className="font-mono text-muted-foreground">
              {change.cellRef}:
            </span>
            <span className="max-w-[80px] truncate text-destructive line-through">
              {change.before === null || change.before === "" 
                ? "(kosong)" 
                : String(change.before)}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="max-w-[80px] truncate font-medium text-success">
              {change.type === "formula" ? (
                <code className="text-primary">{String(change.after)}</code>
              ) : change.after === null || change.after === "" ? (
                "(kosong)"
              ) : (
                String(change.after)
              )}
            </span>
          </div>
        ))}
        {totalChanges > changes.length && (
          <p className="text-xs text-muted-foreground">
            ... dan {totalChanges - changes.length} perubahan lainnya
          </p>
        )}
      </div>
    </div>
  );
};

export default ActionPreview;

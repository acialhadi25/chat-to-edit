import { DataChange } from '@/types/excel';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ActionPreviewProps {
  changes: DataChange[];
  totalChanges: number;
}

const ActionPreview = ({ changes, totalChanges }: ActionPreviewProps) => {
  const [showAll, setShowAll] = useState(false);

  if (changes.length === 0) return null;

  const displayedChanges = showAll ? changes : changes.slice(0, 5);
  const hasMore = totalChanges > displayedChanges.length;

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Preview Perubahan ({totalChanges} cell):
      </p>
      <div className={`space-y-1.5 ${!showAll ? 'max-h-[240px] overflow-y-auto' : ''}`}>
        {displayedChanges.map((change, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{change.cellRef}:</span>
            <span className="max-w-[80px] truncate text-destructive line-through">
              {change.before === null || change.before === '' ? '(kosong)' : String(change.before)}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="max-w-[80px] truncate font-medium text-success">
              {(change as any).type === 'formula' ? (
                <code className="text-primary">{String(change.after)}</code>
              ) : change.after === null || change.after === '' ? (
                '(kosong)'
              ) : (
                String(change.after)
              )}
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="mt-2 w-full text-xs h-7"
        >
          <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          {showAll
            ? 'Sembunyikan Perubahan Lainnya'
            : `Tampilkan ${totalChanges - displayedChanges.length} Perubahan Lainnya`
          }
        </Button>
      )}
    </div>
  );
};

export default ActionPreview;

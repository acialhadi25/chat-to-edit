import { AIAction } from '@/types/excel';
import { Check } from 'lucide-react';

interface ConditionalFormatPreviewProps {
  action: AIAction;
}

const ConditionalFormatPreview = ({ action }: ConditionalFormatPreviewProps) => {
  if (
    action.type !== 'CONDITIONAL_FORMAT' ||
    !action.target ||
    !action.conditionType ||
    !action.formatStyle
  ) {
    return null;
  }

  const formatCondition = (type: string, values?: (string | number)[]) => {
    switch (type) {
      case '>':
      case 'greater_than':
        return `Lebih besar dari ${values?.[0]}`;
      case '<':
      case 'less_than':
        return `Kurang dari ${values?.[0]}`;
      case '>=':
        return `Lebih besar atau sama dengan ${values?.[0]}`;
      case '<=':
        return `Kurang dari atau sama dengan ${values?.[0]}`;
      case '=':
      case 'equal_to':
        return `Sama dengan "${values?.[0]}"`;
      case '!=':
      case 'not_equal':
        return `Tidak sama dengan "${values?.[0]}"`;
      case 'contains':
        return `Mengandung "${values?.[0]}"`;
      case 'not_contains':
        return `Tidak mengandung "${values?.[0]}"`;
      case 'empty':
        return `Kosong`;
      case 'not_empty':
        return `Tidak kosong`;
      case 'between':
        return `Antara ${values?.[0]} dan ${values?.[1]}`;
      default:
        return type;
    }
  };

  const targetLabel =
    action.target.type === 'column'
      ? `Kolom ${action.target.ref}`
      : action.target.type === 'range'
        ? `Range ${action.target.ref}`
        : `Cell ${action.target.ref}`;

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3 max-h-[300px] overflow-y-auto">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Preview Formatting Kondisional:
      </p>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{targetLabel}</span>
          <span className="text-muted-foreground">jika</span>
          <span className="font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded text-xs">
            {formatCondition(action.conditionType, action.conditionValues)}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 p-2 rounded border border-dashed border-border">
          <span className="text-xs text-muted-foreground">Preview Gaya:</span>
          <div
            className="px-3 py-1 rounded text-sm shadow-sm"
            style={{
              color: action.formatStyle.color,
              backgroundColor: action.formatStyle.backgroundColor,
              fontWeight: action.formatStyle.fontWeight as any,
              border: `1px solid ${action.formatStyle.color || '#ccc'}`,
            }}
          >
            Contoh Data
          </div>
          <div className="flex items-center gap-1 text-xs text-success ml-auto">
            <Check className="h-3 w-3" />
            Akan diterapkan
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionalFormatPreview;

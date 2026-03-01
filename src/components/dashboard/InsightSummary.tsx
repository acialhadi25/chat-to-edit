// @ts-nocheck
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { AIAction } from '@/types/excel';

interface InsightSummaryProps {
  insights: NonNullable<AIAction['insights']>;
  onCellFocus: (cellRefs: string[]) => void;
}

const InsightSummary = ({ insights, onCellFocus }: InsightSummaryProps) => {
  return (
    <div className="space-y-4 my-2 animate-in fade-in slide-in-from-bottom-2 duration-300 max-h-[300px] overflow-y-auto">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h4 className="text-sm font-semibold">AI Business Insights</h4>
      </div>

      <p className="text-sm text-foreground leading-relaxed px-1">{insights.summary}</p>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {insights.highlights.map((h, i) => (
          <Card
            key={i}
            className={`p-3 border-none shadow-none ${
              h.type === 'positive'
                ? 'bg-success/10'
                : h.type === 'negative'
                  ? 'bg-destructive/10'
                  : 'bg-muted'
            }`}
          >
            <div className="flex items-start gap-2">
              <Lightbulb
                className={`h-3.5 w-3.5 mt-0.5 ${
                  h.type === 'positive'
                    ? 'text-success'
                    : h.type === 'negative'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                }`}
              />
              <span className="text-xs font-medium leading-tight">{h.text}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Trends */}
      <div className="space-y-2">
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Trends & Patterns
        </h5>
        <div className="space-y-2">
          {insights.trends.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-card border border-border/50 rounded-lg p-3"
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  t.direction === 'up'
                    ? 'bg-success/10'
                    : t.direction === 'down'
                      ? 'bg-destructive/10'
                      : 'bg-muted'
                }`}
              >
                {t.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : t.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{t.topic}</span>
                  <Badge variant="outline" className="text-[9px] h-4 uppercase">
                    {t.direction}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      {insights.anomalies.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            Detected Anomalies
          </h5>
          {insights.anomalies.map((a, i) => (
            <button
              key={i}
              onClick={() => onCellFocus(a.cellRefs)}
              className="w-full flex items-center justify-between gap-3 bg-destructive/5 hover:bg-destructive/10 border border-destructive/10 rounded-lg p-3 transition-colors text-left group"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <span className="text-xs font-medium leading-tight line-clamp-2">
                  {a.description}
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-destructive/50 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightSummary;

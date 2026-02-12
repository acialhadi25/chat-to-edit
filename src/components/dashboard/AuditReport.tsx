import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Info, ArrowRight, Zap } from "lucide-react";
import { AIAction } from "@/types/excel";

interface AuditReportProps {
    report: NonNullable<AIAction["auditReport"]>;
    onApplySuggestion: (action: AIAction, id: string) => void;
    appliedActionIds?: string[];
}

const AuditReport = ({ report, onApplySuggestion, appliedActionIds = [] }: AuditReportProps) => {
    return (
        <div className="space-y-4 my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Audit Kualitas Data
                </h4>
                <Badge variant="outline" className="text-xs">
                    {report.totalErrors} Temuan
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {/* Outliers */}
                {report.outliers.length > 0 && (
                    <Card className="p-3 bg-warning/5 border-warning/20">
                        <h5 className="text-xs font-bold text-warning mb-2 flex items-center gap-1">
                            <Info className="h-3 w-3" /> Outlier terdeteksi
                        </h5>
                        <div className="space-y-1">
                            {report.outliers.slice(0, 3).map((outlier, i) => (
                                <div key={i} className="text-[11px] flex items-center justify-between">
                                    <span>Sel {outlier.cellRef}: {outlier.value}</span>
                                    <span className="text-muted-foreground italic">{outlier.reason}</span>
                                </div>
                            ))}
                            {report.outliers.length > 3 && (
                                <p className="text-[10px] text-muted-foreground">...dan {report.outliers.length - 3} lainnya</p>
                            )}
                        </div>
                    </Card>
                )}

                {/* Inconsistencies */}
                {report.typeInconsistencies.length > 0 && (
                    <Card className="p-3 bg-destructive/5 border-destructive/20">
                        <h5 className="text-xs font-bold text-destructive mb-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Inkonsistensi Format
                        </h5>
                        <div className="space-y-1">
                            {report.typeInconsistencies.slice(0, 3).map((inc, i) => (
                                <div key={i} className="text-[11px]">
                                    {inc.cellRef}: Mengharapkan {inc.expected} tapi menemukan {inc.found}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Missing Values */}
                {report.missingValues.length > 0 && (
                    <Card className="p-3 bg-muted/50 border-border">
                        <h5 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Data yang Hilang
                        </h5>
                        <div className="flex flex-wrap gap-1">
                            {Array.from(new Set(report.missingValues.map(m => m.column))).map(col => (
                                <Badge key={col} variant="secondary" className="text-[10px]">
                                    {col}
                                </Badge>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* Suggestions */}
            {report.suggestions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium px-1">Perbaikan Pintar:</p>
                    {report.suggestions.map((s, idx) => {
                        const suggestionId = s.id || `suggest-${idx}`;
                        const isApplied = appliedActionIds.includes(suggestionId);
                        return (
                            <Button
                                key={suggestionId}
                                size="sm"
                                disabled={isApplied}
                                className={`w-full justify-between h-auto py-2 px-3 text-left border-none transition-all duration-300 ${isApplied
                                        ? "bg-green-600 hover:bg-green-600 text-white opacity-90 cursor-default"
                                        : "bg-slate-900 hover:bg-slate-800 text-white"
                                    }`}
                                onClick={() => !isApplied && onApplySuggestion(s.action, suggestionId)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${isApplied ? "bg-white/20" : "bg-white/10"
                                        }`}>
                                        {isApplied ? (
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                        ) : (
                                            <Zap className="h-3.5 w-3.5 text-white" />
                                        )}
                                    </div>
                                    <span className="text-xs font-medium leading-tight">{s.description}</span>
                                </div>
                                {!isApplied && <ArrowRight className="h-3.5 w-3.5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />}
                                {isApplied && <CheckCircle2 className="h-4 w-4 text-white" />}
                            </Button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AuditReport;

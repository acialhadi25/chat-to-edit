// @ts-nocheck
import { useMemo } from 'react';
import { ExcelData, AIAction } from '@/types/excel';
import { calculateStatistics, createGroupSummary } from '@/utils/excel/analysisOperations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataSummaryPreviewProps {
  data: ExcelData;
  action: AIAction;
}

const DataSummaryPreview = ({ data, action }: DataSummaryPreviewProps) => {
  const summaryData = useMemo(() => {
    if (action.type === 'STATISTICS' && action.target?.type === 'column') {
      const colIndex =
        data.headers.findIndex((h) => h === action.target?.ref) ||
        (action.target.ref.match(/^[A-Z]+$/)
          ? data.headers.findIndex((_, i) => {
              let letter = '';
              let n = i;
              while (n >= 0) {
                letter = String.fromCharCode(65 + (n % 26)) + letter;
                n = Math.floor(n / 26) - 1;
              }
              return letter === action.target?.ref;
            })
          : -1);

      if (colIndex !== -1) {
        const stats = calculateStatistics(data, colIndex);
        return {
          type: 'statistics',
          columnName: data.headers[colIndex],
          data: [
            { label: 'Total (Sum)', value: stats.sum },
            { label: 'Rata-rata (Average)', value: Math.round(stats.average * 100) / 100 },
            { label: 'Jumlah (Count)', value: stats.count },
            { label: 'Minimum', value: stats.min },
            { label: 'Maximum', value: stats.max },
            { label: 'Median', value: stats.median },
            { label: 'Standar Deviasi', value: Math.round(stats.stdDev * 100) / 100 },
          ],
        };
      }
    }

    if (
      action.type === 'PIVOT_SUMMARY' &&
      action.groupByColumn !== undefined &&
      action.aggregateColumn !== undefined
    ) {
      const summary = createGroupSummary(
        data,
        action.groupByColumn,
        action.aggregateColumn,
        (action.statisticsType as any) || 'sum'
      );

      return {
        type: 'pivot',
        groupBy: data.headers[action.groupByColumn],
        aggregate: data.headers[action.aggregateColumn],
        operation: (action.statisticsType || 'sum').toUpperCase(),
        data: summary.slice(0, 10), // Limit to top 10 for preview
      };
    }

    return null;
  }, [data, action]);

  if (!summaryData) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-background overflow-hidden max-h-[300px] overflow-y-auto">
      <div className="bg-muted/50 px-3 py-2 border-b border-border">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {summaryData.type === 'statistics'
            ? `Statistik: ${summaryData.columnName}`
            : `Ringkasan: ${summaryData.groupBy} (${summaryData.operation})`}
        </h4>
      </div>

      <div className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-[10px] uppercase">
                {summaryData.type === 'statistics' ? 'Metrik' : summaryData.groupBy}
              </TableHead>
              <TableHead className="h-8 text-[10px] uppercase text-right">Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryData.type === 'statistics'
              ? (summaryData as any).data.map((item: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="py-1.5 text-xs">{item.label}</TableCell>
                    <TableCell className="py-1.5 text-xs text-right font-medium">
                      {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                    </TableCell>
                  </TableRow>
                ))
              : (summaryData as any).data.map((item: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="py-1.5 text-xs truncate max-w-[120px]">
                      {item.groupName}
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-right font-medium">
                      {item.value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {summaryData.type === 'pivot' && (summaryData as any).data.length >= 10 && (
          <div className="px-3 py-1.5 border-t border-border bg-muted/20">
            <p className="text-[10px] text-muted-foreground text-center italic">
              Menampilkan 10 grup pertama...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSummaryPreview;

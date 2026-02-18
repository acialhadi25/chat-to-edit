import { useMemo, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from 'recharts';
import { ExcelData, AIAction } from '@/types/excel';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface ChartPreviewProps {
  data: ExcelData;
  action: AIAction;
  onUpdate?: (updatedAction: AIAction) => void;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ChartPreview = ({ data, action, onUpdate }: ChartPreviewProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    if (action.xAxisColumn !== undefined && action.yAxisColumns) {
      // Limit to first 30 rows for better visualization
      return data.rows.slice(0, 30).map((row) => {
        const item: any = {
          name: String(row[action.xAxisColumn!] || ''),
        };
        action.yAxisColumns!.forEach((colIdx) => {
          const header = data.headers[colIdx];
          const val = row[colIdx];
          item[header] = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
        });
        return item;
      });
    }
    return [];
  }, [data, action]);

  if (chartData.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        No valid data for chart.
      </div>
    );
  }

  const chartColors = action.chartColors || COLORS;

  const exportToPNG = async () => {
    if (!chartRef.current) return;

    try {
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        toast({
          title: 'Export Failed',
          description: 'Chart not found',
          variant: 'destructive',
        });
        return;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get SVG dimensions
      const bbox = svgElement.getBoundingClientRect();
      canvas.width = bbox.width * 2; // 2x for better quality
      canvas.height = bbox.height * 2;

      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Load SVG into image
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Download
        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            link.download = `${action.chartTitle || 'chart'}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);

            toast({
              title: 'Export Successful',
              description: 'Chart exported as PNG',
            });
          }
        });

        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export chart',
        variant: 'destructive',
      });
    }
  };

  const exportToSVG = () => {
    if (!chartRef.current) return;

    try {
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        toast({
          title: 'Export Failed',
          description: 'Chart not found',
          variant: 'destructive',
        });
        return;
      }

      // Clone and prepare SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Serialize and download
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `${action.chartTitle || 'chart'}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Chart exported as SVG',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export chart',
        variant: 'destructive',
      });
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 10, bottom: 20 },
    };

    const showLegend = action.showLegend !== false;
    const showGrid = action.showGrid !== false;

    switch (action.chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted-foreground))"
                opacity={0.1}
              />
            )}
            <XAxis
              dataKey="name"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={
                action.xAxisLabel
                  ? { value: action.xAxisLabel, position: 'bottom', offset: 0, fontSize: 10 }
                  : undefined
              }
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={
                action.yAxisLabel
                  ? { value: action.yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 10 }
                  : undefined
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                fontSize: '12px',
                borderRadius: '8px',
              }}
              itemStyle={{ padding: '0' }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />}
            {action.yAxisColumns!.map((colIdx, i) => (
              <Bar
                key={colIdx}
                dataKey={data.headers[colIdx]}
                fill={chartColors[i % chartColors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted-foreground))"
                opacity={0.1}
              />
            )}
            <XAxis
              dataKey="name"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={
                action.xAxisLabel
                  ? { value: action.xAxisLabel, position: 'bottom', offset: 0, fontSize: 10 }
                  : undefined
              }
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={
                action.yAxisLabel
                  ? { value: action.yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 10 }
                  : undefined
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                fontSize: '12px',
                borderRadius: '8px',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />}
            {action.yAxisColumns!.map((colIdx, i) => (
              <Line
                key={colIdx}
                type="monotone"
                dataKey={data.headers[colIdx]}
                stroke={chartColors[i % chartColors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted-foreground))"
                opacity={0.1}
              />
            )}
            <XAxis
              dataKey="name"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={
                action.xAxisLabel
                  ? { value: action.xAxisLabel, position: 'bottom', offset: 0, fontSize: 10 }
                  : undefined
              }
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={
                action.yAxisLabel
                  ? { value: action.yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 10 }
                  : undefined
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                fontSize: '12px',
                borderRadius: '8px',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />}
            {action.yAxisColumns!.map((colIdx, i) => (
              <Area
                key={colIdx}
                type="monotone"
                dataKey={data.headers[colIdx]}
                fill={chartColors[i % chartColors.length]}
                stroke={chartColors[i % chartColors.length]}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        const pieData = chartData.map((item) => ({
          name: item.name,
          value: item[data.headers[action.yAxisColumns![0]]],
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                fontSize: '12px',
                borderRadius: '8px',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--muted-foreground))"
                opacity={0.1}
              />
            )}
            <XAxis
              dataKey="name"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={
                action.xAxisLabel
                  ? { value: action.xAxisLabel, position: 'bottom', offset: 0, fontSize: 10 }
                  : undefined
              }
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={
                action.yAxisLabel
                  ? { value: action.yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 10 }
                  : undefined
              }
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                fontSize: '12px',
                borderRadius: '8px',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '10px' }} />}
            {action.yAxisColumns!.map((colIdx, i) => (
              <Scatter
                key={colIdx}
                name={data.headers[colIdx]}
                data={chartData.map((d) => ({ name: d.name, value: d[data.headers[colIdx]] }))}
                fill={chartColors[i % chartColors.length]}
              />
            ))}
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {action.chartTitle || 'Preview Chart'}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase">{action.chartType}</span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-[10px] h-7 px-2">
                <Download className="h-3 w-3" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToPNG}>Export as PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={exportToSVG}>Export as SVG</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onUpdate && <ChartCustomizer action={action} data={data} onUpdate={onUpdate} />}
        </div>
      </div>
      <div ref={chartRef} className="h-[220px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

import ChartCustomizer from './ChartCustomizer';
export default ChartPreview;

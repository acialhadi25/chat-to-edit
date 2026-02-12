import { useMemo } from "react";
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
} from "recharts";
import { ExcelData, AIAction } from "@/types/excel";

interface ChartPreviewProps {
  data: ExcelData;
  action: AIAction;
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const ChartPreview = ({ data, action }: ChartPreviewProps) => {
  const chartData = useMemo(() => {
    if (action.xAxisColumn !== undefined && action.yAxisColumns) {
      // Limit to first 20 rows for preview to keep it clean
      return data.rows.slice(0, 20).map((row) => {
        const item: any = {
          name: String(row[action.xAxisColumn!] || ""),
        };
        action.yAxisColumns!.forEach((colIdx) => {
          const header = data.headers[colIdx];
          const val = row[colIdx];
          item[header] = typeof val === "number" ? val : parseFloat(String(val)) || 0;
        });
        return item;
      });
    }
    return [];
  }, [data, action]);

  if (chartData.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        Data tidak valid untuk membuat grafik.
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    switch (action.chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", fontSize: "12px" }}
              itemStyle={{ padding: "0" }}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            {action.yAxisColumns!.map((colIdx, i) => (
              <Bar
                key={colIdx}
                dataKey={data.headers[colIdx]}
                fill={COLORS[i % COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            {action.yAxisColumns!.map((colIdx, i) => (
              <Line
                key={colIdx}
                type="monotone"
                dataKey={data.headers[colIdx]}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            {action.yAxisColumns!.map((colIdx, i) => (
              <Area
                key={colIdx}
                type="monotone"
                dataKey={data.headers[colIdx]}
                fill={COLORS[i % COLORS.length]}
                stroke={COLORS[i % COLORS.length]}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        const pieData = chartData.map(item => ({
          name: item.name,
          value: item[data.headers[action.yAxisColumns![0]]]
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
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
          </PieChart>
        );

      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            {action.yAxisColumns!.map((colIdx, i) => (
              <Scatter
                key={colIdx}
                name={data.headers[colIdx]}
                data={chartData.map(d => ({ name: d.name, value: d[data.headers[colIdx]] }))}
                fill={COLORS[i % COLORS.length]}
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
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {action.chartTitle || "Grafik Pratinjau"}
        </span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary uppercase">
          {action.chartType}
        </span>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartPreview;

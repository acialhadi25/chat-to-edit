import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, BarChart3, Palette } from 'lucide-react';
import { AIAction, ExcelData } from '@/types/excel';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChartCustomizerProps {
  action: AIAction;
  data: ExcelData;
  onUpdate: (updatedAction: AIAction) => void;
}

const DEFAULT_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const PRESET_PALETTES = [
  { name: 'Default', colors: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'] },
  { name: 'Pastel', colors: ['#a7c7e7', '#b4e7ce', '#f7d794', '#f8b4b4', '#d4b5f7', '#f7b4d4'] },
  { name: 'Vibrant', colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'] },
  { name: 'Earth', colors: ['#8b4513', '#d2691e', '#cd853f', '#daa520', '#b8860b', '#a0522d'] },
  { name: 'Ocean', colors: ['#006994', '#0582ca', '#00a6fb', '#0cb0ff', '#61c9ff', '#9ae2ff'] },
  { name: 'Sunset', colors: ['#ff6b35', '#f7931e', '#fdc500', '#c1666b', '#d4a5a5', '#ffb4a2'] },
];

const ChartCustomizer = ({ action, data, onUpdate }: ChartCustomizerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localAction, setLocalAction] = useState<AIAction>(action);

  const handleSave = () => {
    onUpdate(localAction);
    setIsOpen(false);
  };

  const updateField = (
    field: keyof AIAction,
    value: string | number | boolean | string[] | number[] | undefined
  ) => {
    setLocalAction((prev) => ({ ...prev, [field]: value }));
  };

  const updateColor = (index: number, color: string) => {
    const currentColors = localAction.chartColors || DEFAULT_COLORS;
    const newColors = [...currentColors];
    newColors[index] = color;
    updateField('chartColors', newColors);
  };

  const applyPalette = (colors: string[]) => {
    updateField('chartColors', colors);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-[10px] h-7 px-2">
          <Settings2 className="h-3 w-3" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Chart Customization
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          <div className="grid gap-4 py-4">
            {/* Chart Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right text-xs">
                Type
              </Label>
              <Select
                value={localAction.chartType}
                onValueChange={(v) => updateField('chartType', v)}
              >
                <SelectTrigger className="col-span-3 h-8 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-xs">
                Title
              </Label>
              <Input
                id="title"
                value={localAction.chartTitle || ''}
                onChange={(e) => updateField('chartTitle', e.target.value)}
                className="col-span-3 h-8 text-xs"
                placeholder="Chart Title"
              />
            </div>

            {/* X Axis Column */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">X Axis</Label>
              <Select
                value={String(localAction.xAxisColumn)}
                onValueChange={(v) => updateField('xAxisColumn', parseInt(v))}
              >
                <SelectTrigger className="col-span-3 h-8 text-xs">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {data.headers.map((h, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Axis Labels */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="x-label" className="text-right text-xs">
                X Label
              </Label>
              <Input
                id="x-label"
                value={localAction.xAxisLabel || ''}
                onChange={(e) => updateField('xAxisLabel', e.target.value)}
                className="col-span-3 h-8 text-xs"
                placeholder="X Axis Label"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="y-label" className="text-right text-xs">
                Y Label
              </Label>
              <Input
                id="y-label"
                value={localAction.yAxisLabel || ''}
                onChange={(e) => updateField('yAxisLabel', e.target.value)}
                className="col-span-3 h-8 text-xs"
                placeholder="Y Axis Label"
              />
            </div>

            {/* Color Customization Section */}
            <div className="col-span-4 border-t pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-primary" />
                <Label className="text-xs font-semibold">Color Palette</Label>
              </div>

              {/* Preset Palettes */}
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_PALETTES.map((palette) => (
                    <Button
                      key={palette.name}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 flex flex-col items-start gap-1"
                      onClick={() => applyPalette(palette.colors)}
                    >
                      <span className="text-xs font-medium">{palette.name}</span>
                      <div className="flex gap-1">
                        {palette.colors.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-sm border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Custom Colors</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(localAction.chartColors || DEFAULT_COLORS).map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="w-10 h-8 rounded border cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">Series {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings Toggles */}
            <div className="flex justify-between items-center px-2 py-2 bg-muted/50 rounded-md">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-legend"
                  checked={localAction.showLegend !== false}
                  onCheckedChange={(v) => updateField('showLegend', v)}
                />
                <Label htmlFor="show-legend" className="text-xs cursor-pointer">
                  Legend
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-grid"
                  checked={localAction.showGrid !== false}
                  onCheckedChange={(v) => updateField('showGrid', v)}
                />
                <Label htmlFor="show-grid" className="text-xs cursor-pointer">
                  Grid
                </Label>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChartCustomizer;

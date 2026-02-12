import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings2, BarChart3 } from "lucide-react";
import { AIAction, ExcelData } from "@/types/excel";

interface ChartCustomizerProps {
    action: AIAction;
    data: ExcelData;
    onUpdate: (updatedAction: AIAction) => void;
}

const ChartCustomizer = ({ action, data, onUpdate }: ChartCustomizerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localAction, setLocalAction] = useState<AIAction>(action);

    const handleSave = () => {
        onUpdate(localAction);
        setIsOpen(false);
    };

    const updateField = (field: keyof AIAction, value: any) => {
        setLocalAction((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-[10px] h-7 px-2">
                    <Settings2 className="h-3 w-3" />
                    Customize
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Chart Customization
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Chart Type */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right text-xs">Type</Label>
                        <Select
                            value={localAction.chartType}
                            onValueChange={(v) => updateField("chartType", v)}
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
                        <Label htmlFor="title" className="text-right text-xs">Title</Label>
                        <Input
                            id="title"
                            value={localAction.chartTitle || ""}
                            onChange={(e) => updateField("chartTitle", e.target.value)}
                            className="col-span-3 h-8 text-xs"
                            placeholder="Chart Title"
                        />
                    </div>

                    {/* X Axis Column */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">X Axis</Label>
                        <Select
                            value={String(localAction.xAxisColumn)}
                            onValueChange={(v) => updateField("xAxisColumn", parseInt(v))}
                        >
                            <SelectTrigger className="col-span-3 h-8 text-xs">
                                <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                                {data.headers.map((h, i) => (
                                    <SelectItem key={i} value={String(i)}>{h}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Axis Labels */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="x-label" className="text-right text-xs">X Label</Label>
                        <Input
                            id="x-label"
                            value={localAction.xAxisLabel || ""}
                            onChange={(e) => updateField("xAxisLabel", e.target.value)}
                            className="col-span-3 h-8 text-xs"
                            placeholder="X Axis Label"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="y-label" className="text-right text-xs">Y Label</Label>
                        <Input
                            id="y-label"
                            value={localAction.yAxisLabel || ""}
                            onChange={(e) => updateField("yAxisLabel", e.target.value)}
                            className="col-span-3 h-8 text-xs"
                            placeholder="Y Axis Label"
                        />
                    </div>

                    {/* Settings Toggles */}
                    <div className="flex justify-between items-center px-2 py-2 bg-muted/50 rounded-md">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="show-legend"
                                checked={localAction.showLegend !== false}
                                onCheckedChange={(v) => updateField("showLegend", v)}
                            />
                            <Label htmlFor="show-legend" className="text-xs cursor-pointer">Legend</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="show-grid"
                                checked={localAction.showGrid !== false}
                                onCheckedChange={(v) => updateField("showGrid", v)}
                            />
                            <Label htmlFor="show-grid" className="text-xs cursor-pointer">Grid</Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave}>Apply Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChartCustomizer;

import { useState, useMemo } from "react";
import { ExcelTemplate, TEMPLATE_CATEGORIES } from "@/types/template";
import { ALL_TEMPLATES, searchTemplates } from "@/data/templates";
import TemplateCard from "./TemplateCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TemplateGalleryProps {
    onSelectTemplate: (template: ExcelTemplate) => void;
    onClose: () => void;
}

const TemplateGallery = ({ onSelectTemplate, onClose }: TemplateGalleryProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredTemplates = useMemo(() => {
        let templates = ALL_TEMPLATES;

        // Filter by search query
        if (searchQuery.trim()) {
            templates = searchTemplates(searchQuery);
        }

        // Filter by category
        if (selectedCategory) {
            templates = templates.filter((t) => t.category === selectedCategory);
        }

        return templates;
    }, [searchQuery, selectedCategory]);

    const handleUseTemplate = (template: ExcelTemplate) => {
        onSelectTemplate(template);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">Excel Templates</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Choose from {ALL_TEMPLATES.length} professional templates to get started quickly
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Badge
                            variant={selectedCategory === null ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedCategory(null)}
                        >
                            All Templates
                        </Badge>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([key, { label }]) => (
                            <Badge
                                key={key}
                                variant={selectedCategory === key ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setSelectedCategory(key)}
                            >
                                {label}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Template Grid */}
                <ScrollArea className="flex-1 p-6">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No templates found</p>
                            <Button
                                variant="link"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategory(null);
                                }}
                                className="mt-2"
                            >
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onUseTemplate={handleUseTemplate}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};

export default TemplateGallery;

import { ExcelTemplate } from "@/types/template";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { TEMPLATE_CATEGORIES } from "@/types/template";

interface TemplateCardProps {
    template: ExcelTemplate;
    onUseTemplate: (template: ExcelTemplate) => void;
}

const TemplateCard = ({ template, onUseTemplate }: TemplateCardProps) => {
    // Get icon component dynamically
    const IconComponent = (LucideIcons as any)[template.icon] || LucideIcons.FileSpreadsheet;
    const categoryInfo = TEMPLATE_CATEGORIES[template.category];

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${categoryInfo.color}-500/10`}>
                            <IconComponent className={`h-6 w-6 text-${categoryInfo.color}-600`} />
                        </div>
                        <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
                                {categoryInfo.label}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-sm mb-4 line-clamp-2">
                    {template.description}
                </CardDescription>

                {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{template.headers.length} columns</span>
                    <span>{template.sampleData.length} sample rows</span>
                </div>

                <Button
                    onClick={() => onUseTemplate(template)}
                    className="w-full"
                    size="sm"
                >
                    Use Template
                </Button>
            </CardContent>
        </Card>
    );
};

export default TemplateCard;

import { ExcelTemplate } from '@/types/template';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '@/types/template';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface TemplateCardProps {
  template: ExcelTemplate;
  onUseTemplate: (template: ExcelTemplate) => void;
  onPreviewTemplate?: (template: ExcelTemplate) => void;
}

const TemplateCard = ({ template, onUseTemplate, onPreviewTemplate }: TemplateCardProps) => {
  const { toast } = useToast();

  // Get icon component dynamically
  const IconComponent = (LucideIcons as any)[template.icon] || LucideIcons.FileSpreadsheet;
  const categoryInfo = TEMPLATE_CATEGORIES[template.category];

  const handleDownloadTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const workbook = XLSX.utils.book_new();
      const data = [template.headers, ...template.sampleData];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, `${template.name}.xlsx`);

      toast({
        title: 'Template Downloaded',
        description: `${template.name}.xlsx is ready for use.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not generate Excel file.',
      });
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${categoryInfo.color}-500/10`}>
              <IconComponent className={`h-6 w-6 text-${categoryInfo.color}-600`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold truncate max-w-[180px]">
                {template.name}
              </CardTitle>
              <Badge variant="outline" className="mt-1 text-[10px] py-0 h-4">
                {categoryInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs mb-4 line-clamp-2 h-8">
          {template.description}
        </CardDescription>

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
            {template.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-accent/30 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70">
              Columns
            </span>
            <span className="text-sm font-semibold">{template.headers.length}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-accent/30 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70">Rows</span>
            <span className="text-sm font-semibold">{template.sampleData.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={() => onUseTemplate(template)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm h-9"
            size="sm"
          >
            <LucideIcons.Play className="mr-2 h-3.5 w-3.5" />
            Gunakan Template
          </Button>
          {onPreviewTemplate && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewTemplate(template);
              }}
              className="w-full h-8"
              size="sm"
            >
              <LucideIcons.Eye className="mr-2 h-3 w-3" />
              Preview
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleDownloadTemplate}
            className="w-full text-muted-foreground hover:text-primary transition-colors text-xs h-8"
            size="sm"
          >
            <LucideIcons.Download className="mr-2 h-3 w-3" />
            Download (.xlsx)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;

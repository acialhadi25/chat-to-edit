// @ts-nocheck
import { ExcelTemplate, TEMPLATE_CATEGORIES } from '@/types/template';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import * as LucideIcons from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TemplatePreviewModalProps {
  template: ExcelTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (template: ExcelTemplate) => void;
}

const TemplatePreviewModal = ({
  template,
  open,
  onOpenChange,
  onApplyTemplate,
}: TemplatePreviewModalProps) => {
  if (!template) return null;

  const IconComponent =
    (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[template.icon] ||
    LucideIcons.FileSpreadsheet;
  const categoryInfo = TEMPLATE_CATEGORIES[template.category];

  const handleApply = () => {
    onApplyTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg bg-${categoryInfo.color}-500/10`}>
              <IconComponent className={`h-8 w-8 text-${categoryInfo.color}-600`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <DialogDescription className="mt-2">{template.description}</DialogDescription>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">{categoryInfo.label}</Badge>
                {template.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Template Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col items-center p-3 rounded-lg bg-accent/50 border">
            <LucideIcons.Columns className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Columns</span>
            <span className="text-lg font-semibold">{template.headers.length}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-accent/50 border">
            <LucideIcons.Rows className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Sample Rows</span>
            <span className="text-lg font-semibold">{template.sampleData.length}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-accent/50 border">
            <LucideIcons.Calculator className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Formulas</span>
            <span className="text-lg font-semibold">{template.formulas?.length || 0}</span>
          </div>
        </div>

        {/* Template Structure */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <LucideIcons.Layout className="h-4 w-4" />
            Template Structure
          </h3>
          <div className="flex flex-wrap gap-2">
            {template.headers.map((header, index) => (
              <Badge key={index} variant="outline" className="font-mono text-xs">
                {header}
              </Badge>
            ))}
          </div>
        </div>

        {/* Formulas */}
        {template.formulas && template.formulas.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <LucideIcons.Calculator className="h-4 w-4" />
              Automatic Calculations
            </h3>
            <div className="space-y-2">
              {template.formulas.map((formula, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-md bg-accent/30 border text-xs"
                >
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {template.headers[formula.column]}
                  </Badge>
                  <div className="flex-1">
                    <code className="text-xs font-mono text-primary">{formula.formula}</code>
                    {formula.description && (
                      <p className="text-muted-foreground mt-1">{formula.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Data Preview */}
        <div className="flex-1 min-h-0">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <LucideIcons.Table className="h-4 w-4" />
            Sample Data Preview
          </h3>
          <ScrollArea className="h-[200px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {template.headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {template.sampleData.slice(0, 10).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="whitespace-nowrap">
                        {cell === null || cell === '' ? (
                          <span className="text-muted-foreground italic text-xs">empty</span>
                        ) : (
                          cell
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {template.sampleData.length > 10 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Showing 10 of {template.sampleData.length} sample rows
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} className="bg-primary">
            <LucideIcons.Check className="mr-2 h-4 w-4" />
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewModal;

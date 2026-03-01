// @ts-nocheck
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExcelData } from '@/types/excel';
import { TEMPLATE_CATEGORIES } from '@/types/template';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, X, Plus } from 'lucide-react';

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExcelData: ExcelData | null;
}

const CreateTemplateModal = ({
  open,
  onOpenChange,
  currentExcelData,
}: CreateTemplateModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'business' as keyof typeof TEMPLATE_CATEGORIES,
    icon: 'FileSpreadsheet',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentExcelData) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'Please load Excel data before creating a template.',
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Template name is required.',
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare template data
      const templateData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        icon: formData.icon,
        headers: currentExcelData.headers,
        sample_data: currentExcelData.rows.slice(0, 10), // Save first 10 rows as sample
        formulas: currentExcelData.formulas
          ? Object.entries(currentExcelData.formulas).map(([cellRef, formula]) => ({
              cellRef,
              formula,
            }))
          : null,
        styles: currentExcelData.cellStyles
          ? Object.entries(currentExcelData.cellStyles).map(([cellRef, style]) => ({
              cellRef,
              ...style,
            }))
          : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        is_public: false,
      };

      const { error } = await supabase.from('custom_templates').insert(templateData);

      if (error) throw error;

      toast({
        title: 'Template Created',
        description: `"${formData.name}" has been saved to your templates.`,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'business',
        icon: 'FileSpreadsheet',
        tags: [],
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create template.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Custom Template</DialogTitle>
          <DialogDescription>
            Save your current Excel structure as a reusable template
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Sales Report"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this template is for..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as keyof typeof TEMPLATE_CATEGORIES })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Template Preview Info */}
            {currentExcelData && (
              <div className="p-4 rounded-lg bg-accent/50 border space-y-2">
                <h4 className="text-sm font-semibold">Template will include:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {currentExcelData.headers.length} columns</li>
                  <li>• First 10 rows as sample data</li>
                  <li>• {Object.keys(currentExcelData.formulas || {}).length} formulas</li>
                  <li>• Cell styles and formatting</li>
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Template
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateModal;

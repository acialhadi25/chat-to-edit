import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExcelTemplate } from '@/types/template';
import { useToast } from '@/hooks/use-toast';

interface CellStyle {
  cellRef: string;
  backgroundColor?: string;
  fontColor?: string;
  fontWeight?: string;
  fontSize?: string;
  textAlign?: string;
  border?: string;
}

interface CustomTemplateRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: 'business' | 'finance' | 'hr' | 'personal' | 'sales' | 'inventory';
  icon: string;
  headers: string[];
  sample_data: (string | number | null)[][];
  formulas: { cellRef: string; formula: string; description?: string }[] | null;
  styles: CellStyle[] | null;
  tags: string[] | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomTemplates() {
  const [customTemplates, setCustomTemplates] = useState<ExcelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomTemplates();
  }, []);

  const fetchCustomTemplates = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCustomTemplates([]);
        setLoading(false);
        return;
      }

      // Fetch user's own templates and public templates
      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database rows to ExcelTemplate format
      const templates: ExcelTemplate[] = ((data || []) as unknown as CustomTemplateRow[]).map(
        (row) => ({
          id: `custom-${row.id}`,
          name: row.name,
          description: row.description || '',
          category: row.category,
          icon: row.icon,
          headers: row.headers,
          sampleData: row.sample_data,
          formulas: row.formulas?.map((f) => ({
            column: parseInt(f.cellRef.match(/[A-Z]+/)?.[0] || 'A', 36) - 10,
            formula: f.formula,
            description: f.description,
          })),
          styles: row.styles?.map((s) => ({
            cellRef: s.cellRef,
            backgroundColor: s.backgroundColor,
            fontColor: s.fontColor,
            fontWeight: s.fontWeight,
            fontSize: s.fontSize,
            textAlign: s.textAlign,
            border: s.border,
          })),
          tags: row.tags || [],
        })
      );

      setCustomTemplates(templates);
    } catch (error) {
      console.error('Error fetching custom templates:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load custom templates.',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      // Extract the actual UUID from the custom-{uuid} format
      const actualId = templateId.replace('custom-', '');

      const { error } = await supabase.from('custom_templates').delete().eq('id', actualId);

      if (error) throw error;

      // Remove from local state
      setCustomTemplates((prev) => prev.filter((t) => t.id !== templateId));

      toast({
        title: 'Template Deleted',
        description: 'Template has been removed.',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete template.',
      });
    }
  };

  return {
    customTemplates,
    loading,
    refetch: fetchCustomTemplates,
    deleteTemplate,
  };
}

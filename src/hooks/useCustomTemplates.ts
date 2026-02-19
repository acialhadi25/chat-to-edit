import { useState, useEffect } from 'react';
import { ExcelTemplate } from '@/types/template';

/**
 * Hook for managing built-in templates only.
 * Custom templates are NOT supported to save storage costs.
 * All templates are hardcoded in the application.
 */
export function useCustomTemplates() {
  const [customTemplates, setCustomTemplates] = useState<ExcelTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No custom templates - all templates are built-in
    // This hook exists for API compatibility
    setCustomTemplates([]);
    setLoading(false);
  }, []);

  const deleteTemplate = async (templateId: string) => {
    // No-op - custom templates not supported
    // This function exists for API compatibility
    return Promise.resolve();
  };

  const refetch = async () => {
    // No-op - no custom templates to fetch
    return Promise.resolve();
  };

  return {
    customTemplates,
    loading,
    refetch,
    deleteTemplate,
  };
}

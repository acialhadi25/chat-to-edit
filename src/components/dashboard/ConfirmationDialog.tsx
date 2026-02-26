import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AIAction } from '@/types/excel';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: AIAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Get a user-friendly description of what the action will do
 */
function getActionDescription(action: AIAction): { title: string; description: string; warning?: string } {
  switch (action.type) {
    case 'DELETE_ROW': {
      const target = (action as any).target || action.params?.target;
      const rowRefs = target?.ref?.split(',') || [];
      const rowCount = rowRefs.length;
      
      return {
        title: 'Delete Row(s)',
        description: `This will permanently delete ${rowCount} row${rowCount > 1 ? 's' : ''} from your spreadsheet.`,
        warning: 'This action cannot be undone (except via Undo).',
      };
    }
    
    case 'DELETE_COLUMN': {
      const columnName = action.params?.columnName || (action as any).target?.columnName || 'the column';
      
      return {
        title: 'Delete Column',
        description: `This will permanently delete the "${columnName}" column and all its data.`,
        warning: 'This action cannot be undone (except via Undo).',
      };
    }
    
    case 'REMOVE_EMPTY_ROWS': {
      return {
        title: 'Remove Empty Rows',
        description: 'This will permanently remove all empty rows from your spreadsheet.',
        warning: 'This action cannot be undone (except via Undo).',
      };
    }
    
    case 'DATA_TRANSFORM': {
      const target = (action as any).target || action.params?.target;
      const transformType = action.params?.transformType || action.params?.transform;
      const columnRef = target?.ref || 'the selected column';
      
      return {
        title: 'Transform Data',
        description: `This will transform all text in ${columnRef} to ${transformType}.`,
        warning: 'Original values will be replaced. This action cannot be undone (except via Undo).',
      };
    }
    
    default:
      return {
        title: 'Confirm Action',
        description: `Are you sure you want to execute this ${action.type} action?`,
      };
  }
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!action) return null;
  
  const { title, description, warning } = getActionDescription(action);
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>{description}</p>
              {warning && (
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ {warning}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { AIAction, ExcelData } from '@/types/excel';

/**
 * Determines if an AI Action requires user confirmation before execution.
 * 
 * Destructive operations that require confirmation:
 * - DELETE_ROW: Permanently removes data
 * - DELETE_COLUMN: Permanently removes data
 * - REMOVE_EMPTY_ROWS: Changes data structure
 * - DATA_TRANSFORM: Irreversible transformation (if affects many cells)
 * 
 * @param action - The AI Action to check
 * @param data - Current Excel data (used to determine impact)
 * @returns true if confirmation is required, false otherwise
 */
export function requiresConfirmation(action: AIAction, data: ExcelData): boolean {
  switch (action.type) {
    case 'DELETE_ROW':
      // Always confirm row deletion
      return true;
    
    case 'DELETE_COLUMN':
      // Always confirm column deletion
      return true;
    
    case 'REMOVE_EMPTY_ROWS':
      // Always confirm removing empty rows
      return true;
    
    case 'DATA_TRANSFORM': {
      // Confirm if transformation affects more than 10 cells
      const target = (action as any).target || action.params?.target;
      if (!target?.ref) return false;
      
      const ref = target.ref as string;
      let col = 0;
      
      // Parse column reference
      if (ref.match(/^[A-Z]+$/)) {
        col = ref.charCodeAt(0) - 65;
      }
      
      // Count non-empty cells in column
      let affectedCells = 0;
      data.rows.forEach((row) => {
        const value = row[col];
        if (typeof value === 'string' && value !== '') {
          affectedCells++;
        }
      });
      
      // Require confirmation if more than 10 cells will be affected
      return affectedCells > 10;
    }
    
    default:
      // No confirmation needed for other actions
      return false;
  }
}

/**
 * Gets a summary of the impact of a destructive action.
 * Used for logging and analytics.
 * 
 * @param action - The AI Action
 * @param data - Current Excel data
 * @returns Impact summary object
 */
export function getActionImpact(action: AIAction, data: ExcelData): {
  type: string;
  affectedRows?: number;
  affectedColumns?: number;
  affectedCells?: number;
} {
  switch (action.type) {
    case 'DELETE_ROW': {
      const target = (action as any).target || action.params?.target;
      const rowRefs = target?.ref?.split(',') || [];
      return {
        type: 'DELETE_ROW',
        affectedRows: rowRefs.length,
        affectedCells: rowRefs.length * data.headers.length,
      };
    }
    
    case 'DELETE_COLUMN': {
      return {
        type: 'DELETE_COLUMN',
        affectedColumns: 1,
        affectedCells: data.rows.length,
      };
    }
    
    case 'REMOVE_EMPTY_ROWS': {
      const emptyRows = data.rows.filter((row) =>
        row.every((cell) => cell === null || cell === '' || cell === undefined)
      );
      return {
        type: 'REMOVE_EMPTY_ROWS',
        affectedRows: emptyRows.length,
        affectedCells: emptyRows.length * data.headers.length,
      };
    }
    
    case 'DATA_TRANSFORM': {
      const target = (action as any).target || action.params?.target;
      const ref = target?.ref as string;
      let col = 0;
      
      if (ref?.match(/^[A-Z]+$/)) {
        col = ref.charCodeAt(0) - 65;
      }
      
      let affectedCells = 0;
      data.rows.forEach((row) => {
        const value = row[col];
        if (typeof value === 'string' && value !== '') {
          affectedCells++;
        }
      });
      
      return {
        type: 'DATA_TRANSFORM',
        affectedCells,
      };
    }
    
    default:
      return { type: action.type };
  }
}

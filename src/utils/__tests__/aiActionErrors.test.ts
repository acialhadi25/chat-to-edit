// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  validateCellReference,
  validateColumnReference,
  validateRowReference,
  validateRangeReference,
  validateFormula,
  validateColumnIndex,
  validateRowIndex,
  validateAIAction,
  formatErrorMessage,
  AIActionErrorCode,
} from '../aiActionErrors';
import { ExcelData, AIAction } from '@/types/excel';

// Helper to create test data
function createTestData(rows: number = 5, cols: number = 3): ExcelData {
  const headers = Array.from({ length: cols }, (_, i) => `Column${i + 1}`);
  const dataRows = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => `Cell${i + 1}-${j + 1}`)
  );
  
  return {
    fileName: 'test.xlsx',
    currentSheet: 'Sheet1',
    sheets: ['Sheet1'],
    headers,
    rows: dataRows,
    columnWidths: [],
    selectedCells: [],
    pendingChanges: [],
    cellStyles: {},
    formulas: {},
  };
}

describe('aiActionErrors - Cell Reference Validation', () => {
  it('should validate correct cell references', () => {
    expect(validateCellReference('A1').valid).toBe(true);
    expect(validateCellReference('B5').valid).toBe(true);
    expect(validateCellReference('Z99').valid).toBe(true);
    expect(validateCellReference('AA1').valid).toBe(true);
  });

  it('should reject invalid cell references', () => {
    const result1 = validateCellReference('A');
    expect(result1.valid).toBe(false);
    expect(result1.error?.code).toBe(AIActionErrorCode.INVALID_CELL_REFERENCE);
    expect(result1.error?.message).toContain('Invalid cell reference');
    expect(result1.error?.suggestedAction).toContain('valid cell reference format');

    const result2 = validateCellReference('1A');
    expect(result2.valid).toBe(false);

    const result3 = validateCellReference('A1B2');
    expect(result3.valid).toBe(false);
  });
});

describe('aiActionErrors - Column Reference Validation', () => {
  it('should validate correct column references', () => {
    expect(validateColumnReference('A').valid).toBe(true);
    expect(validateColumnReference('Z').valid).toBe(true);
    expect(validateColumnReference('AA').valid).toBe(true);
  });

  it('should reject invalid column references', () => {
    const result1 = validateColumnReference('A1');
    expect(result1.valid).toBe(false);
    expect(result1.error?.code).toBe(AIActionErrorCode.INVALID_COLUMN_REFERENCE);

    const result2 = validateColumnReference('1');
    expect(result2.valid).toBe(false);
  });
});

describe('aiActionErrors - Row Reference Validation', () => {
  it('should validate correct row references', () => {
    expect(validateRowReference('1').valid).toBe(true);
    expect(validateRowReference('100').valid).toBe(true);
    expect(validateRowReference(5).valid).toBe(true);
  });

  it('should reject invalid row references', () => {
    const result1 = validateRowReference('0');
    expect(result1.valid).toBe(false);
    expect(result1.error?.code).toBe(AIActionErrorCode.INVALID_ROW_REFERENCE);

    const result2 = validateRowReference('-1');
    expect(result2.valid).toBe(false);

    const result3 = validateRowReference('abc');
    expect(result3.valid).toBe(false);
  });
});

describe('aiActionErrors - Range Reference Validation', () => {
  it('should validate correct range references', () => {
    expect(validateRangeReference('A1:B10').valid).toBe(true);
    expect(validateRangeReference('C5:Z99').valid).toBe(true);
  });

  it('should reject invalid range references', () => {
    const result1 = validateRangeReference('A1-B10');
    expect(result1.valid).toBe(false);
    expect(result1.error?.code).toBe(AIActionErrorCode.INVALID_RANGE);

    const result2 = validateRangeReference('A1:B');
    expect(result2.valid).toBe(false);
  });
});

describe('aiActionErrors - Formula Validation', () => {
  it('should validate correct formulas', () => {
    expect(validateFormula('=SUM(A1:A10)').valid).toBe(true);
    expect(validateFormula('=AVERAGE(B1:B5)').valid).toBe(true);
    expect(validateFormula('=IF(A1>10, "Yes", "No")').valid).toBe(true);
  });

  it('should reject formulas without equals sign', () => {
    const result = validateFormula('SUM(A1:A10)');
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.INVALID_FORMULA);
    expect(result.error?.message).toContain('must start with "="');
  });

  it('should reject formulas with unbalanced parentheses', () => {
    const result1 = validateFormula('=SUM(A1:A10');
    expect(result1.valid).toBe(false);
    expect(result1.error?.code).toBe(AIActionErrorCode.INVALID_FORMULA);
    expect(result1.error?.message).toContain('Unbalanced parentheses');

    const result2 = validateFormula('=SUM(A1:A10))');
    expect(result2.valid).toBe(false);

    const result3 = validateFormula('=SUM)A1:A10(');
    expect(result3.valid).toBe(false);
  });
});

describe('aiActionErrors - Bounds Validation', () => {
  const data = createTestData(5, 3); // 5 rows, 3 columns

  it('should validate column index within bounds', () => {
    expect(validateColumnIndex(0, data).valid).toBe(true);
    expect(validateColumnIndex(2, data).valid).toBe(true);
  });

  it('should reject column index out of bounds', () => {
    const result1 = validateColumnIndex(-1, data);
    expect(result1.valid).toBe(false);
    expect(result1.error?.code).toBe(AIActionErrorCode.OUT_OF_BOUNDS);

    const result2 = validateColumnIndex(3, data);
    expect(result2.valid).toBe(false);
    expect(result2.error?.message).toContain('out of bounds');
  });

  it('should validate row index within bounds', () => {
    expect(validateRowIndex(0, data).valid).toBe(true);
    expect(validateRowIndex(4, data).valid).toBe(true);
  });

  it('should reject row index out of bounds', () => {
    const result1 = validateRowIndex(-1, data);
    expect(result1.valid).toBe(false);
    expect(result1.error?.code).toBe(AIActionErrorCode.OUT_OF_BOUNDS);

    const result2 = validateRowIndex(5, data);
    expect(result2.valid).toBe(false);
  });
});

describe('aiActionErrors - EDIT_CELL Validation', () => {
  const data = createTestData();

  it('should validate correct EDIT_CELL action', () => {
    const action: AIAction = {
      type: 'EDIT_CELL',
      description: 'Edit cell A1',
      params: {
        target: { ref: 'A1' },
        value: 'New Value',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(true);
  });

  it('should reject EDIT_CELL without target', () => {
    const action: AIAction = {
      type: 'EDIT_CELL',
      description: 'Edit cell',
      params: {
        value: 'New Value',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.MISSING_REQUIRED_PARAM);
    expect(result.error?.message).toContain('target');
  });

  it('should reject EDIT_CELL without value', () => {
    const action: AIAction = {
      type: 'EDIT_CELL',
      description: 'Edit cell',
      params: {
        target: { ref: 'A1' },
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.MISSING_REQUIRED_PARAM);
    expect(result.error?.message).toContain('value');
  });
});

describe('aiActionErrors - INSERT_FORMULA Validation', () => {
  const data = createTestData();

  it('should validate correct INSERT_FORMULA action', () => {
    const action: AIAction = {
      type: 'INSERT_FORMULA',
      description: 'Insert formula',
      params: {
        target: { ref: 'F2:F12' },
        formula: '=SUM(A{row}:E{row})',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(true);
  });

  it('should reject INSERT_FORMULA without target', () => {
    const action: AIAction = {
      type: 'INSERT_FORMULA',
      description: 'Insert formula',
      params: {
        formula: '=SUM(A1:A10)',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.MISSING_REQUIRED_PARAM);
  });

  it('should reject INSERT_FORMULA without formula', () => {
    const action: AIAction = {
      type: 'INSERT_FORMULA',
      description: 'Insert formula',
      params: {
        target: { ref: 'F2:F12' },
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.MISSING_REQUIRED_PARAM);
  });

  it('should reject INSERT_FORMULA with invalid formula', () => {
    const action: AIAction = {
      type: 'INSERT_FORMULA',
      description: 'Insert formula',
      params: {
        target: { ref: 'F2:F12' },
        formula: 'SUM(A1:A10)', // Missing =
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.INVALID_FORMULA);
  });
});

describe('aiActionErrors - DELETE_COLUMN Validation', () => {
  const data = createTestData(5, 3);

  it('should validate correct DELETE_COLUMN action with column name', () => {
    const action: AIAction = {
      type: 'DELETE_COLUMN',
      description: 'Delete column',
      params: {
        columnName: 'Column1',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(true);
  });

  it('should validate correct DELETE_COLUMN action with column index', () => {
    const action: AIAction = {
      type: 'DELETE_COLUMN',
      description: 'Delete column',
      params: {
        columnIndex: 0,
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(true);
  });

  it('should reject DELETE_COLUMN without column identifier', () => {
    const action: AIAction = {
      type: 'DELETE_COLUMN',
      description: 'Delete column',
      params: {},
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.MISSING_REQUIRED_PARAM);
  });

  it('should reject DELETE_COLUMN with non-existent column name', () => {
    const action: AIAction = {
      type: 'DELETE_COLUMN',
      description: 'Delete column',
      params: {
        columnName: 'NonExistentColumn',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.COLUMN_NOT_FOUND);
    expect(result.error?.message).toContain('NonExistentColumn');
    expect(result.error?.message).toContain('Available columns');
  });

  it('should reject DELETE_COLUMN on empty spreadsheet', () => {
    const emptyData = createTestData(0, 0);
    const action: AIAction = {
      type: 'DELETE_COLUMN',
      description: 'Delete column',
      params: {
        columnName: 'Column1',
      },
    };

    const result = validateAIAction(action, emptyData);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.NO_COLUMNS_TO_DELETE);
    expect(result.error?.recoverable).toBe(false);
  });
});

describe('aiActionErrors - DATA_TRANSFORM Validation', () => {
  const data = createTestData();

  it('should validate correct DATA_TRANSFORM action', () => {
    const action: AIAction = {
      type: 'DATA_TRANSFORM',
      description: 'Transform data',
      params: {
        target: { ref: 'B' },
        transformType: 'uppercase',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(true);
  });

  it('should reject DATA_TRANSFORM without target', () => {
    const action: AIAction = {
      type: 'DATA_TRANSFORM',
      description: 'Transform data',
      params: {
        transformType: 'uppercase',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.MISSING_REQUIRED_PARAM);
  });

  it('should reject DATA_TRANSFORM with invalid transform type', () => {
    const action: AIAction = {
      type: 'DATA_TRANSFORM',
      description: 'Transform data',
      params: {
        target: { ref: 'B' },
        transformType: 'invalid',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.INVALID_TRANSFORM_TYPE);
    expect(result.error?.message).toContain('uppercase, lowercase, titlecase');
  });
});

describe('aiActionErrors - STATISTICS Validation', () => {
  it('should validate correct STATISTICS action', () => {
    const data = createTestData();
    // Add numeric data
    data.rows[0][0] = 10;
    data.rows[1][0] = 20;

    const action: AIAction = {
      type: 'STATISTICS',
      description: 'Add statistics',
      params: {
        statType: 'sum',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(true);
  });

  it('should reject STATISTICS with invalid stat type', () => {
    const data = createTestData();
    data.rows[0][0] = 10;

    const action: AIAction = {
      type: 'STATISTICS',
      description: 'Add statistics',
      params: {
        statType: 'invalid',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.INVALID_STAT_TYPE);
  });

  it('should reject STATISTICS on non-numeric data', () => {
    const data = createTestData(); // All string data

    const action: AIAction = {
      type: 'STATISTICS',
      description: 'Add statistics',
      params: {
        statType: 'sum',
      },
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.NO_NUMERIC_COLUMNS);
    expect(result.error?.recoverable).toBe(false);
  });
});

describe('aiActionErrors - REMOVE_EMPTY_ROWS Validation', () => {
  it('should validate REMOVE_EMPTY_ROWS on data with rows', () => {
    const data = createTestData();

    const action: AIAction = {
      type: 'REMOVE_EMPTY_ROWS',
      description: 'Remove empty rows',
      params: {},
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(true);
  });

  it('should reject REMOVE_EMPTY_ROWS on empty spreadsheet', () => {
    const emptyData = createTestData(0, 3);

    const action: AIAction = {
      type: 'REMOVE_EMPTY_ROWS',
      description: 'Remove empty rows',
      params: {},
    };

    const result = validateAIAction(action, emptyData);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.EMPTY_DATA);
    expect(result.error?.recoverable).toBe(false);
  });
});

describe('aiActionErrors - Unknown Action Type', () => {
  const data = createTestData();

  it('should reject unknown action type', () => {
    const action: AIAction = {
      type: 'UNKNOWN_ACTION' as any,
      description: 'Unknown action',
      params: {},
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.UNKNOWN_ACTION_TYPE);
    expect(result.error?.recoverable).toBe(false);
  });

  it('should reject action without type', () => {
    const action: AIAction = {
      type: '' as any,
      description: 'No type',
      params: {},
    };

    const result = validateAIAction(action, data);
    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe(AIActionErrorCode.UNKNOWN_ACTION_TYPE);
  });
});

describe('aiActionErrors - Error Message Formatting', () => {
  it('should format error message with all fields', () => {
    const error = {
      code: AIActionErrorCode.INVALID_CELL_REFERENCE,
      message: 'Invalid cell reference: "A"',
      suggestedAction: 'Use format like A1, B2',
      recoverable: true,
      actionType: 'EDIT_CELL',
      details: { providedRef: 'A' },
    };

    const formatted = formatErrorMessage(error);
    expect(formatted).toContain('❌');
    expect(formatted).toContain('Invalid cell reference');
    expect(formatted).toContain('💡 Suggested action');
    expect(formatted).toContain('Use format like A1, B2');
    expect(formatted).toContain('📋 Action type: EDIT_CELL');
    expect(formatted).toContain('🔍 Details');
  });

  it('should format error message without optional fields', () => {
    const error = {
      code: AIActionErrorCode.EMPTY_DATA,
      message: 'No data available',
      suggestedAction: 'Add data first',
      recoverable: false,
    };

    const formatted = formatErrorMessage(error);
    expect(formatted).toContain('❌');
    expect(formatted).toContain('No data available');
    expect(formatted).toContain('💡 Suggested action');
    expect(formatted).not.toContain('📋 Action type');
    expect(formatted).not.toContain('🔍 Details');
  });
});

describe('aiActionErrors - Informational Actions', () => {
  const data = createTestData();

  it('should allow informational actions without validation', () => {
    const actions = ['DATA_AUDIT', 'INSIGHTS', 'CLARIFY', 'INFO'];

    actions.forEach(actionType => {
      const action: AIAction = {
        type: actionType as any,
        description: 'Informational action',
        params: {},
      };

      const result = validateAIAction(action, data);
      expect(result.valid).toBe(true);
    });
  });
});

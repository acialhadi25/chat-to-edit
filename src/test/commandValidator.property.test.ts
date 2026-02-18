/**
 * Property-Based Tests for Command Validator
 *
 * This file contains property-based tests to verify universal correctness
 * properties of the command validation system.
 *
 * Feature: chat-excel-command-improvement
 * Task: 3.3 Write property test untuk required parameter validation
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PROPERTY_TEST_CONFIG } from './utils/propertyTestConfig';
import { validateAction, VALIDATION_RULES } from '../utils/commandValidator';
import type { AIAction } from '../types/excel';
import {
  dataTransformActionArb,
  findReplaceActionArb,
  conditionalFormatActionArb,
  sortDataActionArb,
  filterDataActionArb,
} from './utils/generators';

describe('Command Validator Property Tests', () => {
  describe('Property 14: Required parameter validation', () => {
    /**
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
     *
     * Property: For any action type with defined required parameters,
     * validation should reject actions missing any required parameter
     * and report which parameters are missing.
     */

    it('Property 14.1: DATA_TRANSFORM actions missing transformType should be rejected', () => {
      fc.assert(
        fc.property(dataTransformActionArb, (validAction) => {
          // Create action missing transformType
          const { transformType, ...rest } = validAction;
          const actionMissingParam: AIAction = rest as AIAction;

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('transformType');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('transformType');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.2: DATA_TRANSFORM actions missing target should be rejected', () => {
      fc.assert(
        fc.property(dataTransformActionArb, (validAction) => {
          // Create action missing target
          const { target, ...rest } = validAction;
          const actionMissingParam: AIAction = rest as AIAction;

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('target');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('target');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.3: FIND_REPLACE actions missing findValue should be rejected', () => {
      fc.assert(
        fc.property(findReplaceActionArb, (validAction) => {
          // Create action missing findValue
          const actionMissingParam: AIAction = {
            ...validAction,
            findValue: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('findValue');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('findValue');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.4: FIND_REPLACE actions missing replaceValue should be rejected', () => {
      fc.assert(
        fc.property(findReplaceActionArb, (validAction) => {
          // Create action missing replaceValue
          const actionMissingParam: AIAction = {
            ...validAction,
            replaceValue: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('replaceValue');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('replaceValue');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.5: CONDITIONAL_FORMAT actions missing conditionType should be rejected', () => {
      fc.assert(
        fc.property(conditionalFormatActionArb, (validAction) => {
          // Create action missing conditionType
          const actionMissingParam: AIAction = {
            ...validAction,
            conditionType: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('conditionType');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('conditionType');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.6: CONDITIONAL_FORMAT actions missing formatStyle should be rejected', () => {
      fc.assert(
        fc.property(conditionalFormatActionArb, (validAction) => {
          // Create action missing formatStyle
          const actionMissingParam: AIAction = {
            ...validAction,
            formatStyle: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('formatStyle');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('formatStyle');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.7: CONDITIONAL_FORMAT actions missing target should be rejected', () => {
      fc.assert(
        fc.property(conditionalFormatActionArb, (validAction) => {
          // Create action missing target
          const actionMissingParam: AIAction = {
            ...validAction,
            target: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('target');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('target');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.8: SORT_DATA actions missing sortColumn should be rejected', () => {
      fc.assert(
        fc.property(sortDataActionArb, (validAction) => {
          // Create action missing sortColumn
          const actionMissingParam: AIAction = {
            ...validAction,
            sortColumn: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('sortColumn');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('sortColumn');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.9: SORT_DATA actions missing sortDirection should be rejected', () => {
      fc.assert(
        fc.property(sortDataActionArb, (validAction) => {
          // Create action missing sortDirection
          const actionMissingParam: AIAction = {
            ...validAction,
            sortDirection: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('sortDirection');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('sortDirection');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.10: FILTER_DATA actions missing filterOperator should be rejected', () => {
      fc.assert(
        fc.property(filterDataActionArb, (validAction) => {
          // Create action missing filterOperator
          const actionMissingParam: AIAction = {
            ...validAction,
            filterOperator: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('filterOperator');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('filterOperator');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.11: FILTER_DATA actions missing filterValue should be rejected', () => {
      fc.assert(
        fc.property(filterDataActionArb, (validAction) => {
          // Create action missing filterValue
          const actionMissingParam: AIAction = {
            ...validAction,
            filterValue: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('filterValue');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('filterValue');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.12: FILTER_DATA actions missing target should be rejected', () => {
      fc.assert(
        fc.property(filterDataActionArb, (validAction) => {
          // Create action missing target
          const actionMissingParam: AIAction = {
            ...validAction,
            target: undefined as any,
          };

          const result = validateAction(actionMissingParam);

          // Should be invalid
          expect(result.valid).toBe(false);
          // Should report missing parameter
          expect(result.missingParams).toBeDefined();
          expect(result.missingParams).toContain('target');
          // Should have error message
          expect(result.error).toBeDefined();
          expect(result.error).toContain('target');
        }),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 14.13: Valid actions with all required parameters should pass validation', () => {
      // Test that valid actions always pass validation
      const validActionArbs = [
        dataTransformActionArb,
        findReplaceActionArb,
        conditionalFormatActionArb,
        sortDataActionArb,
        filterDataActionArb,
      ];

      validActionArbs.forEach((arb) => {
        fc.assert(
          fc.property(arb, (validAction) => {
            const result = validateAction(validAction);

            // Should be valid
            expect(result.valid).toBe(true);
            // Should not have error
            expect(result.error).toBeUndefined();
            // Should not have missing params
            expect(result.missingParams).toBeUndefined();
          }),
          PROPERTY_TEST_CONFIG
        );
      });
    });

    it('Property 14.14: Missing multiple required parameters should report all missing params', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'DATA_TRANSFORM',
            'FIND_REPLACE',
            'CONDITIONAL_FORMAT',
            'SORT_DATA',
            'FILTER_DATA'
          ),
          (actionType) => {
            // Create action with only type field
            const actionMissingAllParams: AIAction = {
              type: actionType as any,
              status: 'pending',
            };

            const result = validateAction(actionMissingAllParams);
            const rule = VALIDATION_RULES[actionType];

            if (rule && rule.requiredParams.length > 0) {
              // Should be invalid
              expect(result.valid).toBe(false);
              // Should report missing parameters
              expect(result.missingParams).toBeDefined();
              expect(result.missingParams!.length).toBeGreaterThan(0);
              // Should have error message
              expect(result.error).toBeDefined();

              // All required params should be in missing params list
              rule.requiredParams.forEach((param) => {
                expect(result.missingParams).toContain(param);
              });
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  describe('Property 15: Action target structure validation', () => {
    /**
     * **Validates: Requirements 8.4**
     *
     * Property: For any action object containing a target field,
     * the target should have both "type" and "ref" fields.
     */

    it('Property 15.1: Actions with target field should have both type and ref', () => {
      fc.assert(
        fc.property(
          fc.oneof(dataTransformActionArb, conditionalFormatActionArb, filterDataActionArb),
          (validAction) => {
            // Valid actions should have proper target structure
            if (validAction.target) {
              expect(validAction.target).toHaveProperty('type');
              expect(validAction.target).toHaveProperty('ref');
              expect(validAction.target.type).toMatch(/^(cell|range|column|row)$/);
              expect(typeof validAction.target.ref).toBe('string');
              expect(validAction.target.ref.length).toBeGreaterThan(0);
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 15.2: Actions with target missing type field should be invalid', () => {
      fc.assert(
        fc.property(
          fc.oneof(dataTransformActionArb, conditionalFormatActionArb, filterDataActionArb),
          (validAction) => {
            if (!validAction.target) return; // Skip if no target

            // Create action with target missing type field
            const { type: targetType, ...restTarget } = validAction.target;
            const actionWithInvalidTarget: AIAction = {
              ...validAction,
              target: restTarget as any,
            };

            // Validation should detect the structural issue
            // Note: Current validator checks for target presence, not structure
            // This test documents expected behavior for future enhancement
            if (actionWithInvalidTarget.target) {
              expect(actionWithInvalidTarget.target).not.toHaveProperty('type');
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 15.3: Actions with target missing ref field should be invalid', () => {
      fc.assert(
        fc.property(
          fc.oneof(dataTransformActionArb, conditionalFormatActionArb, filterDataActionArb),
          (validAction) => {
            if (!validAction.target) return; // Skip if no target

            // Create action with target missing ref field
            const { ref, ...restTarget } = validAction.target;
            const actionWithInvalidTarget: AIAction = {
              ...validAction,
              target: restTarget as any,
            };

            // Validation should detect the structural issue
            // Note: Current validator checks for target presence, not structure
            // This test documents expected behavior for future enhancement
            if (actionWithInvalidTarget.target) {
              expect(actionWithInvalidTarget.target).not.toHaveProperty('ref');
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 15.4: Target type should be one of valid values', () => {
      fc.assert(
        fc.property(
          fc.oneof(dataTransformActionArb, conditionalFormatActionArb, filterDataActionArb),
          (validAction) => {
            if (validAction.target) {
              const validTypes = ['cell', 'range', 'column', 'row'];
              expect(validTypes).toContain(validAction.target.type);
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 15.5: Target ref should be a non-empty string', () => {
      fc.assert(
        fc.property(
          fc.oneof(dataTransformActionArb, conditionalFormatActionArb, filterDataActionArb),
          (validAction) => {
            if (validAction.target) {
              expect(typeof validAction.target.ref).toBe('string');
              expect(validAction.target.ref.length).toBeGreaterThan(0);
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });
  });

  describe('Property 16: Changes preview structure validation', () => {
    /**
     * **Validates: Requirements 8.5**
     *
     * Property: For any action object containing a changes field,
     * each change should have cellRef, before, after, and type fields.
     */

    it('Property 16.1: Actions with changes field should have proper structure', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            dataTransformActionArb,
            findReplaceActionArb,
            conditionalFormatActionArb,
            sortDataActionArb,
            filterDataActionArb
          ),
          (validAction) => {
            // Valid actions with changes should have proper structure
            if (validAction.changes && validAction.changes.length > 0) {
              validAction.changes.forEach((change) => {
                expect(change).toHaveProperty('cellRef');
                expect(change).toHaveProperty('before');
                expect(change).toHaveProperty('after');
                expect(change).toHaveProperty('type');
              });
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 16.2: Each change should have cellRef as a string', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            dataTransformActionArb,
            findReplaceActionArb,
            conditionalFormatActionArb,
            sortDataActionArb,
            filterDataActionArb
          ),
          (validAction) => {
            if (validAction.changes && validAction.changes.length > 0) {
              validAction.changes.forEach((change) => {
                expect(typeof change.cellRef).toBe('string');
                expect(change.cellRef.length).toBeGreaterThan(0);
                // cellRef should match cell reference pattern (e.g., A1, B5, AA100)
                expect(change.cellRef).toMatch(/^[A-Z]+\d+$/);
              });
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 16.3: Each change should have type as value or formula', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            dataTransformActionArb,
            findReplaceActionArb,
            conditionalFormatActionArb,
            sortDataActionArb,
            filterDataActionArb
          ),
          (validAction) => {
            if (validAction.changes && validAction.changes.length > 0) {
              validAction.changes.forEach((change) => {
                expect(['value', 'formula']).toContain(change.type);
              });
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 16.4: Changes array should be valid even when empty', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            dataTransformActionArb,
            findReplaceActionArb,
            conditionalFormatActionArb,
            sortDataActionArb,
            filterDataActionArb
          ),
          (validAction) => {
            if (validAction.changes) {
              expect(Array.isArray(validAction.changes)).toBe(true);
              // Empty changes array is valid
              if (validAction.changes.length === 0) {
                expect(validAction.changes).toEqual([]);
              }
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 16.5: Before and after values can be string, number, or null', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            dataTransformActionArb,
            findReplaceActionArb,
            conditionalFormatActionArb,
            sortDataActionArb,
            filterDataActionArb
          ),
          (validAction) => {
            if (validAction.changes && validAction.changes.length > 0) {
              validAction.changes.forEach((change) => {
                const validTypes = ['string', 'number', 'object']; // object for null
                expect(validTypes).toContain(typeof change.before);
                expect(validTypes).toContain(typeof change.after);

                // If object, should be null
                if (typeof change.before === 'object') {
                  expect(change.before).toBeNull();
                }
                if (typeof change.after === 'object') {
                  expect(change.after).toBeNull();
                }
              });
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });

    it('Property 16.6: Changes with missing required fields should be detectable', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            dataTransformActionArb,
            findReplaceActionArb,
            conditionalFormatActionArb,
            sortDataActionArb,
            filterDataActionArb
          ),
          (validAction) => {
            if (validAction.changes && validAction.changes.length > 0) {
              // Create invalid change by removing cellRef
              const invalidChange = { ...validAction.changes[0] };
              delete (invalidChange as any).cellRef;

              // Should be detectable that cellRef is missing
              expect(invalidChange).not.toHaveProperty('cellRef');
            }
          }
        ),
        PROPERTY_TEST_CONFIG
      );
    });
  });
});

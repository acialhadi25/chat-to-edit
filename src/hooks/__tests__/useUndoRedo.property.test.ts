import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as fc from "fast-check";
import { useUndoRedo } from "../useUndoRedo";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { ExcelData, ActionType } from "@/types/excel";

/**
 * Property-Based Test for Undo-Redo Idempotence
 * 
 * **Validates: Requirements 1.2.2**
 * 
 * Property 1: Undo-Redo Idempotence
 * For any Excel data state and any valid operation, performing the operation,
 * then undo, then redo should result in a state equivalent to performing the
 * operation once.
 */

// Arbitrary generators for property-based testing
const cellValueArbitrary = fc.oneof(
  fc.string({ maxLength: 20 }),
  fc.integer({ min: -1000, max: 1000 }),
  fc.constant(null)
);

const rowArbitrary = fc.array(cellValueArbitrary, { minLength: 1, maxLength: 10 });

const excelDataArbitrary = fc.record({
  fileName: fc.string({ minLength: 1, maxLength: 20 }),
  sheets: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 3 }),
  currentSheet: fc.string({ minLength: 1, maxLength: 10 }),
  headers: fc.array(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 1, maxLength: 10 }),
  rows: fc.array(rowArbitrary, { minLength: 1, maxLength: 20 }),
});

const actionTypeArbitrary = fc.constantFrom<ActionType>(
  "EDIT_CELL",
  "ADD_COLUMN",
  "DELETE_COLUMN",
  "SORT_DATA",
  "FILTER_DATA"
);

describe("Property-Based Tests: useUndoRedo", () => {
  describe("Property 1: Undo-Redo Idempotence", () => {
    it("should satisfy: operation → undo → redo ≡ operation", () => {
      fc.assert(
        fc.property(
          excelDataArbitrary,
          excelDataArbitrary,
          actionTypeArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (initialDataSpec, modifiedDataSpec, actionType, description) => {
            // Create mock Excel data from generated specs
            const initialData = createMockExcelData({
              fileName: initialDataSpec.fileName,
              sheets: initialDataSpec.sheets,
              currentSheet: initialDataSpec.currentSheet,
              headers: initialDataSpec.headers,
              rows: initialDataSpec.rows,
            });

            const modifiedData = createMockExcelData({
              fileName: modifiedDataSpec.fileName,
              sheets: modifiedDataSpec.sheets,
              currentSheet: modifiedDataSpec.currentSheet,
              headers: modifiedDataSpec.headers,
              rows: modifiedDataSpec.rows,
            });

            // Initialize the hook
            const { result } = renderHook(() => useUndoRedo(initialData));

            // Perform operation: push state
            act(() => {
              result.current.pushState(
                initialData,
                modifiedData,
                actionType,
                description
              );
            });

            // At this point, current state should be modifiedData
            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(false);

            // Perform undo
            let undoneData: ExcelData | null = null;
            act(() => {
              undoneData = result.current.undo();
            });

            // After undo, we should be back to initialData
            expect(undoneData).not.toBeNull();
            if (undoneData) {
              expect((undoneData as ExcelData).rows).toEqual(initialData.rows);
              expect((undoneData as ExcelData).headers).toEqual(initialData.headers);
            }
            expect(result.current.canUndo).toBe(false);
            expect(result.current.canRedo).toBe(true);

            // Perform redo
            let redoneData: ExcelData | null = null;
            act(() => {
              redoneData = result.current.redo();
            });

            // After redo, we should be back to modifiedData
            // This is the idempotence property: operation → undo → redo ≡ operation
            expect(redoneData).not.toBeNull();
            if (redoneData) {
              expect((redoneData as ExcelData).rows).toEqual(modifiedData.rows);
              expect((redoneData as ExcelData).headers).toEqual(modifiedData.headers);
              expect((redoneData as ExcelData).fileName).toEqual(modifiedData.fileName);
              expect((redoneData as ExcelData).sheets).toEqual(modifiedData.sheets);
              expect((redoneData as ExcelData).currentSheet).toEqual(modifiedData.currentSheet);
            }
            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should satisfy idempotence with multiple operations", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              data: excelDataArbitrary,
              actionType: actionTypeArbitrary,
              description: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (operations) => {
            // Start with initial data
            const initialData = createMockExcelData({
              fileName: "test.xlsx",
              sheets: ["Sheet1"],
              currentSheet: "Sheet1",
              headers: ["A", "B", "C"],
              rows: [[1, 2, 3]],
            });

            const { result } = renderHook(() => useUndoRedo(initialData));

            // Apply all operations
            let previousData = initialData;
            const appliedStates: ExcelData[] = [];

            for (const op of operations) {
              const nextData = createMockExcelData({
                fileName: op.data.fileName,
                sheets: op.data.sheets,
                currentSheet: op.data.currentSheet,
                headers: op.data.headers,
                rows: op.data.rows,
              });

              act(() => {
                result.current.pushState(
                  previousData,
                  nextData,
                  op.actionType,
                  op.description
                );
              });

              appliedStates.push(nextData);
              previousData = nextData;
            }

            // Now undo all operations
            const undoResults: (ExcelData | null)[] = [];
            for (let i = 0; i < operations.length; i++) {
              let undoneData: ExcelData | null = null;
              act(() => {
                undoneData = result.current.undo();
              });
              undoResults.push(undoneData);
            }

            // Now redo all operations
            const redoResults: (ExcelData | null)[] = [];
            for (let i = 0; i < operations.length; i++) {
              let redoneData: ExcelData | null = null;
              act(() => {
                redoneData = result.current.redo();
              });
              redoResults.push(redoneData);
            }

            // Verify idempotence: each redo should match the original applied state
            for (let i = 0; i < operations.length; i++) {
              const redone = redoResults[i];
              const original = appliedStates[i];
              
              expect(redone).not.toBeNull();
              if (redone) {
                expect((redone as ExcelData).rows).toEqual(original.rows);
                expect((redone as ExcelData).headers).toEqual(original.headers);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain data integrity through undo-redo cycles", () => {
      fc.assert(
        fc.property(
          excelDataArbitrary,
          excelDataArbitrary,
          actionTypeArbitrary,
          (initialDataSpec, modifiedDataSpec, actionType) => {
            const initialData = createMockExcelData({
              fileName: initialDataSpec.fileName,
              sheets: initialDataSpec.sheets,
              currentSheet: initialDataSpec.currentSheet,
              headers: initialDataSpec.headers,
              rows: initialDataSpec.rows,
            });

            const modifiedData = createMockExcelData({
              fileName: modifiedDataSpec.fileName,
              sheets: modifiedDataSpec.sheets,
              currentSheet: modifiedDataSpec.currentSheet,
              headers: modifiedDataSpec.headers,
              rows: modifiedDataSpec.rows,
            });

            const { result } = renderHook(() => useUndoRedo(initialData));

            // Push state
            act(() => {
              result.current.pushState(
                initialData,
                modifiedData,
                actionType,
                "Test operation"
              );
            });

            // Perform multiple undo-redo cycles
            for (let cycle = 0; cycle < 3; cycle++) {
              let undoneData: ExcelData | null = null;
              act(() => {
                undoneData = result.current.undo();
              });

              // Verify undo returns initial data
              if (undoneData) {
                expect((undoneData as ExcelData).rows).toEqual(initialData.rows);
              }

              let redoneData: ExcelData | null = null;
              act(() => {
                redoneData = result.current.redo();
              });

              // Verify redo returns modified data
              if (redoneData) {
                expect((redoneData as ExcelData).rows).toEqual(modifiedData.rows);
              }
            }

            // After multiple cycles, state should still be consistent
            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

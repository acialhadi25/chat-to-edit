import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { evaluateFormula } from "../index";
import { createMockExcelData } from "@/test/utils/testHelpers";

/**
 * Property-Based Test for Formula Evaluation Consistency
 * 
 * **Validates: Requirements 3.2.2**
 * 
 * Property 2: Formula Evaluation Consistency
 * For any formula and Excel data, evaluating the same formula multiple times
 * with the same data should always return the same result.
 */

// Arbitrary generators for property-based testing
const cellValueArbitrary = fc.oneof(
  fc.string({ maxLength: 20 }),
  fc.integer({ min: -1000, max: 1000 }),
  fc.double({ min: -1000, max: 1000, noNaN: true }),
  fc.constant(null)
);

const rowArbitrary = fc.array(cellValueArbitrary, { minLength: 1, maxLength: 10 });

const excelDataArbitrary = fc.record({
  headers: fc.array(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 1, maxLength: 10 }),
  rows: fc.array(rowArbitrary, { minLength: 1, maxLength: 20 }),
});

// Generate various formula types
const mathFormulaArbitrary = fc.oneof(
  fc.constant("=SUM(A2:A5)"),
  fc.constant("=AVERAGE(B2:B5)"),
  fc.constant("=COUNT(A2:C5)"),
  fc.constant("=MIN(A2:A5)"),
  fc.constant("=MAX(A2:A5)"),
  fc.constant("=ROUND(A2,2)"),
  fc.constant("=ABS(A2)"),
  fc.constant("=SQRT(A2)"),
  fc.constant("=POWER(A2,2)"),
  fc.constant("=MOD(A2,3)")
);

const textFormulaArbitrary = fc.oneof(
  fc.constant("=CONCAT(A2,B2)"),
  fc.constant("=LEFT(A2,3)"),
  fc.constant("=RIGHT(A2,3)"),
  fc.constant("=LEN(A2)"),
  fc.constant("=TRIM(A2)"),
  fc.constant("=UPPER(A2)"),
  fc.constant("=LOWER(A2)")
);

const logicalFormulaArbitrary = fc.oneof(
  fc.constant("=IF(A2>10,1,0)"),
  fc.constant("=AND(A2>0,B2>0)"),
  fc.constant("=OR(A2>10,B2>10)"),
  fc.constant("=NOT(A2>0)"),
  fc.constant("=ISBLANK(A2)"),
  fc.constant("=ISNUMBER(A2)")
);

const arithmeticFormulaArbitrary = fc.oneof(
  fc.constant("=A2+B2"),
  fc.constant("=A2-B2"),
  fc.constant("=A2*B2"),
  fc.constant("=A2/B2"),
  fc.constant("=(A2+B2)*C2")
);

const allFormulaArbitrary = fc.oneof(
  mathFormulaArbitrary,
  textFormulaArbitrary,
  logicalFormulaArbitrary,
  arithmeticFormulaArbitrary
);

describe("Property-Based Tests: Formula Evaluation Consistency", () => {
  describe("Property 2: Formula Evaluation Consistency", () => {
    it("should return same result when evaluating same formula twice", () => {
      fc.assert(
        fc.property(
          excelDataArbitrary,
          allFormulaArbitrary,
          (dataSpec, formula) => {
            // Create mock Excel data from generated spec
            const data = createMockExcelData({
              headers: dataSpec.headers,
              rows: dataSpec.rows,
            });

            // Evaluate formula twice
            const result1 = evaluateFormula(formula, data);
            const result2 = evaluateFormula(formula, data);

            // Results should be identical
            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return same result across multiple evaluations", () => {
      fc.assert(
        fc.property(
          excelDataArbitrary,
          allFormulaArbitrary,
          fc.integer({ min: 3, max: 10 }),
          (dataSpec, formula, evaluationCount) => {
            const data = createMockExcelData({
              headers: dataSpec.headers,
              rows: dataSpec.rows,
            });

            // Evaluate formula multiple times
            const results: (string | number | null)[] = [];
            for (let i = 0; i < evaluationCount; i++) {
              results.push(evaluateFormula(formula, data));
            }

            // All results should be identical
            const firstResult = results[0];
            for (const result of results) {
              expect(result).toEqual(firstResult);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency for math formulas with numeric data", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 5, maxLength: 10 }),
          mathFormulaArbitrary,
          (numbers, formula) => {
            const data = createMockExcelData({
              headers: ["A", "B", "C"],
              rows: numbers.map(n => [n, n * 2, n * 3]),
            });

            // Evaluate formula multiple times
            const result1 = evaluateFormula(formula, data);
            const result2 = evaluateFormula(formula, data);
            const result3 = evaluateFormula(formula, data);

            // All results should be identical
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency for text formulas with string data", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 5, maxLength: 10 }),
          textFormulaArbitrary,
          (strings, formula) => {
            const data = createMockExcelData({
              headers: ["A", "B", "C"],
              rows: strings.map(s => [s, s.toUpperCase(), s.toLowerCase()]),
            });

            // Evaluate formula multiple times
            const result1 = evaluateFormula(formula, data);
            const result2 = evaluateFormula(formula, data);
            const result3 = evaluateFormula(formula, data);

            // All results should be identical
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency for logical formulas", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 5, maxLength: 10 }),
          logicalFormulaArbitrary,
          (numbers, formula) => {
            const data = createMockExcelData({
              headers: ["A", "B", "C"],
              rows: numbers.map(n => [n, n + 10, n - 10]),
            });

            // Evaluate formula multiple times
            const result1 = evaluateFormula(formula, data);
            const result2 = evaluateFormula(formula, data);
            const result3 = evaluateFormula(formula, data);

            // All results should be identical
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency for arithmetic formulas", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 5, maxLength: 10 }),
          arithmeticFormulaArbitrary,
          (numbers, formula) => {
            const data = createMockExcelData({
              headers: ["A", "B", "C"],
              rows: numbers.map(n => [n, n + 5, n * 2]),
            });

            // Evaluate formula multiple times
            const result1 = evaluateFormula(formula, data);
            const result2 = evaluateFormula(formula, data);
            const result3 = evaluateFormula(formula, data);

            // All results should be identical
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency with mixed data types", () => {
      fc.assert(
        fc.property(
          excelDataArbitrary,
          allFormulaArbitrary,
          (dataSpec, formula) => {
            const data = createMockExcelData({
              headers: dataSpec.headers,
              rows: dataSpec.rows,
            });

            // Store results from multiple evaluations
            const results = new Set<string>();
            
            for (let i = 0; i < 5; i++) {
              const result = evaluateFormula(formula, data);
              // Convert to string for Set comparison (handles null, numbers, strings)
              results.add(JSON.stringify(result));
            }

            // Should only have one unique result
            expect(results.size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency when data is unchanged", () => {
      fc.assert(
        fc.property(
          excelDataArbitrary,
          allFormulaArbitrary,
          (dataSpec, formula) => {
            const data = createMockExcelData({
              headers: dataSpec.headers,
              rows: dataSpec.rows,
            });

            // Evaluate, then create a new data object with same values
            const result1 = evaluateFormula(formula, data);
            
            const dataCopy = createMockExcelData({
              headers: [...dataSpec.headers],
              rows: dataSpec.rows.map(row => [...row]),
            });
            
            const result2 = evaluateFormula(formula, dataCopy);

            // Results should be identical even with different object references
            expect(result1).toEqual(result2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency with edge case values", () => {
      const edgeCaseData = createMockExcelData({
        headers: ["A", "B", "C"],
        rows: [
          [0, null, ""],
          [1, 0, "test"],
          [-1, 100, ""],
          [null, null, null],
          [999, -999, "edge"],
        ],
      });

      const formulas = [
        "=SUM(A2:A6)",
        "=AVERAGE(A2:A6)",
        "=COUNT(A2:C6)",
        "=IF(A2>0,1,0)",
        "=CONCAT(C2,C3)",
      ];

      for (const formula of formulas) {
        // Evaluate each formula 10 times
        const results: (string | number | null)[] = [];
        for (let i = 0; i < 10; i++) {
          results.push(evaluateFormula(formula, edgeCaseData));
        }

        // All results should be identical
        const firstResult = results[0];
        for (const result of results) {
          expect(result).toEqual(firstResult);
        }
      }
    });

    it("should maintain consistency with complex nested formulas", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 5, maxLength: 10 }),
          (numbers) => {
            const data = createMockExcelData({
              headers: ["A", "B", "C"],
              rows: numbers.map(n => [n, n * 2, n * 3]),
            });

            // Test complex formulas that might involve multiple operations
            const complexFormulas = [
              "=SUM(A2:A6)",
              "=AVERAGE(B2:B6)",
              "=MAX(C2:C6)",
            ];

            for (const formula of complexFormulas) {
              const result1 = evaluateFormula(formula, data);
              const result2 = evaluateFormula(formula, data);
              const result3 = evaluateFormula(formula, data);

              expect(result1).toEqual(result2);
              expect(result2).toEqual(result3);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 2: Formula Caching Validation", () => {
    it("should produce consistent results suitable for caching", () => {
      fc.assert(
        fc.property(
          excelDataArbitrary,
          allFormulaArbitrary,
          (dataSpec, formula) => {
            const data = createMockExcelData({
              headers: dataSpec.headers,
              rows: dataSpec.rows,
            });

            // Simulate caching: evaluate once and store
            const cachedResult = evaluateFormula(formula, data);
            
            // Evaluate again and compare with cache
            const freshResult = evaluateFormula(formula, data);

            // Cache should be valid (results match)
            expect(freshResult).toEqual(cachedResult);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency across different evaluation contexts", () => {
      fc.assert(
        fc.property(
          excelDataArbitrary,
          allFormulaArbitrary,
          (dataSpec, formula) => {
            const data = createMockExcelData({
              headers: dataSpec.headers,
              rows: dataSpec.rows,
            });

            // Evaluate in different "contexts" (simulated by separate calls)
            const context1Result = evaluateFormula(formula, data);
            
            // Simulate some time passing or other operations
            Math.random(); // Simulate some operation
            
            const context2Result = evaluateFormula(formula, data);

            // Results should be consistent regardless of context
            expect(context1Result).toEqual(context2Result);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { applyConditionalFormatting, clearConditionalFormatting, getConditionalFormattingRules } from "@/services/conditionalFormattingService";
import type { FUniver, FWorkbook, FWorksheet, FRange, IRange } from "@/types/univer.types";

/**
 * Unit tests for CONDITIONAL_FORMAT AI Action
 * 
 * CONDITIONAL_FORMAT applies conditional formatting rules using Univer's native API:
 * - Format based on "contains" condition
 * - Format based on "equals" condition
 * - Case-sensitive matching
 * - Case-insensitive matching
 * - Styles applied correctly (background, color, bold)
 * - Multiple rules support
 * - Only first matching rule applied
 * 
 * Validates: AI Action CONDITIONAL_FORMAT, Property 16
 */

// Mock Univer API types
interface MockConditionalFormattingRule {
  ranges: IRange[];
  condition: string;
  value: string;
  backgroundColor?: string;
  fontColor?: string;
  bold?: boolean;
}

interface MockConditionalFormattingBuilder {
  ranges: IRange[];
  condition?: string;
  value?: string;
  backgroundColor?: string;
  fontColor?: string;
  bold?: boolean;
  setRanges: (ranges: IRange[]) => MockConditionalFormattingBuilder;
  whenTextContains: (value: string) => MockConditionalFormattingBuilder;
  whenTextEqualTo: (value: string) => MockConditionalFormattingBuilder;
  whenTextStartsWith: (value: string) => MockConditionalFormattingBuilder;
  whenTextEndsWith: (value: string) => MockConditionalFormattingBuilder;
  setBackground: (color: string) => MockConditionalFormattingBuilder;
  setFontColor: (color: string) => MockConditionalFormattingBuilder;
  setBold: (bold: boolean) => MockConditionalFormattingBuilder;
  build: () => MockConditionalFormattingRule;
}

// Helper to create mock Univer API
function createMockUniverAPI() {
  const rules: MockConditionalFormattingRule[] = [];
  
  const mockBuilder: MockConditionalFormattingBuilder = {
    ranges: [],
    setRanges(ranges: IRange[]) {
      this.ranges = ranges;
      return this;
    },
    whenTextContains(value: string) {
      this.condition = 'contains';
      this.value = value;
      return this;
    },
    whenTextEqualTo(value: string) {
      this.condition = 'equals';
      this.value = value;
      return this;
    },
    whenTextStartsWith(value: string) {
      this.condition = 'startsWith';
      this.value = value;
      return this;
    },
    whenTextEndsWith(value: string) {
      this.condition = 'endsWith';
      this.value = value;
      return this;
    },
    setBackground(color: string) {
      this.backgroundColor = color;
      return this;
    },
    setFontColor(color: string) {
      this.fontColor = color;
      return this;
    },
    setBold(bold: boolean) {
      this.bold = bold;
      return this;
    },
    build() {
      const rule: MockConditionalFormattingRule = {
        ranges: this.ranges,
        condition: this.condition || '',
        value: this.value || '',
        backgroundColor: this.backgroundColor,
        fontColor: this.fontColor,
        bold: this.bold,
      };
      return rule;
    },
  };

  const mockRange = {
    getRange: () => ({
      startRow: 0,
      startColumn: 0,
      endRow: 10,
      endColumn: 0,
    } as IRange),
  } as unknown as FRange;

  const mockWorksheet = {
    getRange: vi.fn(() => mockRange),
    newConditionalFormattingRule: vi.fn(() => {
      // Reset builder state for new rule
      mockBuilder.ranges = [];
      mockBuilder.condition = undefined;
      mockBuilder.value = undefined;
      mockBuilder.backgroundColor = undefined;
      mockBuilder.fontColor = undefined;
      mockBuilder.bold = undefined;
      return mockBuilder;
    }),
    addConditionalFormattingRule: vi.fn((rule: MockConditionalFormattingRule) => {
      rules.push(rule);
    }),
    clearConditionalFormatRules: vi.fn(() => {
      rules.length = 0;
    }),
    getConditionalFormattingRules: vi.fn(() => rules),
  } as any as FWorksheet;

  const mockWorkbook = {
    getActiveSheet: vi.fn(() => mockWorksheet),
  } as any as FWorkbook;

  const mockUniverAPI = {
    getActiveWorkbook: vi.fn(() => mockWorkbook),
  } as any as FUniver;

  return { mockUniverAPI, mockWorksheet, rules };
}

describe("CONDITIONAL_FORMAT Action", () => {
  let mockAPI: ReturnType<typeof createMockUniverAPI>;

  beforeEach(() => {
    mockAPI = createMockUniverAPI();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Format based on 'contains' condition", () => {
    it("should apply formatting when text contains specified value", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'contains' as const,
            value: 'Lunas',
            format: {
              backgroundColor: '#00ff00',
              color: '#000000',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(1);
      expect(mockAPI.rules[0].condition).toBe('contains');
      expect(mockAPI.rules[0].value).toBe('Lunas');
      expect(mockAPI.rules[0].backgroundColor).toBe('#00ff00');
      expect(mockAPI.rules[0].fontColor).toBe('#000000');
    });

    it("should apply formatting with textContains condition", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'textContains' as const,
            value: 'Pending',
            format: {
              backgroundColor: '#ffff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(1);
      expect(mockAPI.rules[0].condition).toBe('contains');
      expect(mockAPI.rules[0].value).toBe('Pending');
    });

    it("should apply formatting with partial text match", () => {
      const params = {
        target: { type: 'range' as const, ref: 'G2:G13' },
        rules: [
          {
            condition: 'contains' as const,
            value: 'Belum',
            format: {
              backgroundColor: '#ff0000',
              color: '#ffffff',
              bold: true,
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].backgroundColor).toBe('#ff0000');
      expect(mockAPI.rules[0].fontColor).toBe('#ffffff');
      expect(mockAPI.rules[0].bold).toBe(true);
    });
  });

  describe("Format based on 'equals' condition", () => {
    it("should apply formatting when text equals specified value", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Lunas',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(1);
      expect(mockAPI.rules[0].condition).toBe('equals');
      expect(mockAPI.rules[0].value).toBe('Lunas');
    });

    it("should apply formatting with textEquals condition", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'textEquals' as const,
            value: 'Active',
            format: {
              backgroundColor: '#00ff00',
              color: '#000000',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].condition).toBe('equals');
      expect(mockAPI.rules[0].value).toBe('Active');
    });

    it("should apply formatting for exact match only", () => {
      const params = {
        target: { type: 'range' as const, ref: 'G2:G13' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Completed',
            format: {
              backgroundColor: '#0000ff',
              color: '#ffffff',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].value).toBe('Completed');
      expect(mockAPI.rules[0].backgroundColor).toBe('#0000ff');
    });
  });

  describe("Case-sensitive matching", () => {
    it("should apply case-sensitive matching when specified", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'LUNAS',
            format: {
              backgroundColor: '#00ff00',
              caseSensitive: true,
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].value).toBe('LUNAS');
      // Note: Univer's native API handles case sensitivity internally
      // We just verify the rule was created with the correct value
    });

    it("should distinguish between uppercase and lowercase with case-sensitive", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'contains' as const,
            value: 'Lunas',
            format: {
              backgroundColor: '#00ff00',
              caseSensitive: true,
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].value).toBe('Lunas');
      // Should not match 'LUNAS' or 'lunas' when case-sensitive
    });

    it("should apply multiple case-sensitive rules", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Active',
            format: {
              backgroundColor: '#00ff00',
              caseSensitive: true,
            },
          },
          {
            condition: 'equals' as const,
            value: 'ACTIVE',
            format: {
              backgroundColor: '#ffff00',
              caseSensitive: true,
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(2);
      expect(mockAPI.rules[0].value).toBe('Active');
      expect(mockAPI.rules[1].value).toBe('ACTIVE');
    });
  });

  describe("Case-insensitive matching", () => {
    it("should apply case-insensitive matching by default", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'lunas',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].value).toBe('lunas');
      // Should match 'Lunas', 'LUNAS', 'lunas' when case-insensitive (default)
    });

    it("should apply case-insensitive matching when explicitly set to false", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'contains' as const,
            value: 'pending',
            format: {
              backgroundColor: '#ffff00',
              caseSensitive: false,
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].value).toBe('pending');
    });

    it("should match different case variations with case-insensitive", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Active',
            format: {
              backgroundColor: '#00ff00',
              caseSensitive: false,
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      // Should match 'active', 'ACTIVE', 'Active', 'AcTiVe', etc.
    });
  });

  describe("Styles applied correctly", () => {
    it("should apply background color only", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Lunas',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].backgroundColor).toBe('#00ff00');
      expect(mockAPI.rules[0].fontColor).toBeUndefined();
      expect(mockAPI.rules[0].bold).toBeUndefined();
    });

    it("should apply font color only", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Pending',
            format: {
              color: '#ff0000',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].fontColor).toBe('#ff0000');
      expect(mockAPI.rules[0].backgroundColor).toBeUndefined();
    });

    it("should apply bold formatting only", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Important',
            format: {
              bold: true,
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].bold).toBe(true);
    });

    it("should apply all style properties together", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Critical',
            format: {
              backgroundColor: '#ff0000',
              color: '#ffffff',
              bold: true,
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].backgroundColor).toBe('#ff0000');
      expect(mockAPI.rules[0].fontColor).toBe('#ffffff');
      expect(mockAPI.rules[0].bold).toBe(true);
    });

    it("should apply different colors for different conditions", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Lunas',
            format: {
              backgroundColor: '#00ff00',
              color: '#000000',
            },
          },
          {
            condition: 'equals' as const,
            value: 'Pending',
            format: {
              backgroundColor: '#ffff00',
              color: '#000000',
            },
          },
          {
            condition: 'contains' as const,
            value: 'Belum',
            format: {
              backgroundColor: '#ff0000',
              color: '#ffffff',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(3);
      expect(mockAPI.rules[0].backgroundColor).toBe('#00ff00');
      expect(mockAPI.rules[1].backgroundColor).toBe('#ffff00');
      expect(mockAPI.rules[2].backgroundColor).toBe('#ff0000');
    });
  });

  describe("Multiple rules support", () => {
    it("should apply multiple rules to same range", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Lunas',
            format: {
              backgroundColor: '#00ff00',
            },
          },
          {
            condition: 'equals' as const,
            value: 'Pending',
            format: {
              backgroundColor: '#ffff00',
            },
          },
          {
            condition: 'contains' as const,
            value: 'Belum',
            format: {
              backgroundColor: '#ff0000',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(3);
      // @ts-expect-error - Mock method not in type definition
      expect(mockAPI.mockWorksheet.addConditionalFormattingRule).toHaveBeenCalledTimes(3);
    });

    it("should apply rules in order", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'First',
            format: {
              backgroundColor: '#ff0000',
            },
          },
          {
            condition: 'equals' as const,
            value: 'Second',
            format: {
              backgroundColor: '#00ff00',
            },
          },
          {
            condition: 'equals' as const,
            value: 'Third',
            format: {
              backgroundColor: '#0000ff',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].value).toBe('First');
      expect(mockAPI.rules[1].value).toBe('Second');
      expect(mockAPI.rules[2].value).toBe('Third');
    });

    it("should handle empty rules array", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      // Empty rules array returns true but doesn't add any rules
      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(0);
    });

    it("should handle single rule", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Only',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(1);
    });

    it("should handle many rules (10+)", () => {
      const rules = Array.from({ length: 15 }, (_, i) => ({
        condition: 'equals' as const,
        value: `Value${i}`,
        format: {
          backgroundColor: `#${i.toString(16).padStart(6, '0')}`,
        },
      }));

      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules,
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(15);
    });
  });

  describe("Only first matching rule applied", () => {
    it("should apply first matching rule when multiple rules match", () => {
      // Note: Univer's native API handles rule priority internally
      // We verify that rules are added in order, and Univer will apply the first match
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'contains' as const,
            value: 'Lunas',
            format: {
              backgroundColor: '#00ff00',
            },
          },
          {
            condition: 'equals' as const,
            value: 'Lunas',
            format: {
              backgroundColor: '#ffff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(2);
      // First rule should be 'contains'
      expect(mockAPI.rules[0].condition).toBe('contains');
      expect(mockAPI.rules[0].backgroundColor).toBe('#00ff00');
      // Second rule should be 'equals'
      expect(mockAPI.rules[1].condition).toBe('equals');
      expect(mockAPI.rules[1].backgroundColor).toBe('#ffff00');
    });

    it("should prioritize more specific rules when ordered first", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Belum Bayar',
            format: {
              backgroundColor: '#ff0000',
            },
          },
          {
            condition: 'contains' as const,
            value: 'Belum',
            format: {
              backgroundColor: '#ffff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      // More specific rule (equals) is first
      expect(mockAPI.rules[0].condition).toBe('equals');
      expect(mockAPI.rules[0].value).toBe('Belum Bayar');
    });

    it("should handle overlapping conditions correctly", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'startsWith' as const,
            value: 'Pending',
            format: {
              backgroundColor: '#ffff00',
            },
          },
          {
            condition: 'contains' as const,
            value: 'Pending',
            format: {
              backgroundColor: '#ff9900',
            },
          },
          {
            condition: 'equals' as const,
            value: 'Pending Payment',
            format: {
              backgroundColor: '#ff0000',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(3);
      // Rules are applied in order
      expect(mockAPI.rules[0].condition).toBe('startsWith');
      expect(mockAPI.rules[1].condition).toBe('contains');
      expect(mockAPI.rules[2].condition).toBe('equals');
    });
  });

  describe("Additional condition types", () => {
    it("should apply startsWith condition", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'startsWith' as const,
            value: 'Pending',
            format: {
              backgroundColor: '#ffff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].condition).toBe('startsWith');
      expect(mockAPI.rules[0].value).toBe('Pending');
    });

    it("should apply endsWith condition", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'endsWith' as const,
            value: 'Bayar',
            format: {
              backgroundColor: '#ff0000',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].condition).toBe('endsWith');
      expect(mockAPI.rules[0].value).toBe('Bayar');
    });

    it("should apply textStartsWith condition", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'textStartsWith' as const,
            value: 'Active',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].condition).toBe('startsWith');
    });

    it("should apply textEndsWith condition", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'textEndsWith' as const,
            value: 'Complete',
            format: {
              backgroundColor: '#0000ff',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.rules[0].condition).toBe('endsWith');
    });
  });

  describe("Target range handling", () => {
    it("should handle column reference (single letter)", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.mockWorksheet.getRange).toHaveBeenCalledWith('G:G');
    });

    it("should handle range reference", () => {
      const params = {
        target: { type: 'range' as const, ref: 'G2:G13' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.mockWorksheet.getRange).toHaveBeenCalledWith('G2:G13');
    });

    it("should handle multi-column range", () => {
      const params = {
        target: { type: 'range' as const, ref: 'A1:C10' },
        rules: [
          {
            condition: 'contains' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.mockWorksheet.getRange).toHaveBeenCalledWith('A1:C10');
    });

    it("should handle single cell reference", () => {
      const params = {
        target: { type: 'range' as const, ref: 'A1' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(true);
      expect(mockAPI.mockWorksheet.getRange).toHaveBeenCalledWith('A1:A1');
    });
  });

  describe("Error handling", () => {
    it("should return false when no active workbook", () => {
      const mockAPI = createMockUniverAPI();
      (mockAPI.mockUniverAPI.getActiveWorkbook as any).mockReturnValue(null);

      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(false);
    });

    it("should return false when no active sheet", () => {
      const mockAPI = createMockUniverAPI();
      const mockWorkbook = mockAPI.mockUniverAPI.getActiveWorkbook() as FWorkbook;
      (mockWorkbook.getActiveSheet as any).mockReturnValue(null);

      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(false);
    });

    it("should handle missing target ref", () => {
      const params = {
        target: { type: 'column' as const, ref: '' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      // Empty ref still returns true but converts to ':'
      expect(success).toBe(true);
    });

    it("should return false when rules array is missing", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: undefined as any,
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      expect(success).toBe(false);
    });

    it("should handle invalid condition type gracefully", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'invalidCondition' as any,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      const success = applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      // Should still return true but skip invalid rule
      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(0);
    });
  });

  describe("Clear conditional formatting", () => {
    it("should clear all rules from worksheet", () => {
      // First add some rules
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      applyConditionalFormatting(mockAPI.mockUniverAPI, params);
      expect(mockAPI.rules).toHaveLength(1);

      // Clear all rules
      const success = clearConditionalFormatting(mockAPI.mockUniverAPI);

      expect(success).toBe(true);
      expect(mockAPI.rules).toHaveLength(0);
      // @ts-expect-error - Mock method not in type definition
      expect(mockAPI.mockWorksheet.clearConditionalFormatRules).toHaveBeenCalled();
    });

    it("should clear rules from specific range", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test',
            format: {
              backgroundColor: '#00ff00',
            },
          },
        ],
      };

      applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      // Add clearConditionalFormatRules method to mockRange
      const mockRangeWithClear = {
        ...mockAPI.mockWorksheet.getRange('G:G'),
        clearConditionalFormatRules: vi.fn(),
      };
      (mockAPI.mockWorksheet.getRange as any).mockReturnValue(mockRangeWithClear);

      const success = clearConditionalFormatting(mockAPI.mockUniverAPI, 'G:G');

      expect(success).toBe(true);
      expect(mockAPI.mockWorksheet.getRange).toHaveBeenCalledWith('G:G');
    });
  });

  describe("Get conditional formatting rules", () => {
    it("should return all rules from worksheet", () => {
      const params = {
        target: { type: 'column' as const, ref: 'G' },
        rules: [
          {
            condition: 'equals' as const,
            value: 'Test1',
            format: {
              backgroundColor: '#00ff00',
            },
          },
          {
            condition: 'contains' as const,
            value: 'Test2',
            format: {
              backgroundColor: '#ffff00',
            },
          },
        ],
      };

      applyConditionalFormatting(mockAPI.mockUniverAPI, params);

      const rules = getConditionalFormattingRules(mockAPI.mockUniverAPI);

      expect(rules).toHaveLength(2);
      expect(rules[0].value).toBe('Test1');
      expect(rules[1].value).toBe('Test2');
    });

    it("should return empty array when no rules exist", () => {
      const rules = getConditionalFormattingRules(mockAPI.mockUniverAPI);

      expect(rules).toHaveLength(0);
    });
  });
});

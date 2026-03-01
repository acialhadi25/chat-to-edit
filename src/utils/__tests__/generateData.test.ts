// @ts-nocheck
import { describe, it, expect } from "vitest";
import { generateChangesFromAction } from "../excelOperations";
import { applyChanges } from "../applyChanges";
import { createMockExcelData } from "@/test/utils/testHelpers";
import { AIAction } from "@/types/excel";

/**
 * Unit tests for GENERATE_DATA AI Action
 * 
 * GENERATE_DATA allows generating pattern-based data with:
 * - Numeric sequences
 * - Names (Indonesian/English)
 * - Addresses
 * - Phone numbers
 * - Email addresses
 * - Status values
 * - "Fill to row X" command
 * - All columns filled with appropriate data
 * 
 * Validates: AI Action GENERATE_DATA
 */
describe("GENERATE_DATA Action", () => {
  describe("Generate numeric sequence", () => {
    it("should generate sequential numbers starting from 1", () => {
      const data = createMockExcelData({
        headers: ["ID", "Name"],
        rows: [
          [1, "Alice"],
          [2, "Bob"],
        ],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "3:5" }, // Rows 3-5 (0-based: 1-3)
        patterns: {
          A: { type: "sequence", start: 3, increment: 1 },
        },
        description: "Generate sequence for rows 3-5",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should generate 3 values (rows 1, 2, 3 in 0-based)
      expect(changes).toHaveLength(3);
      expect(result.data.rows[1][0]).toBe(3);
      expect(result.data.rows[2][0]).toBe(4);
      expect(result.data.rows[3][0]).toBe(5);
    });


    it("should generate sequence with custom increment", () => {
      const data = createMockExcelData({
        headers: ["Number"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:6" },
        patterns: {
          A: { type: "sequence", start: 10, increment: 5 },
        },
        description: "Generate sequence 10, 15, 20, 25, 30",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[0][0]).toBe(10);
      expect(result.data.rows[1][0]).toBe(15);
      expect(result.data.rows[2][0]).toBe(20);
      expect(result.data.rows[3][0]).toBe(25);
      expect(result.data.rows[4][0]).toBe(30);
    });

    it("should generate sequence with negative increment", () => {
      const data = createMockExcelData({
        headers: ["Countdown"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:5" },
        patterns: {
          A: { type: "sequence", start: 100, increment: -10 },
        },
        description: "Generate countdown",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[0][0]).toBe(100);
      expect(result.data.rows[1][0]).toBe(90);
      expect(result.data.rows[2][0]).toBe(80);
      expect(result.data.rows[3][0]).toBe(70);
    });
  });


  describe("Generate names (Indonesian/English)", () => {
    it("should generate Indonesian names", () => {
      const data = createMockExcelData({
        headers: ["Nama"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:6" },
        patterns: {
          A: { type: "names", style: "indonesian" },
        },
        description: "Generate Indonesian names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      const indonesianNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indra', 'Joko'];
      
      expect(result.data.rows).toHaveLength(5);
      result.data.rows.forEach((row, index) => {
        expect(indonesianNames).toContain(row[0]);
      });
    });

    it("should generate English names", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:11" },
        patterns: {
          A: { type: "names", style: "english" },
        },
        description: "Generate English names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      const englishNames = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt', 'Fiona Gallagher', 'George Miller', 'Hannah Montana'];
      
      expect(result.data.rows).toHaveLength(10);
      result.data.rows.forEach((row) => {
        expect(englishNames).toContain(row[0]);
      });
    });

    it("should cycle through names when more rows than names available", () => {
      const data = createMockExcelData({
        headers: ["Name"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:16" }, // 15 rows
        patterns: {
          A: { type: "names", style: "indonesian" },
        },
        description: "Generate many names",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(15);
      // First name should repeat at position 10 (0-based)
      expect(result.data.rows[0][0]).toBe(result.data.rows[10][0]);
    });
  });


  describe("Generate addresses", () => {
    it("should generate Indonesian addresses with street, number, and city", () => {
      const data = createMockExcelData({
        headers: ["Alamat"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:6" },
        patterns: {
          A: { type: "addresses" },
        },
        description: "Generate addresses",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(5);
      result.data.rows.forEach((row) => {
        const address = row[0] as string;
        expect(address).toContain("Jl.");
        expect(address).toContain("No.");
        expect(address).toMatch(/Jakarta|Surabaya|Bandung|Medan|Semarang|Makassar|Palembang|Yogyakarta/);
      });
    });

    it("should generate unique addresses with incrementing numbers", () => {
      const data = createMockExcelData({
        headers: ["Address"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:4" },
        patterns: {
          A: { type: "addresses" },
        },
        description: "Generate 3 addresses",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Check that addresses have different numbers
      const addr1 = result.data.rows[0][0] as string;
      const addr2 = result.data.rows[1][0] as string;
      const addr3 = result.data.rows[2][0] as string;

      expect(addr1).toContain("No. 10");
      expect(addr2).toContain("No. 20");
      expect(addr3).toContain("No. 30");
    });

    it("should cycle through streets and cities", () => {
      const data = createMockExcelData({
        headers: ["Address"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:12" }, // 11 rows
        patterns: {
          A: { type: "addresses" },
        },
        description: "Generate many addresses",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(11);
      // All should be valid addresses
      result.data.rows.forEach((row) => {
        expect(row[0]).toContain("Jl.");
        expect(row[0]).toContain("No.");
      });
    });
  });


  describe("Generate phone numbers", () => {
    it("should generate Indonesian phone numbers", () => {
      const data = createMockExcelData({
        headers: ["Telepon"],
        rows: [
          [null],
          [null],
          [null],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:6" },
        patterns: {
          A: { type: "phone" },
        },
        description: "Generate phone numbers",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(5);
      result.data.rows.forEach((row) => {
        const phone = row[0] as string;
        expect(phone).toMatch(/^0812345678\d{2}$/);
      });
    });

    it("should generate sequential phone numbers", () => {
      const data = createMockExcelData({
        headers: ["Phone"],
        rows: [
          [null],
          [null],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:5" },
        patterns: {
          A: { type: "phone" },
        },
        description: "Generate 4 phone numbers",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[0][0]).toBe("081234567800");
      expect(result.data.rows[1][0]).toBe("081234567801");
      expect(result.data.rows[2][0]).toBe("081234567802");
      expect(result.data.rows[3][0]).toBe("081234567803");
    });

    it("should pad phone number suffix with zeros", () => {
      const data = createMockExcelData({
        headers: ["Phone"],
        rows: [
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:3" },
        patterns: {
          A: { type: "phone" },
        },
        description: "Generate 2 phone numbers",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // First phone should have "00" suffix
      expect(result.data.rows[0][0]).toBe("081234567800");
      // Second should have "01" suffix
      expect(result.data.rows[1][0]).toBe("081234567801");
    });
  });


  describe("Generate email addresses", () => {
    it("should generate email addresses with sequential numbers", () => {
      const data = createMockExcelData({
        headers: ["Email"],
        rows: [
          [null],
          [null],
          [null],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:6" },
        patterns: {
          A: { type: "email" },
        },
        description: "Generate email addresses",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(5);
      result.data.rows.forEach((row, index) => {
        const email = row[0] as string;
        expect(email).toMatch(/^user\d+@example\.com$/);
      });
    });

    it("should generate emails with correct row-based numbering", () => {
      const data = createMockExcelData({
        headers: ["Email"],
        rows: [
          [null],
          [null],
          [null],
          [null],
        ],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:5" },
        patterns: {
          A: { type: "email" },
        },
        description: "Generate 4 emails",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Email numbering is based on row index + 1
      expect(result.data.rows[0][0]).toBe("user1@example.com");
      expect(result.data.rows[1][0]).toBe("user2@example.com");
      expect(result.data.rows[2][0]).toBe("user3@example.com");
      expect(result.data.rows[3][0]).toBe("user4@example.com");
    });

    it("should generate many emails with unique numbers", () => {
      const data = createMockExcelData({
        headers: ["Email"],
        rows: Array(20).fill(null).map(() => [null]),
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:21" }, // 20 emails
        patterns: {
          A: { type: "email" },
        },
        description: "Generate 20 emails",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(20);
      
      // Check uniqueness
      const emails = result.data.rows.map(row => row[0]);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(20);
    });
  });


  describe("Generate status values", () => {
    it("should generate status values from predefined list", () => {
      const data = createMockExcelData({
        headers: ["Status"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:6" },
        patterns: {
          A: { type: "status", values: ["Active", "Pending", "Completed"] },
        },
        description: "Generate status values",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(5);
      result.data.rows.forEach((row) => {
        expect(["Active", "Pending", "Completed"]).toContain(row[0]);
      });
    });

    it("should cycle through status values", () => {
      const data = createMockExcelData({
        headers: ["Status"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:8" }, // 7 rows
        patterns: {
          A: { type: "status", values: ["Active", "Inactive"] },
        },
        description: "Generate alternating status",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[0][0]).toBe("Active");
      expect(result.data.rows[1][0]).toBe("Inactive");
      expect(result.data.rows[2][0]).toBe("Active");
      expect(result.data.rows[3][0]).toBe("Inactive");
      expect(result.data.rows[4][0]).toBe("Active");
      expect(result.data.rows[5][0]).toBe("Inactive");
      expect(result.data.rows[6][0]).toBe("Active");
    });

    it("should use default status values if none provided", () => {
      const data = createMockExcelData({
        headers: ["Status"],
        rows: [],
      });

      const action: AIAction = {
        type: "GENERATE_DATA",
        target: { type: "range", ref: "2:5" },
        patterns: {
          A: { type: "status" },
        },
        description: "Generate default status",
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      result.data.rows.forEach((row) => {
        expect(["Active", "Pending", "Completed"]).toContain(row[0]);
      });
    });
  });


  describe('Generate random numbers', () => {
    it('should generate numbers within specified range', () => {
      const data = createMockExcelData({
        headers: ['Score'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:11' },
        patterns: {
          A: { type: 'numbers', min: 0, max: 100 },
        },
        description: 'Generate scores 0-100',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(10);
      result.data.rows.forEach((row) => {
        const value = row[0] as number;
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should generate large numbers for prices', () => {
      const data = createMockExcelData({
        headers: ['Price'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:6' },
        patterns: {
          A: { type: 'numbers', min: 100000, max: 10000000 },
        },
        description: 'Generate prices',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      result.data.rows.forEach((row) => {
        const value = row[0] as number;
        expect(value).toBeGreaterThanOrEqual(100000);
        expect(value).toBeLessThanOrEqual(10000000);
      });
    });

    it('should use default range if not specified', () => {
      const data = createMockExcelData({
        headers: ['Value'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:5' },
        patterns: {
          A: { type: 'numbers' },
        },
        description: 'Generate numbers',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      result.data.rows.forEach((row) => {
        const value = row[0] as number;
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1000000);
      });
    });
  });


  describe('Generate product names', () => {
    it('should generate product names from predefined list', () => {
      const data = createMockExcelData({
        headers: ['Product'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:6' },
        patterns: {
          A: { type: 'products' },
        },
        description: 'Generate products',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      const products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Printer', 'Scanner', 'Webcam', 'Headset', 'Speaker', 'Microphone'];
      
      expect(result.data.rows).toHaveLength(5);
      result.data.rows.forEach((row) => {
        expect(products).toContain(row[0]);
      });
    });

    it('should cycle through products', () => {
      const data = createMockExcelData({
        headers: ['Product'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:16' }, // 15 rows
        patterns: {
          A: { type: 'products' },
        },
        description: 'Generate many products',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(15);
      // First product should repeat at position 10
      expect(result.data.rows[0][0]).toBe(result.data.rows[10][0]);
    });
  });

  describe('Generate text values', () => {
    it('should generate text from custom values list', () => {
      const data = createMockExcelData({
        headers: ['Department'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:5' },
        patterns: {
          A: { type: 'text', values: ['Sales', 'Marketing', 'Engineering'] },
        },
        description: 'Generate departments',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows[0][0]).toBe('Sales');
      expect(result.data.rows[1][0]).toBe('Marketing');
      expect(result.data.rows[2][0]).toBe('Engineering');
      expect(result.data.rows[3][0]).toBe('Sales'); // Cycles back
    });

    it('should use default text values if none provided', () => {
      const data = createMockExcelData({
        headers: ['Data'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:4' },
        patterns: {
          A: { type: 'text' },
        },
        description: 'Generate text',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      result.data.rows.forEach((row) => {
        expect(typeof row[0]).toBe('string');
        expect(row[0]).toContain('Value');
      });
    });
  });


  describe('"Fill to row X" command', () => {
    it('should fill data to specified row number', () => {
      const data = createMockExcelData({
        headers: ['No', 'Name'],
        rows: [
          [1, 'Alice'],
          [2, 'Bob'],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Isi data hingga baris 5',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      // Should generate rows 3, 4, 5 (indices 2, 3, 4)
      expect(result.data.rows).toHaveLength(5);
      expect(result.data.rows[2][0]).toBe(3); // No column
      expect(result.data.rows[3][0]).toBe(4);
      expect(result.data.rows[4][0]).toBe(5);
    });

    it('should support English "fill to row" command', () => {
      const data = createMockExcelData({
        headers: ['ID', 'Name'],
        rows: [
          [1, 'Alice'],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Fill data to row 4',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(4);
      // ID column should use existing values as pattern (just [1])
      // So it will cycle through [1]
      expect(result.data.rows[1][0]).toBe(1);
      expect(result.data.rows[2][0]).toBe(1);
      expect(result.data.rows[3][0]).toBe(1);
    });

    it('should support "rows X-Y" format', () => {
      const data = createMockExcelData({
        headers: ['No', 'Name'],
        rows: [
          [1, 'Alice'],
          [2, 'Bob'],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Fill rows 3-6',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(6);
      expect(result.data.rows[2][0]).toBe(3);
      expect(result.data.rows[5][0]).toBe(6);
    });

    it('should support Indonesian "baris X-Y" format', () => {
      const data = createMockExcelData({
        headers: ['No', 'Nama'],
        rows: [
          [1, 'Ahmad'],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Isi baris 2-5',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(5);
      expect(result.data.rows[1][0]).toBe(2);
      expect(result.data.rows[4][0]).toBe(5);
    });

    it('should not generate data if target row is not greater than current rows', () => {
      const data = createMockExcelData({
        headers: ['No', 'Name'],
        rows: [
          [1, 'Alice'],
          [2, 'Bob'],
          [3, 'Charlie'],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Fill to row 2', // Already have 3 rows
      };

      const changes = generateChangesFromAction(data, action);

      expect(changes).toHaveLength(0);
    });
  });


  describe('All columns filled with appropriate data', () => {
    it('should auto-detect patterns for all columns based on headers', () => {
      const data = createMockExcelData({
        headers: ['No', 'Nama', 'Alamat', 'Telepon', 'Email', 'Status'],
        rows: [
          [1, 'Ahmad', 'Jl. Sudirman No. 10, Jakarta', '081234567800', 'user1@example.com', 'Active'],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Isi data hingga baris 5',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(5);
      
      // Check No column (sequence)
      expect(result.data.rows[1][0]).toBe(2);
      expect(result.data.rows[4][0]).toBe(5);
      
      // Check Nama column (Indonesian names)
      const indonesianNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indra', 'Joko'];
      result.data.rows.forEach((row) => {
        expect(indonesianNames).toContain(row[1]);
      });
      
      // Check Alamat column (addresses)
      result.data.rows.forEach((row) => {
        expect(row[2]).toContain('Jl.');
        expect(row[2]).toContain('No.');
      });
      
      // Check Telepon column (phone)
      result.data.rows.forEach((row) => {
        expect(row[3]).toMatch(/^08123456780\d$/);
      });
      
      // Check Email column (email)
      result.data.rows.forEach((row) => {
        expect(row[4]).toMatch(/^user\d+@example\.com$/);
      });
      
      // Check Status column (status)
      result.data.rows.forEach((row) => {
        expect(['Active', 'Pending', 'Completed', 'Lunas', 'Belum Lunas']).toContain(row[5]);
      });
    });

    it('should detect product and price columns', () => {
      const data = createMockExcelData({
        headers: ['No', 'Produk', 'Harga', 'Qty'],
        rows: [
          [1, 'Laptop', 5000000, 2],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Fill to row 4',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(4);
      
      // Check Produk column
      const products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Printer', 'Scanner', 'Webcam', 'Headset'];
      result.data.rows.forEach((row) => {
        expect(products).toContain(row[1]);
      });
      
      // Check Harga column (large numbers)
      result.data.rows.forEach((row) => {
        expect(typeof row[2]).toBe('number');
        expect(row[2]).toBeGreaterThanOrEqual(100000);
        expect(row[2]).toBeLessThanOrEqual(10000000);
      });
      
      // Check Qty column (small numbers)
      result.data.rows.forEach((row) => {
        expect(typeof row[3]).toBe('number');
        expect(row[3]).toBeGreaterThanOrEqual(1);
        expect(row[3]).toBeLessThanOrEqual(100);
      });
    });

    it('should use existing values as pattern when no specific pattern detected', () => {
      const data = createMockExcelData({
        headers: ['No', 'Category'],
        rows: [
          [1, 'Electronics'],
          [2, 'Furniture'],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Fill to row 5',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(5);
      
      // Category should cycle through existing values
      result.data.rows.forEach((row) => {
        expect(['Electronics', 'Furniture']).toContain(row[1]);
      });
    });

    it('should handle empty columns with default pattern', () => {
      const data = createMockExcelData({
        headers: ['No', 'Unknown Column'],
        rows: [
          [1, null],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Fill to row 3',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(3);
      
      // Unknown column should get default text pattern
      // Since there's no existing data, it will use "Unknown Column X" pattern
      result.data.rows.forEach((row, index) => {
        if (index > 0) { // Skip first row which is existing data
          expect(typeof row[1]).toBe('string');
          expect(row[1]).toContain('Unknown Column');
        }
      });
    });
  });


  describe('Multiple columns with different patterns', () => {
    it('should generate data for multiple columns simultaneously', () => {
      const data = createMockExcelData({
        headers: ['ID', 'Name', 'Email'],
        rows: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:6' },
        patterns: {
          A: { type: 'sequence', start: 1, increment: 1 },
          B: { type: 'names', style: 'english' },
          C: { type: 'email' },
        },
        description: 'Generate data for all columns',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(5);
      
      // Check all columns are filled
      result.data.rows.forEach((row, index) => {
        expect(row[0]).toBe(index + 1); // ID sequence
        expect(typeof row[1]).toBe('string'); // Name
        expect(row[2]).toMatch(/^user\d+@example\.com$/); // Email
      });
    });

    it('should handle mixed pattern types correctly', () => {
      const data = createMockExcelData({
        headers: ['No', 'Product', 'Price', 'Status'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:5' },
        patterns: {
          A: { type: 'sequence', start: 1, increment: 1 },
          B: { type: 'products' },
          C: { type: 'numbers', min: 10000, max: 100000 },
          D: { type: 'status', values: ['Available', 'Out of Stock'] },
        },
        description: 'Generate product data',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(4);
      
      result.data.rows.forEach((row, index) => {
        expect(row[0]).toBe(index + 1);
        expect(typeof row[1]).toBe('string');
        expect(typeof row[2]).toBe('number');
        expect(row[2]).toBeGreaterThanOrEqual(10000);
        expect(row[2]).toBeLessThanOrEqual(100000);
        expect(['Available', 'Out of Stock']).toContain(row[3]);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty data with no headers', () => {
      const data = createMockExcelData({
        headers: [],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Fill to row 3',
      };

      const changes = generateChangesFromAction(data, action);

      // Should not generate anything without headers
      expect(changes).toHaveLength(0);
    });

    it('should handle missing target and patterns gracefully', () => {
      const data = createMockExcelData({
        headers: ['Name'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        params: {},
        description: 'Generate some data', // No clear pattern
      };

      const changes = generateChangesFromAction(data, action);

      // Should return empty changes if cannot extract pattern
      expect(changes).toHaveLength(0);
    });

    it('should handle single row generation', () => {
      const data = createMockExcelData({
        headers: ['No', 'Name'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:2' },
        patterns: {
          A: { type: 'sequence', start: 1, increment: 1 },
          B: { type: 'names', style: 'indonesian' },
        },
        description: 'Generate single row',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(1);
      expect(result.data.rows[0][0]).toBe(1);
      expect(typeof result.data.rows[0][1]).toBe('string');
    });

    it('should handle large row ranges efficiently', () => {
      const data = createMockExcelData({
        headers: ['ID', 'Name'],
        rows: [],
      });

      const action: AIAction = {
        type: 'GENERATE_DATA',
        target: { type: 'range', ref: '2:101' }, // 100 rows
        patterns: {
          A: { type: 'sequence', start: 1, increment: 1 },
          B: { type: 'names', style: 'english' },
        },
        description: 'Generate 100 rows',
      };

      const changes = generateChangesFromAction(data, action);
      const result = applyChanges(data, changes);

      expect(result.data.rows).toHaveLength(100);
      expect(result.data.rows[0][0]).toBe(1);
      expect(result.data.rows[99][0]).toBe(100);
    });
  });
});

import { describe, it, expect } from "vitest";
import { excelDataFactory, dataChangeFactory } from "@/test/factories/excel";
import {
  cloneExcelData,
  getCellValue,
  setCellValue,
  setCellFormula,
  addColumn,
  deleteColumn,
  deleteRows,
  findReplace,
  removeEmptyRows,
  sortData,
  removeDuplicates,
  fillDown,
} from "@/utils/excelOperations";
import {
  createCellRef,
  parseCellRef,
  getColumnIndex,
  getColumnLetter,
} from "@/types/excel";

describe("excelOperations", () => {
  describe("cloneExcelData", () => {
    it("should create a deep copy of ExcelData", () => {
      const original = excelDataFactory.create();
      const clone = cloneExcelData(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.rows).not.toBe(original.rows);
      expect(clone.headers).not.toBe(original.headers);
    });

    it("should not mutate original when modifying clone", () => {
      const original = excelDataFactory.create();
      const clone = cloneExcelData(original);

      clone.rows[0][0] = "modified";

      expect(original.rows[0][0]).toBe(1);
      expect(clone.rows[0][0]).toBe("modified");
    });
  });

  describe("getCellValue", () => {
    it("should return cell value at valid position", () => {
      const data = excelDataFactory.create();
      expect(getCellValue(data, 0, 0)).toBe(1);
      expect(getCellValue(data, 1, 1)).toBe(5);
    });

    it("should return null for out of bounds", () => {
      const data = excelDataFactory.create();
      expect(getCellValue(data, -1, 0)).toBeNull();
      expect(getCellValue(data, 0, -1)).toBeNull();
      expect(getCellValue(data, 100, 0)).toBeNull();
      expect(getCellValue(data, 0, 100)).toBeNull();
    });
  });

  describe("setCellValue", () => {
    it("should set value at cell position", () => {
      const data = excelDataFactory.create();
      const { data: newData, change } = setCellValue(data, 0, 0, "new value");

      expect(newData.rows[0][0]).toBe("new value");
      expect(change.cellRef).toBe("A2");
      expect(change.before).toBe(1);
      expect(change.after).toBe("new value");
    });

    it("should handle null values", () => {
      const data = excelDataFactory.create();
      const { data: newData } = setCellValue(data, 0, 0, null);

      expect(newData.rows[0][0]).toBeNull();
    });
  });

  describe("setCellFormula", () => {
    it("should set formula at cell position", () => {
      const data = excelDataFactory.create();
      const { data: newData, change } = setCellFormula(data, 0, 0, "=SUM(A1:A3)");

      expect(newData.formulas["A2"]).toBe("=SUM(A1:A3)");
      expect(change.type).toBe("formula");
    });

    it("should overwrite existing formula", () => {
      let data = excelDataFactory.create();
      data = setCellFormula(data, 0, 0, "=OLD()").data;
      const { data: newData } = setCellFormula(data, 0, 0, "=NEW()");

      expect(newData.formulas["A2"]).toBe("=NEW()");
    });
  });

  describe("addColumn", () => {
    it("should add column at end with header", () => {
      const data = excelDataFactory.create();
      const { data: newData } = addColumn(data, "NewCol");

      expect(newData.headers).toHaveLength(4);
      expect(newData.headers[3]).toBe("NewCol");
      expect(newData.rows[0]).toHaveLength(4);
    });

    it("should fill new column with null values", () => {
      const data = excelDataFactory.create();
      const { data: newData } = addColumn(data, "NewCol");

      expect(newData.rows.every((row) => row[3] === null)).toBe(true);
    });
  });

  describe("deleteColumn", () => {
    it("should remove column at index", () => {
      const data = excelDataFactory.create();
      const { data: newData, changes } = deleteColumn(data, 1);

      expect(newData.headers).toHaveLength(2);
      expect(newData.headers).not.toContain("B");
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe("deleteRows", () => {
    it("should remove rows at indices", () => {
      const data = excelDataFactory.create();
      const { data: newData, changes } = deleteRows(data, [0, 2]);

      expect(newData.rows).toHaveLength(1);
      expect(newData.rows[0][0]).toBe(4);
      expect(changes.length).toBeGreaterThan(0);
    });

    it("should handle empty indices array", () => {
      const data = excelDataFactory.create();
      const { data: newData } = deleteRows(data, []);

      expect(newData.rows).toHaveLength(3);
    });
  });

  describe("findReplace", () => {
    it("should replace text in cells", () => {
      const data = excelDataFactory.create({
        rows: [
          ["apple", "banana"],
          ["pineapple", "grape"],
        ],
      });
      const { data: newData, changes } = findReplace(data, "apple", "orange");

      expect(newData.rows[0][0]).toBe("orange");
      expect(newData.rows[1][0]).toBe("pineorange");
      expect(changes.length).toBe(2);
    });

    it("should respect column filter", () => {
      const data = excelDataFactory.create({
        rows: [
          ["apple", "apple"],
          ["apple", "apple"],
        ],
      });
      const { data: newData } = findReplace(data, "apple", "orange", { columns: [0] });

      expect(newData.rows[0][0]).toBe("orange");
      expect(newData.rows[0][1]).toBe("apple");
    });
  });

  describe("removeEmptyRows", () => {
    it("should remove rows with all null values", () => {
      const data = excelDataFactory.create({
        rows: [
          [1, 2, 3],
          [null, null, null],
          [4, 5, 6],
          [null, null, null],
        ],
      });
      const { data: newData, removedRows } = removeEmptyRows(data);

      expect(newData.rows).toHaveLength(2);
      expect(removedRows).toEqual([3, 5]); // Excel row numbers (1-indexed, data starts at row 2)
    });

    it("should handle empty strings as empty", () => {
      const data = excelDataFactory.create({
        rows: [
          [1, 2, 3],
          ["", "", ""],
        ],
      });
      const { data: newData } = removeEmptyRows(data);

      expect(newData.rows).toHaveLength(1);
    });
  });

  describe("sortData", () => {
    it("should sort by column ascending", () => {
      const data = excelDataFactory.create({
        rows: [
          [3, "c"],
          [1, "a"],
          [2, "b"],
        ],
      });
      const { data: newData } = sortData(data, 0, "asc");

      expect(newData.rows[0][0]).toBe(1);
      expect(newData.rows[1][0]).toBe(2);
      expect(newData.rows[2][0]).toBe(3);
    });

    it("should sort by column descending", () => {
      const data = excelDataFactory.create({
        rows: [
          [1, "a"],
          [3, "c"],
          [2, "b"],
        ],
      });
      const { data: newData } = sortData(data, 0, "desc");

      expect(newData.rows[0][0]).toBe(3);
      expect(newData.rows[1][0]).toBe(2);
      expect(newData.rows[2][0]).toBe(1);
    });
  });

  describe("removeDuplicates", () => {
    it("should remove duplicate rows", () => {
      const data = excelDataFactory.create({
        rows: [
          [1, 2, 3],
          [4, 5, 6],
          [1, 2, 3], // duplicate
        ],
      });
      const { data: newData, removedCount } = removeDuplicates(data);

      expect(newData.rows).toHaveLength(2);
      expect(removedCount).toBe(1);
    });

    it("should preserve first occurrence", () => {
      const data = excelDataFactory.create({
        rows: [
          ["first", 2],
          ["second", 2],
          ["first", 2], // duplicate
        ],
      });
      const { data: newData } = removeDuplicates(data);

      expect(newData.rows[0][0]).toBe("first");
      expect(newData.rows[1][0]).toBe("second");
    });
  });

  describe("fillDown", () => {
    it("should fill down values in column", () => {
      const data = excelDataFactory.create({
        rows: [
          [1, "a"],
          [null, null],
          [null, null],
        ],
      });
      const { data: newData, changes } = fillDown(data, 0);

      expect(newData.rows[1][0]).toBe(1);
      expect(newData.rows[2][0]).toBe(1);
      expect(changes).toHaveLength(2);
    });

    it("should not overwrite existing values", () => {
      const data = excelDataFactory.create({
        rows: [
          [1, "a"],
          [2, "b"],
          [null, null],
        ],
      });
      const { data: newData } = fillDown(data, 0);

      expect(newData.rows[1][0]).toBe(2); // preserved
      expect(newData.rows[2][0]).toBe(2); // filled
    });
  });

  describe("cell reference utilities", () => {
    describe("createCellRef", () => {
      it("should create correct cell references", () => {
        expect(createCellRef(0, 0)).toBe("A2");
        expect(createCellRef(1, 0)).toBe("B2");
        expect(createCellRef(0, 1)).toBe("A3");
        expect(createCellRef(25, 0)).toBe("Z2");
        expect(createCellRef(26, 0)).toBe("AA2");
      });
    });

    describe("parseCellRef", () => {
      it("should parse cell references correctly", () => {
        expect(parseCellRef("A2")).toEqual({ col: 0, row: 0, excelRow: 2 });
        expect(parseCellRef("B3")).toEqual({ col: 1, row: 1, excelRow: 3 });
        expect(parseCellRef("AA1")).toEqual({ col: 26, row: -1, excelRow: 1 });
      });

      it("should return null for invalid references", () => {
        expect(parseCellRef("invalid")).toBeNull();
        expect(parseCellRef("")).toBeNull();
      });
    });

    describe("getColumnIndex / getColumnLetter", () => {
      it("should convert between index and letter", () => {
        expect(getColumnIndex("A")).toBe(0);
        expect(getColumnIndex("Z")).toBe(25);
        expect(getColumnIndex("AA")).toBe(26);

        expect(getColumnLetter(0)).toBe("A");
        expect(getColumnLetter(25)).toBe("Z");
        expect(getColumnLetter(26)).toBe("AA");
      });

      it("should be reversible", () => {
        for (let i = 0; i < 100; i++) {
          const letter = getColumnLetter(i);
          expect(getColumnIndex(letter)).toBe(i);
        }
      });
    });
  });
});

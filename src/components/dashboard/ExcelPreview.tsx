import React, { useEffect, useRef, memo } from 'react';
import Spreadsheet from 'x-data-spreadsheet';
import 'x-data-spreadsheet/dist/xspreadsheet.css';
import {
  ExcelData,
  XSpreadsheetSheet,
  XSpreadsheetCell,
  XSpreadsheetStyle,
  CellValue,
  createCellRef,
} from '@/types/excel';

interface ExcelPreviewProps {
  data: ExcelData;
  onDataChange: (data: XSpreadsheetSheet[]) => void;
}

const SPARE_COL_COUNT = 5;
const SPARE_ROW_COUNT = 10;
const PENDING_CHANGE_BG = 'rgba(255, 255, 0, 0.3)';

// This interface is specific to the structure x-spreadsheet expects for its row data.
interface XSpreadsheetRowsObject {
  len: number;
  [key: number]: { cells: { [key: number]: XSpreadsheetCell } };
}

// This function converts our app's data format to the x-spreadsheet format
const convertToXlsxData = (excelData: ExcelData): XSpreadsheetSheet[] => {
  const headers = Array.isArray(excelData.headers) ? excelData.headers : [];
  const rowsData = Array.isArray(excelData.rows) ? excelData.rows : [];

  const totalRows = rowsData.length + SPARE_ROW_COUNT + 1;
  const totalCols = headers.length + SPARE_COL_COUNT;
  const rows: XSpreadsheetRowsObject = { len: totalRows };
  const sheetStyles: XSpreadsheetStyle[] = [];
  const styleMap = new Map<string, number>();

  const getStyleIndex = (styleObj: XSpreadsheetStyle | undefined | null): number | undefined => {
    if (!styleObj || Object.keys(styleObj).length === 0) return undefined;
    const styleKey = JSON.stringify(styleObj);
    if (styleMap.has(styleKey)) return styleMap.get(styleKey);
    const index = sheetStyles.length;
    sheetStyles.push(styleObj);
    styleMap.set(styleKey, index);
    return index;
  };

  const pendingChangeMap = new Map<string, CellValue>();
  (excelData.pendingChanges || []).forEach((change) => {
    pendingChangeMap.set(createCellRef(change.col, change.row), change.newValue);
  });

  const headerStyleIndex = getStyleIndex({
    color: '#000',
    bgcolor: '#f4f4f4',
    align: 'center',
    valign: 'middle',
    font: { bold: true },
  });
  const headerCells: { [key: number]: XSpreadsheetCell } = {};
  for (let i = 0; i < totalCols; i++) {
    headerCells[i] = { text: headers[i] || '', style: headerStyleIndex };
  }
  rows[0] = { cells: headerCells };

  for (let r = 0; r < rowsData.length; r++) {
    const row = rowsData[r];
    const cells: { [key: number]: XSpreadsheetCell } = {};
    for (let c = 0; c < headers.length; c++) {
      const cellRef = createCellRef(c, r);
      const isPending = pendingChangeMap.has(cellRef);
      const displayValue = isPending ? pendingChangeMap.get(cellRef) : row ? row[c] : '';
      const originalStyle = excelData.cellStyles?.[cellRef];
      let finalStyleIndex;
      if (isPending) {
        const combinedStyle: XSpreadsheetStyle = {
          ...(originalStyle || {}),
          bgcolor: PENDING_CHANGE_BG,
        };
        finalStyleIndex = getStyleIndex(combinedStyle);
      } else {
        finalStyleIndex = getStyleIndex(originalStyle);
      }
      cells[c] = { text: String(displayValue ?? ''), style: finalStyleIndex };
    }
    rows[r + 1] = { cells };
  }

  return [
    {
      name: excelData.currentSheet || 'Sheet1',
      freeze: 'A2',
      styles: sheetStyles,
      cols: {
        len: totalCols,
        ...headers.reduce(
          (acc, _, index) => ({
            ...acc,
            [index]: { width: excelData.columnWidths?.[index] || 120 },
          }),
          {}
        ),
      },
      rows,
    },
  ];
};

const ExcelPreview: React.FC<ExcelPreviewProps> = ({ data, onDataChange }) => {
  const spreadsheetRef = useRef<HTMLDivElement>(null);
  const spreadsheetInstance = useRef<Spreadsheet | null>(null);

  useEffect(() => {
    if (spreadsheetRef.current && data) {
      if (spreadsheetInstance.current) {
        spreadsheetInstance.current.destroy();
      }

      spreadsheetRef.current.innerHTML = '';

      const options = {
        mode: 'edit' as const,
        showToolbar: true,
        showGrid: true,
        showContextmenu: true,
        view: {
          height: () => spreadsheetRef.current?.parentElement?.clientHeight || 600,
          width: () => spreadsheetRef.current?.parentElement?.clientWidth || 800,
        },
        row: { len: (data.rows?.length || 0) + SPARE_ROW_COUNT + 1, height: 25 },
        col: {
          len: (data.headers?.length || 0) + SPARE_COL_COUNT,
          width: 100,
          indexWidth: 60,
          minWidth: 60,
        },
        locale: 'en' as const,
      };

      const spreadsheet = new Spreadsheet(spreadsheetRef.current, options);
      spreadsheet.change(onDataChange);
      spreadsheetInstance.current = spreadsheet;

      const formattedData = convertToXlsxData(data);
      if (formattedData) {
        spreadsheet.loadData(formattedData);
      }
    }
  }, [data, onDataChange]);

  return <div ref={spreadsheetRef} style={{ width: '100%', height: '100%' }} />;
};

export default memo(ExcelPreview);

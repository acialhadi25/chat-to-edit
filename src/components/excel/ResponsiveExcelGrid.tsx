import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useGesture } from "@use-gesture/react";
import { ExcelData, createCellRef } from "@/types/excel";
import { cn } from "@/lib/utils";

interface ResponsiveExcelGridProps {
  data: ExcelData;
  onCellChange: (col: number, row: number, value: string | number | null) => void;
  onCellSelect?: (cellRefs: string[]) => void;
  selectedCells?: string[];
  isMobile?: boolean;
  className?: string;
}

const MOBILE_ROW_HEIGHT = 48;
const DESKTOP_ROW_HEIGHT = 32;
const MOBILE_COL_WIDTH = 120;
const DESKTOP_COL_WIDTH = 100;

export function ResponsiveExcelGrid({
  data,
  onCellChange,
  onCellSelect,
  selectedCells = [],
  isMobile = false,
  className,
}: ResponsiveExcelGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ col: number; row: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rowHeight = isMobile ? MOBILE_ROW_HEIGHT : DESKTOP_ROW_HEIGHT;
  const colWidth = isMobile ? MOBILE_COL_WIDTH : DESKTOP_COL_WIDTH;

  // Optimized virtual scrolling for rows
  // Higher overscan for smoother scrolling, especially on mobile
  const rowVirtualizer = useVirtualizer({
    count: data.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: isMobile ? 10 : 8, // More overscan on mobile for smoother touch scrolling
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  // Optimized virtual scrolling for columns
  // Lower overscan for columns since horizontal scrolling is less frequent
  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: data.headers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => colWidth, [colWidth]),
    overscan: isMobile ? 5 : 4, // Slightly more overscan on mobile
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().width
        : undefined,
  });

  // Touch gestures for mobile
  const bind = useGesture(
    {
      onPinch: ({ offset: [scale] }) => {
        if (isMobile) {
          setScale(Math.max(0.5, Math.min(2, scale)));
        }
      },
      onDrag: ({ movement: [mx, my], pinching, cancel }) => {
        if (pinching) return cancel();
        if (isMobile && scale > 1) {
          setOffset({ x: mx, y: my });
        }
      },
    },
    {
      drag: { from: () => [offset.x, offset.y] },
      pinch: { scaleBounds: { min: 0.5, max: 2 }, rubberband: true },
    }
  );

  const selectedCellSet = useMemo(() => new Set(selectedCells), [selectedCells]);

  const handleCellClick = useCallback(
    (col: number, row: number) => {
      const cellRef = createCellRef(col, row);
      if (onCellSelect) {
        onCellSelect([cellRef]);
      }
    },
    [onCellSelect]
  );

  const handleCellDoubleClick = useCallback(
    (col: number, row: number) => {
      const value = data.rows[row]?.[col];
      setEditingCell({ col, row });
      setEditValue(value?.toString() || "");
    },
    [data.rows]
  );

  const handleCellLongPress = useCallback(
    (col: number, row: number) => {
      if (isMobile) {
        handleCellDoubleClick(col, row);
      }
    },
    [isMobile, handleCellDoubleClick]
  );

  const handleEditCommit = useCallback(() => {
    if (editingCell) {
      const numValue = Number(editValue);
      const finalValue = isNaN(numValue) ? editValue : numValue;
      onCellChange(editingCell.col, editingCell.row, finalValue);
      setEditingCell(null);
      setEditValue("");
    }
  }, [editingCell, editValue, onCellChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleEditCommit();
      } else if (e.key === "Escape") {
        setEditingCell(null);
        setEditValue("");
      }
    },
    [handleEditCommit]
  );

  const getCellValue = (col: number, row: number): string => {
    const cellRef = createCellRef(col, row);
    const formula = data.formulas?.[cellRef];
    
    if (formula) {
      return formula;
    }
    
    const value = data.rows[row]?.[col];
    return value?.toString() || "";
  };

  // Handle scroll events to show loading indicator
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      setIsScrolling(true);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={parentRef}
      {...(isMobile ? bind() : {})}
      className={cn(
        "excel-grid overflow-auto border rounded-lg bg-white relative",
        isMobile && "touch-pan-y touch-pan-x",
        className
      )}
      style={{
        height: "600px",
        touchAction: isMobile ? "none" : "auto",
      }}
    >
      {/* Loading indicator during scroll */}
      {isScrolling && (
        <div className="absolute top-2 right-2 z-30 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      )}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${colVirtualizer.getTotalSize()}px`,
          position: "relative",
          transform: isMobile ? `scale(${scale}) translate(${offset.x}px, ${offset.y}px)` : undefined,
          transformOrigin: "top left",
        }}
      >
        {/* Header Row */}
        <div
          className="sticky top-0 z-20 bg-gray-100 border-b flex"
          style={{ height: rowHeight }}
        >
          {colVirtualizer.getVirtualItems().map((virtualCol) => (
            <div
              key={virtualCol.key}
              className="border-r flex items-center justify-center font-semibold text-sm"
              style={{
                position: "absolute",
                left: 0,
                width: `${virtualCol.size}px`,
                transform: `translateX(${virtualCol.start}px)`,
                height: rowHeight,
              }}
            >
              {data.headers[virtualCol.index]}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="flex"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start + rowHeight}px)`,
            }}
          >
            {colVirtualizer.getVirtualItems().map((virtualCol) => {
              const col = virtualCol.index;
              const row = virtualRow.index;
              const cellRef = createCellRef(col, row);
              const isSelected = selectedCellSet.has(cellRef);
              const isEditing = editingCell?.col === col && editingCell?.row === row;
              const cellValue = getCellValue(col, row);

              return (
                <div
                  key={`${virtualRow.key}-${virtualCol.key}`}
                  className={cn(
                    "border-r border-b flex items-center px-2 cursor-pointer",
                    "hover:bg-blue-50 transition-colors",
                    isSelected && "bg-blue-100 ring-2 ring-blue-500",
                    isMobile && "min-h-[44px]" // iOS HIG minimum touch target
                  )}
                  style={{
                    position: "absolute",
                    left: 0,
                    width: `${virtualCol.size}px`,
                    height: `${virtualRow.size}px`,
                    transform: `translateX(${virtualCol.start}px)`,
                  }}
                  onClick={() => handleCellClick(col, row)}
                  onDoubleClick={() => handleCellDoubleClick(col, row)}
                  onTouchStart={(e) => {
                    if (isMobile) {
                      const timer = setTimeout(() => {
                        handleCellLongPress(col, row);
                      }, 500);
                      e.currentTarget.dataset.timer = timer.toString();
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (isMobile && e.currentTarget.dataset.timer) {
                      clearTimeout(Number(e.currentTarget.dataset.timer));
                    }
                  }}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleEditCommit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className={cn(
                        "w-full h-full px-1 outline-none bg-white",
                        isMobile && "text-base" // Prevent zoom on iOS
                      )}
                      style={{ fontSize: isMobile ? "16px" : "14px" }}
                    />
                  ) : (
                    <span className="truncate text-sm">{cellValue}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

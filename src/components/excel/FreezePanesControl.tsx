import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Snowflake, X } from "lucide-react";

interface FreezePanesControlProps {
  frozenRows: number;
  frozenColumns: number;
  onFreeze: (rows: number, columns: number) => void;
  maxRows?: number;
  maxColumns?: number;
}

export function FreezePanesControl({
  frozenRows,
  frozenColumns,
  onFreeze,
  maxRows = 10,
  maxColumns = 5,
}: FreezePanesControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasFrozenPanes = frozenRows > 0 || frozenColumns > 0;

  const handleFreeze = (rows: number, columns: number) => {
    onFreeze(rows, columns);
    setIsOpen(false);
  };

  const handleUnfreeze = () => {
    onFreeze(0, 0);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasFrozenPanes ? "default" : "outline"}
          size="sm"
          className="gap-2"
        >
          <Snowflake className="h-4 w-4" />
          {hasFrozenPanes
            ? `Frozen: ${frozenRows}R, ${frozenColumns}C`
            : "Freeze Panes"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Freeze Panes</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {hasFrozenPanes && (
          <>
            <DropdownMenuItem onClick={handleUnfreeze} className="text-red-600">
              <X className="mr-2 h-4 w-4" />
              Unfreeze All
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Freeze Rows
        </DropdownMenuLabel>
        {[1, 2, 3, 5].map((rows) => (
          <DropdownMenuItem
            key={`rows-${rows}`}
            onClick={() => handleFreeze(rows, frozenColumns)}
            className={frozenRows === rows && frozenColumns === frozenColumns ? "bg-accent" : ""}
          >
            First {rows} row{rows > 1 ? "s" : ""}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Freeze Columns
        </DropdownMenuLabel>
        {[1, 2, 3].map((cols) => (
          <DropdownMenuItem
            key={`cols-${cols}`}
            onClick={() => handleFreeze(frozenRows, cols)}
            className={frozenColumns === cols && frozenRows === frozenRows ? "bg-accent" : ""}
          >
            First {cols} column{cols > 1 ? "s" : ""}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Common Presets
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleFreeze(1, 1)}>
          1 Row + 1 Column
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFreeze(1, 2)}>
          1 Row + 2 Columns
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFreeze(2, 1)}>
          2 Rows + 1 Column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

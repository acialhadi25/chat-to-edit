import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Undo2, Redo2 } from "lucide-react";

interface UndoRedoBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  undoDescription: string | null;
  redoDescription: string | null;
}

const UndoRedoBar = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  undoDescription,
  redoDescription,
}: UndoRedoBarProps) => {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-4 py-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {canUndo ? `Undo: ${undoDescription}` : "Tidak ada yang bisa di-undo"}
          <span className="ml-2 text-muted-foreground">Ctrl+Z</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {canRedo ? `Redo: ${redoDescription}` : "Tidak ada yang bisa di-redo"}
          <span className="ml-2 text-muted-foreground">Ctrl+Y</span>
        </TooltipContent>
      </Tooltip>

      <div className="ml-2 text-xs text-muted-foreground">
        {canUndo && undoDescription && (
          <span>Terakhir: {undoDescription}</span>
        )}
      </div>
    </div>
  );
};

export default UndoRedoBar;

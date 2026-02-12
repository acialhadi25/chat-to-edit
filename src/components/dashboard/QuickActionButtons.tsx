import { Button } from "@/components/ui/button";
import { QuickOption, AIAction } from "@/types/excel";
import { Check, X, MousePointer } from "lucide-react";

interface QuickActionButtonsProps {
  options: QuickOption[];
  onSelect: (option: QuickOption) => void;
  action?: AIAction;
  onApply?: (action: AIAction) => void;
  onReject?: () => void;
  disabled?: boolean;
}

const QuickActionButtons = ({
  options,
  onSelect,
  action,
  onApply,
  onReject,
  disabled,
}: QuickActionButtonsProps) => {
  const getVariant = (variant: QuickOption["variant"]) => {
    switch (variant) {
      case "success":
        return "default";
      case "destructive":
        return "destructive";
      case "outline":
        return "outline";
      default:
        return "secondary";
    }
  };

   // Check if option should trigger apply action
   const shouldApply = (option: QuickOption): boolean => {
     // Use explicit flag if provided
     if (option.isApplyAction !== undefined) {
       return option.isApplyAction;
     }
     
     // Fallback: check common patterns in multiple languages
     const applyPatterns = [
       "terapkan", "apply", "ganti", "hapus semua", "bersihkan",
       "ya,", "yes,", "execute", "run", "confirm", "ok", "lakukan"
     ];
     const lowerValue = option.value.toLowerCase();
     const lowerLabel = option.label.toLowerCase();
     
     return option.variant === "success" || applyPatterns.some(p => 
       lowerValue.includes(p) || lowerLabel.includes(p)
     );
   };

  const handleOptionClick = (option: QuickOption) => {
     // If this is an apply type action
     if (action && onApply && shouldApply(option)) {
       // Confirm destructive actions before applying
       if (option.variant === "destructive") {
         if (!window.confirm(`This will apply: "${option.label}". Continue?`)) {
           return;
         }
       }
      onApply(action);
    } else {
      onSelect(option);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.id}
          variant={getVariant(option.variant)}
          size="sm"
          onClick={() => handleOptionClick(option)}
          disabled={disabled}
          className="text-xs"
        >
           {(option.variant === "success" || option.isApplyAction) && <Check className="mr-1 h-3 w-3" />}
          {option.label.toLowerCase().includes("pilih") && (
            <MousePointer className="mr-1 h-3 w-3" />
          )}
          {option.label}
        </Button>
      ))}

      {action && action.type !== "CLARIFY" && action.type !== "INFO" && onReject && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={disabled}
          className="text-xs text-muted-foreground"
        >
          <X className="mr-1 h-3 w-3" />
          Batalkan
        </Button>
      )}
    </div>
  );
};

export default QuickActionButtons;

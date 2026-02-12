import { Button } from "@/components/ui/button";
import { QuickOption, AIAction } from "@/types/excel";
import { Check, X, MousePointer } from "lucide-react";

interface QuickActionButtonsProps {
  options: QuickOption[];
  appliedActionIds?: string[];
  onOptionClick: (text: string, action?: AIAction, actionId?: string) => void;
  disabled?: boolean;
}

const QuickActionButtons = ({
  options,
  appliedActionIds = [],
  onOptionClick,
  disabled,
}: QuickActionButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isApplied = appliedActionIds.includes(option.id);

        return (
          <Button
            key={option.id}
            size="sm"
            disabled={disabled || isApplied}
            onClick={() => onOptionClick(option.value, option.action, option.id)}
            className={`text-xs h-8 px-3 transition-all duration-300 border-none ${isApplied
                ? "bg-green-600 hover:bg-green-600 text-white opacity-90 cursor-default"
                : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
          >
            {isApplied ? (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              (option.variant === "success" || option.isApplyAction) && <Zap className="mr-1.5 h-3 w-3 fill-current" />
            )}

            {option.label.toLowerCase().includes("pilih") && !isApplied && (
              <MousePointer className="mr-1.5 h-3 w-3" />
            )}

            {option.label}

            {isApplied && <Check className="ml-1.5 h-3.5 w-3.5" />}
          </Button>
        );
      })}
    </div>
  );
};

import { Zap } from "lucide-react";
export default QuickActionButtons;

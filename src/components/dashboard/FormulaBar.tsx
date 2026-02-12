import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { FunctionSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FormulaBarProps {
    selectedCell: string; // e.g., "A1"
    value: string; // The raw value or formula
    onChange: (newValue: string) => void;
    onCommit: () => void;
    disabled?: boolean;
}

const FormulaBar: React.FC<FormulaBarProps> = ({
    selectedCell,
    value,
    onChange,
    onCommit,
    disabled = false,
}) => {
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with prop value when it changes externally (e.g., clicking a different cell)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onCommit();
            inputRef.current?.blur();
        } else if (e.key === "Escape") {
            setLocalValue(value); // Reset to original
            inputRef.current?.blur();
        }
    };

    const handleBlur = () => {
        if (localValue !== value) {
            onCommit();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(newValue);
    };

    return (
        <div className="flex items-center gap-0 w-full h-10 border-b border-border bg-card px-2 overflow-hidden shadow-sm">
            {/* Name Box */}
            <div className="flex items-center justify-center min-w-[60px] h-7 px-2 font-mono text-sm text-muted-foreground bg-background border border-border rounded-l select-none">
                {selectedCell || ""}
            </div>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* fx Icon */}
            <div className="flex items-center justify-center w-8 h-8 text-primary/70">
                <FunctionSquare className="h-4.5 w-4.5" />
            </div>

            {/* Formula Input */}
            <div className="flex-1 h-full flex items-center px-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={localValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    disabled={disabled || !selectedCell}
                    placeholder={selectedCell ? "Enter value or =formula..." : "Select a cell to edit"}
                    className="w-full h-7 bg-transparent border-none outline-none text-sm font-medium px-2 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded transition-all disabled:opacity-50"
                />
            </div>
        </div>
    );
};

export default FormulaBar;

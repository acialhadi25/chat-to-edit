/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts for the application
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation
  { keys: ['Tab'], description: 'Navigate to next element', category: 'Navigation' },
  { keys: ['Shift', 'Tab'], description: 'Navigate to previous element', category: 'Navigation' },
  { keys: ['Escape'], description: 'Close modal or cancel selection', category: 'Navigation' },
  { keys: ['Enter'], description: 'Confirm action or submit form', category: 'Navigation' },

  // Editing
  { keys: ['Ctrl', 'Z'], description: 'Undo last action', category: 'Editing' },
  { keys: ['Ctrl', 'Y'], description: 'Redo last action', category: 'Editing' },
  {
    keys: ['Ctrl', 'Shift', 'Z'],
    description: 'Redo last action (alternative)',
    category: 'Editing',
  },
  { keys: ['Ctrl', 'S'], description: 'Save/Download file', category: 'Editing' },

  // Excel Grid
  { keys: ['Arrow Keys'], description: 'Navigate between cells', category: 'Excel Grid' },
  { keys: ['Enter'], description: 'Edit selected cell', category: 'Excel Grid' },
  { keys: ['Escape'], description: 'Cancel cell editing', category: 'Excel Grid' },
  { keys: ['Tab'], description: 'Move to next cell', category: 'Excel Grid' },
  { keys: ['Shift', 'Tab'], description: 'Move to previous cell', category: 'Excel Grid' },

  // Chat
  { keys: ['Ctrl', 'Enter'], description: 'Send message', category: 'Chat' },
  { keys: ['Ctrl', 'F'], description: 'Search chat history', category: 'Chat' },
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        aria-describedby="keyboard-shortcuts-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description">
            Use these keyboard shortcuts to navigate and interact with the application more
            efficiently.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Press{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-background border border-border rounded">
              ?
            </kbd>{' '}
            at any time to view this help dialog.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

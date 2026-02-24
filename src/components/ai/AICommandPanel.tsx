/**
 * AI Command Panel Component
 * 
 * Displays command suggestions and examples for AI chat interface.
 * Helps users discover available commands and proper syntax.
 * 
 * Requirements: 2.3.6, 2.3.7
 * Documentation: docs/univer/core/general-api.md
 */

import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, Palette, Calculator, Filter, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface AICommandPanelProps {
  onSuggestionClick: (suggestion: string) => void;
  currentInput: string;
}

interface CommandCategory {
  name: string;
  icon: React.ReactNode;
  commands: CommandSuggestion[];
}

interface CommandSuggestion {
  command: string;
  description: string;
  example: string;
  destructive?: boolean;
}

/**
 * AI Command Panel Component
 * 
 * Features:
 * - Categorized command suggestions
 * - Context-aware filtering
 * - Visual command examples
 * - Destructive operation warnings
 */
export const AICommandPanel: React.FC<AICommandPanelProps> = ({
  onSuggestionClick,
  currentInput,
}) => {
  /**
   * Command categories with suggestions
   */
  const commandCategories: CommandCategory[] = useMemo(() => [
    {
      name: 'Read Operations',
      icon: <TrendingUp className="h-4 w-4" />,
      commands: [
        {
          command: 'Get value of [cell]',
          description: 'Read a cell value',
          example: 'Get value of A1',
        },
        {
          command: 'Read range [range]',
          description: 'Read multiple cells',
          example: 'Read range A1:B10',
        },
        {
          command: 'Analyze data in [range]',
          description: 'Get statistics and insights',
          example: 'Analyze data in A1:D100',
        },
      ],
    },
    {
      name: 'Write Operations',
      icon: <Calculator className="h-4 w-4" />,
      commands: [
        {
          command: 'Set [cell] to [value]',
          description: 'Set a cell value',
          example: 'Set A1 to 100',
        },
        {
          command: 'Calculate [formula] in [cell]',
          description: 'Set a formula',
          example: 'Calculate sum of A1:A10 in A11',
        },
        {
          command: 'Fill [range] with [value]',
          description: 'Fill multiple cells',
          example: 'Fill A1:A10 with 0',
        },
      ],
    },
    {
      name: 'Formatting',
      icon: <Palette className="h-4 w-4" />,
      commands: [
        {
          command: 'Format [range] as [format]',
          description: 'Apply number formatting',
          example: 'Format B1:B10 as currency',
        },
        {
          command: 'Make [range] bold',
          description: 'Apply text formatting',
          example: 'Make A1:A5 bold',
        },
        {
          command: 'Color [range] red',
          description: 'Apply color formatting',
          example: 'Color C1:C10 red',
        },
      ],
    },
    {
      name: 'Data Operations',
      icon: <Filter className="h-4 w-4" />,
      commands: [
        {
          command: 'Sort [range] by column [column]',
          description: 'Sort data',
          example: 'Sort A1:C10 by column A',
        },
        {
          command: 'Filter [range] where [criteria]',
          description: 'Filter data',
          example: 'Filter A1:C10 where column A > 100',
        },
        {
          command: 'Find [text] and replace with [text] in [range]',
          description: 'Find and replace',
          example: 'Find "old" and replace with "new" in A1:Z100',
          destructive: true,
        },
      ],
    },
    {
      name: 'Charts',
      icon: <BarChart3 className="h-4 w-4" />,
      commands: [
        {
          command: 'Create [type] chart from [range]',
          description: 'Create a chart',
          example: 'Create line chart from A1:B10',
        },
        {
          command: 'Create pie chart from [range]',
          description: 'Create a pie chart',
          example: 'Create pie chart from A1:B5',
        },
        {
          command: 'Create bar chart from [range]',
          description: 'Create a bar chart',
          example: 'Create bar chart from A1:C10',
        },
      ],
    },
  ], []);

  /**
   * Filter suggestions based on current input
   */
  const filteredCategories = useMemo(() => {
    if (!currentInput.trim()) {
      return commandCategories;
    }

    const searchTerm = currentInput.toLowerCase();
    
    return commandCategories
      .map(category => ({
        ...category,
        commands: category.commands.filter(cmd =>
          cmd.command.toLowerCase().includes(searchTerm) ||
          cmd.description.toLowerCase().includes(searchTerm) ||
          cmd.example.toLowerCase().includes(searchTerm)
        ),
      }))
      .filter(category => category.commands.length > 0);
  }, [currentInput, commandCategories]);

  /**
   * Get top suggestions (most relevant)
   */
  const topSuggestions = useMemo(() => {
    if (!currentInput.trim()) {
      // Show popular commands when no input
      return [
        'Set A1 to 100',
        'Calculate sum of A1:A10 in A11',
        'Format B1:B10 as currency',
        'Analyze data in A1:D100',
      ];
    }

    // Show filtered suggestions
    const allCommands = filteredCategories.flatMap(cat => cat.commands);
    return allCommands.slice(0, 4).map(cmd => cmd.example);
  }, [currentInput, filteredCategories]);

  return (
    <div className="space-y-3">
      {/* Quick Suggestions */}
      {topSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion)}
              className="text-xs"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      {/* Detailed Categories (only show when no input or filtered results) */}
      {currentInput.trim() === '' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {commandCategories.map((category, catIndex) => (
            <Card key={catIndex} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {category.icon}
                  <h3 className="text-sm font-semibold">{category.name}</h3>
                </div>
                
                <div className="space-y-2">
                  {category.commands.slice(0, 2).map((cmd, cmdIndex) => (
                    <button
                      key={cmdIndex}
                      onClick={() => onSuggestionClick(cmd.example)}
                      className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {cmd.description}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {cmd.example}
                          </p>
                        </div>
                        {cmd.destructive && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">
                            Caution
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtered Results */}
      {currentInput.trim() !== '' && filteredCategories.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {filteredCategories.reduce((sum, cat) => sum + cat.commands.length, 0)} matching commands
          </p>
          
          {filteredCategories.map((category, catIndex) => (
            <div key={catIndex} className="space-y-1">
              <div className="flex items-center gap-2">
                {category.icon}
                <h4 className="text-xs font-semibold">{category.name}</h4>
              </div>
              
              {category.commands.map((cmd, cmdIndex) => (
                <button
                  key={cmdIndex}
                  onClick={() => onSuggestionClick(cmd.example)}
                  className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{cmd.description}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {cmd.example}
                      </p>
                    </div>
                    {cmd.destructive && (
                      <Badge variant="destructive" className="text-xs flex-shrink-0">
                        Caution
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {currentInput.trim() !== '' && filteredCategories.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">No matching commands found</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

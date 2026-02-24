/**
 * Find and Replace Service for Univer Sheet Integration
 * 
 * Provides comprehensive find and replace capabilities including:
 * - Find all matches in a range or worksheet
 * - Find next/previous match
 * - Replace single or all occurrences
 * - Case-sensitive and whole cell matching options
 * - Formula text matching
 * 
 * Requirements: 4.2.3
 * @see https://docs.univer.ai/guides/sheets/features/find-replace
 */

import type { FUniver, FWorksheet, FRange } from '../types/univer.types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface FindOptions {
  matchCase?: boolean;
  matchEntireCell?: boolean;
  matchFormula?: boolean;
}

export interface FindResult {
  cell: FRange;
  row: number;
  column: number;
  value: any;
  address: string;
}

export interface ReplaceResult {
  count: number;
  replacedCells: FindResult[];
}

export interface FindReplaceState {
  searchText: string;
  options: FindOptions;
  matches: FindResult[];
  currentIndex: number;
}

// ============================================================================
// Find and Replace Service Class
// ============================================================================

export class FindReplaceService {
  private univerAPI: FUniver | null;
  private isReady: boolean;
  private currentState: FindReplaceState | null;

  constructor(univerAPI: FUniver | null, isReady: boolean) {
    this.univerAPI = univerAPI;
    this.isReady = isReady;
    this.currentState = null;
  }

  /**
   * Update the univerAPI instance
   */
  updateAPI(univerAPI: FUniver | null, isReady: boolean): void {
    this.univerAPI = univerAPI;
    this.isReady = isReady;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Get the active worksheet with validation
   */
  private getActiveWorksheet(): FWorksheet | null {
    if (!this.univerAPI || !this.isReady) {
      console.warn('Univer is not ready');
      return null;
    }

    const workbook = this.univerAPI.getActiveWorkbook();
    if (!workbook) {
      console.warn('No active workbook');
      return null;
    }

    const worksheet = workbook.getActiveSheet();
    if (!worksheet) {
      console.warn('No active worksheet');
      return null;
    }

    return worksheet;
  }

  /**
   * Validate range notation (A1 notation)
   */
  private validateRangeNotation(range: string): void {
    if (!range || typeof range !== 'string') {
      throw new Error('Range must be a non-empty string');
    }
    
    const rangePattern = /^([A-Z]+[0-9]+)(:[A-Z]+[0-9]+)?$|^[^!]+![A-Z]+[0-9]+(:[A-Z]+[0-9]+)?$/;
    if (!rangePattern.test(range)) {
      throw new Error(`Invalid range notation: ${range}. Use A1 notation (e.g., A1, A1:B10)`);
    }
  }

  /**
   * Validate search text
   */
  private validateSearchText(searchText: string): void {
    if (searchText === null || searchText === undefined) {
      throw new Error('Search text cannot be null or undefined');
    }
    
    if (typeof searchText !== 'string') {
      throw new Error('Search text must be a string');
    }
  }

  /**
   * Convert FRange to FindResult
   */
  private convertToFindResult(cell: FRange): FindResult {
    return {
      cell,
      row: cell.getRow(),
      column: cell.getColumn(),
      value: cell.getValue(),
      address: cell.getA1Notation()
    };
  }

  // ==========================================================================
  // Public API Methods - Find Operations
  // ==========================================================================

  /**
   * Find all occurrences of search text in a range
   * 
   * @param searchText - Text to search for
   * @param range - Optional A1 notation range (e.g., "A1:D10"). If not provided, searches entire sheet
   * @param options - Find options (matchCase, matchEntireCell, matchFormula)
   * @returns Promise<FindResult[]> - Array of found cells
   * 
   * @example
   * // Find all occurrences in entire sheet
   * const results = await findAll('hello');
   * 
   * // Find with case-sensitive matching
   * const results = await findAll('Hello', undefined, { matchCase: true });
   * 
   * // Find in specific range
   * const results = await findAll('test', 'A1:D10');
   * 
   * // Find exact cell matches
   * const results = await findAll('5', 'A1:D10', { matchEntireCell: true });
   */
  async findAll(
    searchText: string,
    range?: string,
    options: FindOptions = {}
  ): Promise<FindResult[]> {
    try {
      this.validateSearchText(searchText);
      
      if (range) {
        this.validateRangeNotation(range);
      }

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      // Create text finder using Univer's Facade API
      const textFinder = await this.univerAPI!.createTextFinderAsync(searchText);

      // Apply options
      if (options.matchCase) {
        await textFinder.matchCaseAsync(true);
      }
      if (options.matchEntireCell) {
        await textFinder.matchEntireCellAsync(true);
      }
      if (options.matchFormula) {
        await textFinder.matchFormulaTextAsync(true);
      }

      // Find all matches
      const matches = textFinder.findAll();

      // Convert to FindResult and filter by range if specified
      let results = matches.map(cell => this.convertToFindResult(cell));

      if (range) {
        // Parse range to get bounds
        const rangeObj = worksheet.getRange(range);
        const rangeRow = rangeObj.getRow();
        const rangeCol = rangeObj.getColumn();
        const rangeHeight = rangeObj.getHeight();
        const rangeWidth = rangeObj.getWidth();

        // Filter results to only include cells within the specified range
        results = results.filter(result => {
          return result.row >= rangeRow &&
                 result.row < rangeRow + rangeHeight &&
                 result.column >= rangeCol &&
                 result.column < rangeCol + rangeWidth;
        });
      }

      // Store state for navigation
      this.currentState = {
        searchText,
        options,
        matches: results,
        currentIndex: -1
      };

      return results;
    } catch (error) {
      console.error('Error finding text:', error);
      throw error;
    }
  }

  /**
   * Find next occurrence of search text
   * 
   * @param searchText - Text to search for
   * @param options - Find options
   * @returns Promise<FindResult | null> - Next found cell or null if not found
   * 
   * @example
   * // Find first occurrence
   * const first = await findNext('hello');
   * 
   * // Find next occurrence (continues from previous search)
   * const second = await findNext('hello');
   */
  async findNext(
    searchText: string,
    options: FindOptions = {}
  ): Promise<FindResult | null> {
    try {
      this.validateSearchText(searchText);

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      // Create text finder
      const textFinder = await this.univerAPI!.createTextFinderAsync(searchText);

      // Apply options
      if (options.matchCase) {
        await textFinder.matchCaseAsync(true);
      }
      if (options.matchEntireCell) {
        await textFinder.matchEntireCellAsync(true);
      }
      if (options.matchFormula) {
        await textFinder.matchFormulaTextAsync(true);
      }

      // Find next
      const cell = textFinder.findNext();
      
      if (!cell) {
        return null;
      }

      return this.convertToFindResult(cell);
    } catch (error) {
      console.error('Error finding next:', error);
      throw error;
    }
  }

  /**
   * Find previous occurrence of search text
   * 
   * @param searchText - Text to search for
   * @param options - Find options
   * @returns Promise<FindResult | null> - Previous found cell or null if not found
   * 
   * @example
   * const previous = await findPrevious('hello');
   */
  async findPrevious(
    searchText: string,
    options: FindOptions = {}
  ): Promise<FindResult | null> {
    try {
      this.validateSearchText(searchText);

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      // Create text finder
      const textFinder = await this.univerAPI!.createTextFinderAsync(searchText);

      // Apply options
      if (options.matchCase) {
        await textFinder.matchCaseAsync(true);
      }
      if (options.matchEntireCell) {
        await textFinder.matchEntireCellAsync(true);
      }
      if (options.matchFormula) {
        await textFinder.matchFormulaTextAsync(true);
      }

      // Find previous
      const cell = textFinder.findPrevious();
      
      if (!cell) {
        return null;
      }

      return this.convertToFindResult(cell);
    } catch (error) {
      console.error('Error finding previous:', error);
      throw error;
    }
  }

  /**
   * Find in specific range (convenience method)
   * 
   * @param searchText - Text to search for
   * @param range - A1 notation range (e.g., "A1:D10")
   * @param options - Find options
   * @returns Promise<FindResult[]> - Array of found cells
   * 
   * @example
   * const results = await findInRange('test', 'A1:D10');
   */
  async findInRange(
    searchText: string,
    range: string,
    options: FindOptions = {}
  ): Promise<FindResult[]> {
    return this.findAll(searchText, range, options);
  }

  // ==========================================================================
  // Public API Methods - Replace Operations
  // ==========================================================================

  /**
   * Replace all occurrences of search text with replacement text
   * 
   * @param searchText - Text to search for
   * @param replaceText - Text to replace with
   * @param range - Optional A1 notation range. If not provided, replaces in entire sheet
   * @param options - Find options
   * @returns Promise<ReplaceResult> - Replace result with count and replaced cells
   * 
   * @example
   * // Replace all in entire sheet
   * const result = await replaceAll('old', 'new');
   * console.log(`Replaced ${result.count} occurrences`);
   * 
   * // Replace with case-sensitive matching
   * const result = await replaceAll('Old', 'New', undefined, { matchCase: true });
   * 
   * // Replace in specific range
   * const result = await replaceAll('test', 'demo', 'A1:D10');
   */
  async replaceAll(
    searchText: string,
    replaceText: string,
    range?: string,
    options: FindOptions = {}
  ): Promise<ReplaceResult> {
    try {
      this.validateSearchText(searchText);
      
      if (replaceText === null || replaceText === undefined) {
        throw new Error('Replace text cannot be null or undefined');
      }

      if (range) {
        this.validateRangeNotation(range);
      }

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      // First, find all matches to get the cells that will be replaced
      const matches = await this.findAll(searchText, range, options);

      if (matches.length === 0) {
        return {
          count: 0,
          replacedCells: []
        };
      }

      // Create text finder for replacement
      const textFinder = await this.univerAPI!.createTextFinderAsync(searchText);

      // Apply options
      if (options.matchCase) {
        await textFinder.matchCaseAsync(true);
      }
      if (options.matchEntireCell) {
        await textFinder.matchEntireCellAsync(true);
      }
      if (options.matchFormula) {
        await textFinder.matchFormulaTextAsync(true);
      }

      // If range is specified, we need to replace only in that range
      // Since Univer's replaceAllWithAsync replaces in entire sheet,
      // we need to manually replace each cell in the range
      if (range) {
        for (const match of matches) {
          const currentValue = String(match.value);
          let newValue: string;
          
          if (options.matchEntireCell) {
            newValue = replaceText;
          } else {
            // Replace all occurrences in the cell value
            if (options.matchCase) {
              newValue = currentValue.replace(new RegExp(this.escapeRegExp(searchText), 'g'), replaceText);
            } else {
              newValue = currentValue.replace(new RegExp(this.escapeRegExp(searchText), 'gi'), replaceText);
            }
          }
          
          match.cell.setValue(newValue);
        }
      } else {
        // Replace all in entire sheet using Univer's API
        await textFinder.replaceAllWithAsync(replaceText);
      }

      return {
        count: matches.length,
        replacedCells: matches
      };
    } catch (error) {
      console.error('Error replacing text:', error);
      throw error;
    }
  }

  /**
   * Replace in specific range (convenience method)
   * 
   * @param searchText - Text to search for
   * @param replaceText - Text to replace with
   * @param range - A1 notation range (e.g., "A1:D10")
   * @param options - Find options
   * @returns Promise<ReplaceResult> - Replace result
   * 
   * @example
   * const result = await replaceInRange('old', 'new', 'A1:D10');
   */
  async replaceInRange(
    searchText: string,
    replaceText: string,
    range: string,
    options: FindOptions = {}
  ): Promise<ReplaceResult> {
    return this.replaceAll(searchText, replaceText, range, options);
  }

  /**
   * Replace next occurrence of search text
   * 
   * @param searchText - Text to search for
   * @param replaceText - Text to replace with
   * @param options - Find options
   * @returns Promise<FindResult | null> - Replaced cell or null if not found
   * 
   * @example
   * const replaced = await replaceNext('old', 'new');
   */
  async replaceNext(
    searchText: string,
    replaceText: string,
    options: FindOptions = {}
  ): Promise<FindResult | null> {
    try {
      this.validateSearchText(searchText);
      
      if (replaceText === null || replaceText === undefined) {
        throw new Error('Replace text cannot be null or undefined');
      }

      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      // Create text finder
      const textFinder = await this.univerAPI!.createTextFinderAsync(searchText);

      // Apply options
      if (options.matchCase) {
        await textFinder.matchCaseAsync(true);
      }
      if (options.matchEntireCell) {
        await textFinder.matchEntireCellAsync(true);
      }
      if (options.matchFormula) {
        await textFinder.matchFormulaTextAsync(true);
      }

      // Find next
      const cell = textFinder.findNext();
      
      if (!cell) {
        return null;
      }

      // Replace current match
      await textFinder.replaceWithAsync(replaceText);

      return this.convertToFindResult(cell);
    } catch (error) {
      console.error('Error replacing next:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Escape special regex characters
   */
  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get current search state
   */
  getCurrentState(): FindReplaceState | null {
    return this.currentState;
  }

  /**
   * Clear current search state
   */
  clearState(): void {
    this.currentState = null;
  }

  /**
   * Get match count from last search
   */
  getMatchCount(): number {
    return this.currentState?.matches.length || 0;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new FindReplaceService instance
 */
export function createFindReplaceService(
  univerAPI: FUniver | null,
  isReady: boolean
): FindReplaceService {
  return new FindReplaceService(univerAPI, isReady);
}

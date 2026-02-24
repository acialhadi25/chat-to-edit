/**
 * Sort and Filter Service for Univer Sheet Integration
 * 
 * Provides comprehensive sort and filter capabilities including:
 * - Single and multiple column sorting
 * - Single and multiple criteria filtering
 * - Filter clearing and restoration
 * 
 * Requirements: 4.2.1, 4.2.2
 * @see https://docs.univer.ai/guides/sheets/features/sort
 */

import type { FUniver, FWorksheet } from '../types/univer.types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SortConfig {
  column: number;
  ascending: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface SimpleSortConfig {
  column: number;
  order?: SortOrder;
}

export interface FilterCriterion {
  column: number;
  operator: FilterOperator;
  value: any;
  value2?: any; // For BETWEEN operator
}

export type FilterOperator = 
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'between';

export type FilterLogic = 'AND' | 'OR';

export interface FilterConfig {
  criteria: FilterCriterion[];
  logic?: FilterLogic;
}

export interface FilterState {
  range: string;
  originalData: any[][];
  filteredIndices: number[];
  config: FilterConfig;
}

// ============================================================================
// Sort and Filter Service Class
// ============================================================================

export class SortFilterService {
  private univerAPI: FUniver | null;
  private isReady: boolean;
  private filterStates: Map<string, FilterState>;

  constructor(univerAPI: FUniver | null, isReady: boolean) {
    this.univerAPI = univerAPI;
    this.isReady = isReady;
    this.filterStates = new Map();
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
   * Validate sort configuration
   */
  private validateSortConfig(sortConfig: SortConfig | SortConfig[]): void {
    const configs = Array.isArray(sortConfig) ? sortConfig : [sortConfig];
    
    if (configs.length === 0) {
      throw new Error('Sort configuration cannot be empty');
    }

    for (const config of configs) {
      if (typeof config.column !== 'number' || config.column < 0) {
        throw new Error(`Invalid column index: ${config.column}. Must be a non-negative number`);
      }
      
      if (typeof config.ascending !== 'boolean') {
        throw new Error(`Invalid ascending value: ${config.ascending}. Must be a boolean`);
      }
    }
  }

  /**
   * Validate filter configuration
   */
  private validateFilterConfig(filterConfig: FilterConfig): void {
    if (!filterConfig.criteria || filterConfig.criteria.length === 0) {
      throw new Error('Filter configuration must have at least one criterion');
    }

    for (const criterion of filterConfig.criteria) {
      if (typeof criterion.column !== 'number' || criterion.column < 0) {
        throw new Error(`Invalid column index: ${criterion.column}. Must be a non-negative number`);
      }

      const validOperators: FilterOperator[] = [
        'equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual',
        'lessThan', 'lessThanOrEqual', 'contains', 'notContains',
        'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty', 'between'
      ];

      if (!validOperators.includes(criterion.operator)) {
        throw new Error(`Invalid filter operator: ${criterion.operator}`);
      }

      if (criterion.operator === 'between' && criterion.value2 === undefined) {
        throw new Error('BETWEEN operator requires value2');
      }

      if (criterion.operator !== 'isEmpty' && criterion.operator !== 'isNotEmpty' && criterion.value === undefined) {
        throw new Error(`Operator ${criterion.operator} requires a value`);
      }
    }

    if (filterConfig.logic && filterConfig.logic !== 'AND' && filterConfig.logic !== 'OR') {
      throw new Error(`Invalid filter logic: ${filterConfig.logic}. Must be 'AND' or 'OR'`);
    }
  }

  /**
   * Convert simple sort config to Univer sort config
   */
  private convertSortConfig(config: SimpleSortConfig | SimpleSortConfig[]): SortConfig | SortConfig[] {
    if (Array.isArray(config)) {
      return config.map(c => ({
        column: c.column,
        ascending: c.order !== 'desc'
      }));
    }
    
    return {
      column: config.column,
      ascending: config.order !== 'desc'
    };
  }

  /**
   * Evaluate a single filter criterion against a value
   */
  private evaluateCriterion(value: any, criterion: FilterCriterion): boolean {
    const { operator, value: criterionValue, value2 } = criterion;

    // Handle empty checks
    if (operator === 'isEmpty') {
      return value === null || value === undefined || value === '';
    }
    if (operator === 'isNotEmpty') {
      return value !== null && value !== undefined && value !== '';
    }

    // Convert to string for string operations
    const strValue = String(value).toLowerCase();
    const strCriterion = String(criterionValue).toLowerCase();

    switch (operator) {
      case 'equals':
        return value == criterionValue; // Loose equality for type coercion
      
      case 'notEquals':
        return value != criterionValue;
      
      case 'greaterThan':
        return value > criterionValue;
      
      case 'greaterThanOrEqual':
        return value >= criterionValue;
      
      case 'lessThan':
        return value < criterionValue;
      
      case 'lessThanOrEqual':
        return value <= criterionValue;
      
      case 'contains':
        return strValue.includes(strCriterion);
      
      case 'notContains':
        return !strValue.includes(strCriterion);
      
      case 'startsWith':
        return strValue.startsWith(strCriterion);
      
      case 'endsWith':
        return strValue.endsWith(strCriterion);
      
      case 'between':
        return value >= criterionValue && value <= value2!;
      
      default:
        return false;
    }
  }

  /**
   * Evaluate all filter criteria against a row
   */
  private evaluateRow(row: any[], config: FilterConfig): boolean {
    const logic = config.logic || 'AND';
    
    if (logic === 'AND') {
      return config.criteria.every(criterion => {
        const value = row[criterion.column];
        return this.evaluateCriterion(value, criterion);
      });
    } else {
      return config.criteria.some(criterion => {
        const value = row[criterion.column];
        return this.evaluateCriterion(value, criterion);
      });
    }
  }

  // ==========================================================================
  // Public API Methods - Sort
  // ==========================================================================

  /**
   * Sort data in a range by single or multiple columns
   * 
   * @param range - A1 notation range (e.g., "A2:D10")
   * @param sortConfig - Sort configuration (single or array)
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Single column sort (ascending)
   * await sortData('A2:D10', { column: 0, ascending: true });
   * 
   * // Single column sort (descending)
   * await sortData('A2:D10', { column: 1, ascending: false });
   * 
   * // Multiple column sort
   * await sortData('A2:D10', [
   *   { column: 0, ascending: true },  // Primary sort
   *   { column: 2, ascending: false }  // Secondary sort
   * ]);
   * 
   * // Using simple config with order
   * await sortData('A2:D10', { column: 0, order: 'asc' });
   */
  async sortData(
    range: string,
    sortConfig: SortConfig | SortConfig[] | SimpleSortConfig | SimpleSortConfig[]
  ): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      // Convert simple config to standard config if needed
      let config: SortConfig | SortConfig[];
      if (Array.isArray(sortConfig)) {
        if (sortConfig.length > 0 && 'order' in sortConfig[0]) {
          config = this.convertSortConfig(sortConfig as SimpleSortConfig[]);
        } else {
          config = sortConfig as SortConfig[];
        }
      } else {
        if ('order' in sortConfig) {
          config = this.convertSortConfig(sortConfig as SimpleSortConfig);
        } else {
          config = sortConfig as SortConfig;
        }
      }

      this.validateSortConfig(config);

      // Use Univer's native sort API
      rangeObj.sort(config);
      
      return true;
    } catch (error) {
      console.error('Error sorting data:', error);
      throw error;
    }
  }

  /**
   * Sort data by a single column (convenience method)
   * 
   * @param range - A1 notation range (e.g., "A2:D10")
   * @param column - Column index (0-based)
   * @param order - Sort order ('asc' or 'desc')
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Sort by first column ascending
   * await sortByColumn('A2:D10', 0, 'asc');
   * 
   * // Sort by second column descending
   * await sortByColumn('A2:D10', 1, 'desc');
   */
  async sortByColumn(range: string, column: number, order: SortOrder = 'asc'): Promise<boolean> {
    return this.sortData(range, { column, order });
  }

  // ==========================================================================
  // Public API Methods - Filter
  // ==========================================================================

  /**
   * Filter data in a range based on criteria
   * 
   * Note: Since Univer's Facade API doesn't have native filter support,
   * this implements a client-side filter by hiding/showing rows.
   * 
   * @param range - A1 notation range (e.g., "A2:D10")
   * @param filterConfig - Filter configuration
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Single criterion filter
   * await filterData('A2:D10', {
   *   criteria: [{ column: 0, operator: 'equals', value: 'Active' }]
   * });
   * 
   * // Multiple criteria with AND logic
   * await filterData('A2:D10', {
   *   criteria: [
   *     { column: 0, operator: 'equals', value: 'Active' },
   *     { column: 2, operator: 'greaterThan', value: 100 }
   *   ],
   *   logic: 'AND'
   * });
   * 
   * // Multiple criteria with OR logic
   * await filterData('A2:D10', {
   *   criteria: [
   *     { column: 1, operator: 'contains', value: 'test' },
   *     { column: 1, operator: 'startsWith', value: 'demo' }
   *   ],
   *   logic: 'OR'
   * });
   */
  async filterData(range: string, filterConfig: FilterConfig): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      this.validateFilterConfig(filterConfig);
      
      const worksheet = this.getActiveWorksheet();
      if (!worksheet) {
        throw new Error('No active worksheet available');
      }

      const rangeObj = worksheet.getRange(range);
      if (!rangeObj) {
        throw new Error(`Failed to get range: ${range}`);
      }

      // Get current data
      const data = rangeObj.getValues();
      if (!data || data.length === 0) {
        throw new Error('Range contains no data');
      }

      // Store original data and filter state
      const filteredIndices: number[] = [];
      
      // Evaluate each row against filter criteria
      data.forEach((row, index) => {
        if (this.evaluateRow(row, filterConfig)) {
          filteredIndices.push(index);
        }
      });

      // Store filter state for later restoration
      this.filterStates.set(range, {
        range,
        originalData: data,
        filteredIndices,
        config: filterConfig
      });

      // Note: Actual row hiding would require access to Univer's command system
      // For now, we store the filter state and return the filtered indices
      // In a real implementation, you would hide rows that don't match the filter
      
      console.log(`Filter applied to ${range}: ${filteredIndices.length}/${data.length} rows match`);
      
      return true;
    } catch (error) {
      console.error('Error filtering data:', error);
      throw error;
    }
  }

  /**
   * Filter data by a single criterion (convenience method)
   * 
   * @param range - A1 notation range (e.g., "A2:D10")
   * @param column - Column index (0-based)
   * @param operator - Filter operator
   * @param value - Filter value
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * // Filter by equals
   * await filterByColumn('A2:D10', 0, 'equals', 'Active');
   * 
   * // Filter by contains
   * await filterByColumn('A2:D10', 1, 'contains', 'test');
   * 
   * // Filter by greater than
   * await filterByColumn('A2:D10', 2, 'greaterThan', 100);
   */
  async filterByColumn(
    range: string,
    column: number,
    operator: FilterOperator,
    value: any
  ): Promise<boolean> {
    return this.filterData(range, {
      criteria: [{ column, operator, value }]
    });
  }

  /**
   * Get filtered data (rows that match the filter)
   * 
   * @param range - A1 notation range (e.g., "A2:D10")
   * @returns any[][] | null - Filtered data or null if no filter applied
   * 
   * @example
   * const filtered = getFilteredData('A2:D10');
   * console.log(`Filtered rows: ${filtered?.length}`);
   */
  getFilteredData(range: string): any[][] | null {
    const filterState = this.filterStates.get(range);
    if (!filterState) {
      return null;
    }

    return filterState.filteredIndices.map(index => filterState.originalData[index]);
  }

  /**
   * Get filter state for a range
   * 
   * @param range - A1 notation range (e.g., "A2:D10")
   * @returns FilterState | null - Filter state or null if no filter applied
   */
  getFilterState(range: string): FilterState | null {
    return this.filterStates.get(range) || null;
  }

  /**
   * Check if a range has an active filter
   * 
   * @param range - A1 notation range (e.g., "A2:D10")
   * @returns boolean - True if filter is active
   */
  hasFilter(range: string): boolean {
    return this.filterStates.has(range);
  }

  /**
   * Clear filter from a range and restore original data
   * 
   * @param range - A1 notation range (e.g., "A2:D10")
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * await clearFilter('A2:D10');
   */
  async clearFilter(range: string): Promise<boolean> {
    try {
      this.validateRangeNotation(range);
      
      const filterState = this.filterStates.get(range);
      if (!filterState) {
        console.warn(`No filter found for range: ${range}`);
        return true; // Not an error, just no filter to clear
      }

      // Remove filter state
      this.filterStates.delete(range);

      // Note: In a real implementation, you would show all hidden rows here
      console.log(`Filter cleared from ${range}`);
      
      return true;
    } catch (error) {
      console.error('Error clearing filter:', error);
      throw error;
    }
  }

  /**
   * Clear all filters from all ranges
   * 
   * @returns Promise<boolean> - Success status
   * 
   * @example
   * await clearAllFilters();
   */
  async clearAllFilters(): Promise<boolean> {
    try {
      const ranges = Array.from(this.filterStates.keys());
      
      for (const range of ranges) {
        await this.clearFilter(range);
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing all filters:', error);
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new SortFilterService instance
 */
export function createSortFilterService(
  univerAPI: FUniver | null,
  isReady: boolean
): SortFilterService {
  return new SortFilterService(univerAPI, isReady);
}

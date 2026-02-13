/**
 * LRU Cache for formula evaluation results
 * 
 * This module implements a Least Recently Used (LRU) cache for formula results
 * to improve performance by avoiding redundant calculations. The cache uses
 * a combination of formula string and data hash as the cache key.
 * 
 * Features:
 * - LRU eviction policy with configurable size limit
 * - Automatic cache invalidation on data changes
 * - Hash-based cache keys for efficient lookup
 * - Thread-safe for use in Web Workers
 * 
 * Requirements: 3.2.2 - Formula result caching for repeated calculations
 */

import type { ExcelData } from '@/types/excel';

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  result: string | number | null;
  timestamp: number;
  accessCount: number;
}

/**
 * Configuration options for the formula cache
 */
interface FormulaCacheOptions {
  /**
   * Maximum number of entries in the cache (default: 1000)
   */
  maxSize?: number;

  /**
   * Time-to-live in milliseconds (default: 5 minutes)
   */
  ttl?: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_OPTIONS: Required<FormulaCacheOptions> = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
};

/**
 * LRU Cache for formula evaluation results
 * 
 * @example
 * ```typescript
 * const cache = new FormulaCache({ maxSize: 500 });
 * 
 * // Cache a result
 * cache.set('=SUM(A1:A10)', excelData, 55);
 * 
 * // Retrieve from cache
 * const result = cache.get('=SUM(A1:A10)', excelData);
 * if (result !== null) {
 *   console.log('Cache hit:', result);
 * }
 * 
 * // Invalidate on data change
 * cache.invalidate();
 * ```
 */
export class FormulaCache {
  private cache: Map<string, CacheEntry>;
  private accessOrder: string[];
  private options: Required<FormulaCacheOptions>;
  private dataVersion: number;

  constructor(options: FormulaCacheOptions = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.dataVersion = 0;
  }

  /**
   * Generate a cache key from formula and data
   * 
   * The key combines:
   * - The formula string
   * - A hash of the relevant data (rows, formulas, current sheet)
   * - The data version number
   */
  private generateKey(formula: string, data: ExcelData): string {
    const dataHash = this.hashData(data);
    return `${formula}|${dataHash}|v${this.dataVersion}`;
  }

  /**
   * Generate a simple hash of the Excel data
   * 
   * This creates a hash based on:
   * - Number of rows
   * - Number of columns
   * - Current sheet name
   * - Number of formulas
   * - A sample of cell values for quick change detection
   */
  private hashData(data: ExcelData): string {
    const rowCount = data.rows.length;
    const colCount = data.headers.length;
    const sheetName = data.currentSheet;
    const formulaCount = Object.keys(data.formulas).length;

    // Sample first and last few cells for quick change detection
    const sampleCells: (string | number | null)[] = [];
    if (data.rows.length > 0) {
      // First row
      sampleCells.push(...data.rows[0].slice(0, 3));
      // Last row
      if (data.rows.length > 1) {
        const lastRow = data.rows[data.rows.length - 1];
        sampleCells.push(...lastRow.slice(0, 3));
      }
    }

    // Create a simple hash string
    const hashString = `${rowCount}:${colCount}:${sheetName}:${formulaCount}:${sampleCells.join(',')}`;
    
    // Simple string hash function
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Get a cached formula result
   * 
   * @param formula - The formula string (e.g., "=SUM(A1:A10)")
   * @param data - The Excel data context
   * @returns The cached result, or null if not found or expired
   */
  get(formula: string, data: ExcelData): string | number | null {
    const key = this.generateKey(formula, data);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access order (move to end = most recently used)
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);

    // Update access count
    entry.accessCount++;

    return entry.result;
  }

  /**
   * Store a formula result in the cache
   * 
   * @param formula - The formula string
   * @param data - The Excel data context
   * @param result - The evaluation result to cache
   */
  set(formula: string, data: ExcelData, result: string | number | null): void {
    const key = this.generateKey(formula, data);

    // If cache is at capacity, evict least recently used entry
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    // Create cache entry
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      accessCount: 1,
    };

    // Store in cache
    this.cache.set(key, entry);

    // Update access order
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Invalidate the cache (e.g., when data changes)
   * 
   * This increments the data version, effectively invalidating all
   * existing cache entries without clearing the cache immediately.
   * Old entries will be naturally evicted by the LRU policy.
   */
  invalidate(): void {
    this.dataVersion++;
    
    // Optionally clear the cache immediately for memory efficiency
    // Uncomment if you prefer immediate clearing:
    // this.clear();
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    dataVersion: number;
  } {
    let totalAccesses = 0;
    let totalHits = 0;

    this.cache.forEach((entry) => {
      totalAccesses += entry.accessCount;
      if (entry.accessCount > 1) {
        totalHits += entry.accessCount - 1;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      dataVersion: this.dataVersion,
    };
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    // Remove the first entry (least recently used)
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Remove a key from the access order array
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}

/**
 * Global formula cache instance
 * 
 * This can be used across the application for consistent caching.
 * For Web Worker usage, create a separate instance in the worker.
 */
export const globalFormulaCache = new FormulaCache();

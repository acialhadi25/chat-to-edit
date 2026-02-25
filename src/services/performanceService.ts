/**
 * Performance Service
 * 
 * Provides performance optimization utilities including:
 * - Caching for frequently accessed data
 * - Debouncing and throttling
 * - Memory management
 * - Performance monitoring
 * 
 * Requirements: Technical Requirements 3
 * @see https://docs.univer.ai/guides/sheets/features/core/worker
 */

import type { IWorkbookData } from '../types/univer.types';

/**
 * Cache entry with TTL support
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  cacheSize: number;
  averageAccessTime: number;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  maxSize: number;
  ttl: number; // milliseconds
}

/**
 * Performance Service for optimization
 */
export class PerformanceService {
  private cache: Map<string, CacheEntry<any>>;
  private cacheConfig: CacheConfig;
  private metrics: PerformanceMetrics;
  private accessTimes: number[];

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.cacheConfig = {
      maxSize: config.maxSize || 1000,
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
    };
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      cacheSize: 0,
      averageAccessTime: 0,
    };
    this.accessTimes = [];
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.cacheMisses++;
      this.recordAccessTime(performance.now() - startTime);
      return null;
    }

    // Check if entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.cacheConfig.ttl) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      this.recordAccessTime(performance.now() - startTime);
      return null;
    }

    // Update hit count
    entry.hits++;
    this.metrics.cacheHits++;
    this.recordAccessTime(performance.now() - startTime);

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T): void {
    // Check cache size limit
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });

    this.metrics.cacheSize = this.cache.size;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.metrics.cacheSize = 0;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.metrics.cacheSize = this.cache.size;
    return result;
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    let minHits = Infinity;
    let keyToEvict: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        keyToEvict = key;
      }
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Record access time for metrics
   */
  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    
    // Keep only last 100 access times
    if (this.accessTimes.length > 100) {
      this.accessTimes.shift();
    }

    // Calculate average
    const sum = this.accessTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageAccessTime = sum / this.accessTimes.length;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total === 0 ? 0 : this.metrics.cacheHits / total;
  }

  /**
   * Debounce function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function (this: any, ...args: Parameters<T>) {
      const context = this;

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func.apply(context, args);
        timeout = null;
      }, wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return function (this: any, ...args: Parameters<T>) {
      const context = this;

      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;

        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * Memoize function results
   */
  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();

    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
      const key = keyGenerator
        ? keyGenerator(...args)
        : JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key)!;
      }

      const result = func.apply(this, args);
      cache.set(key, result);

      return result;
    } as T;
  }

  /**
   * Batch operations for better performance
   */
  static batch<T>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<void>
  ): Promise<void> {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches.reduce(
      (promise, batch) => promise.then(() => processor(batch)),
      Promise.resolve()
    );
  }

  /**
   * Measure execution time
   */
  static async measureTime<T>(
    name: string,
    func: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const result = await func();
    const endTime = performance.now();

    console.log(`[Performance] ${name}: ${(endTime - startTime).toFixed(2)}ms`);

    return result;
  }

  /**
   * Check if value should be cached based on size
   */
  static shouldCache(value: any, maxSize: number = 1024 * 1024): boolean {
    try {
      const size = new Blob([JSON.stringify(value)]).size;
      return size <= maxSize;
    } catch {
      return false;
    }
  }

  /**
   * Optimize workbook data for storage
   */
  static optimizeWorkbookData(data: IWorkbookData): IWorkbookData {
    // Remove empty cells and optimize structure
    const optimized = { ...data };

    if (optimized.sheets) {
      Object.keys(optimized.sheets).forEach((sheetId) => {
        const sheet = optimized.sheets[sheetId];
        
        if (sheet.cellData) {
          // Remove empty rows
          Object.keys(sheet.cellData).forEach((rowKey) => {
            const row = sheet.cellData[parseInt(rowKey)];
            const hasData = Object.values(row).some(
              (cell) => cell.v !== undefined && cell.v !== null && cell.v !== ''
            );

            if (!hasData) {
              delete sheet.cellData[parseInt(rowKey)];
            }
          });
        }
      });
    }

    return optimized;
  }

  /**
   * Calculate memory usage estimate
   */
  static estimateMemoryUsage(data: any): number {
    try {
      const json = JSON.stringify(data);
      return new Blob([json]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Check if browser supports workers
   */
  static supportsWorkers(): boolean {
    return typeof Worker !== 'undefined';
  }

  /**
   * Check if dataset is large enough to benefit from optimization
   */
  static shouldOptimize(dataSize: number, threshold: number = 1000): boolean {
    return dataSize > threshold;
  }
}

/**
 * Global performance service instance
 */
export const performanceService = new PerformanceService({
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
});

/**
 * Cache decorator for methods
 */
export function Cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheKey = `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      const key = `${cacheKey}:${JSON.stringify(args)}`;
      const cached = performanceService.get(key);

      if (cached !== null) {
        return cached;
      }

      const result = originalMethod.apply(this, args);

      if (result instanceof Promise) {
        return result.then((value) => {
          performanceService.set(key, value);
          return value;
        });
      }

      performanceService.set(key, result);
      return result;
    };

    return descriptor;
  };
}

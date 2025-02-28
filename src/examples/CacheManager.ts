/**
 * Cache Management System
 * 
 * Provides in-memory and persistent caching with various eviction policies.
 */

export interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  evictionPolicy?: 'lru' | 'fifo' | 'lfu';
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  evictions: number;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt?: number;
  lastAccessed?: number;
  accessCount?: number;
}

export interface Cache<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  getStats(): CacheStats;
}

export abstract class BaseCache<T = any> implements Cache<T> {
  protected entries: Map<string, CacheEntry<T>> = new Map();
  protected maxSize: number;
  protected defaultTtl?: number;
  protected evictionPolicy: 'lru' | 'fifo' | 'lfu';
  protected stats: CacheStats;
  
  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.ttl;
    this.evictionPolicy = options.evictionPolicy || 'lru';
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: this.maxSize,
      evictions: 0
    };
  }
  
  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check if entry has expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }
    
    // Update access stats
    entry.lastAccessed = Date.now();
    entry.accessCount = (entry.accessCount || 0) + 1;
    
    this.stats.hits++;
    return entry.value;
  }
  
  set(key: string, value: T, ttl?: number): void {
    // Check if we need to evict entries
    if (this.entries.size >= this.maxSize && !this.entries.has(key)) {
      this.evict();
    }
    
    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0
    };
    
    // Set expiration if TTL is provided
    if (ttl !== undefined || this.defaultTtl !== undefined) {
      const expirationTime = ttl !== undefined ? ttl : this.defaultTtl!;
      entry.expiresAt = now + expirationTime;
    }
    
    this.entries.set(key, entry);
    this.stats.size = this.entries.size;
  }
  
  has(key: string): boolean {
    const entry = this.entries.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if entry has expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key: string): boolean {
    const result = this.entries.delete(key);
    if (result) {
      this.stats.size = this.entries.size;
    }
    return result;
  }
  
  clear(): void {
    this.entries.clear();
    this.stats.size = 0;
  }
  
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  protected evict(): void {
    if (this.entries.size === 0) {
      return;
    }
    
    let keyToEvict: string | undefined;
    
    switch (this.evictionPolicy) {
      case 'lru': // Least Recently Used
        keyToEvict = this.findLeastRecentlyUsed();
        break;
      case 'fifo': // First In First Out
        keyToEvict = this.findOldest();
        break;
      case 'lfu': // Least Frequently Used
        keyToEvict = this.findLeastFrequentlyUsed();
        break;
    }
    
    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictions++;
    }
  }
  
  protected findLeastRecentlyUsed(): string | undefined {
    let oldest: number = Date.now();
    let oldestKey: string | undefined;
    
    for (const [key, entry] of this.entries.entries()) {
      if (entry.lastAccessed && entry.lastAccessed < oldest) {
        oldest = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  protected findOldest(): string | undefined {
    let oldest: number = Date.now();
    let oldestKey: string | undefined;
    
    for (const [key, entry] of this.entries.entries()) {
      if (entry.createdAt < oldest) {
        oldest = entry.createdAt;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  protected findLeastFrequentlyUsed(): string | undefined {
    let leastUsed: number = Infinity;
    let leastUsedKey: string | undefined;
    
    for (const [key, entry] of this.entries.entries()) {
      if ((entry.accessCount || 0) < leastUsed) {
        leastUsed = entry.accessCount || 0;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }
}

export class MemoryCache<T = any> extends BaseCache<T> {
  constructor(options: CacheOptions = {}) {
    super(options);
  }
  
  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.delete(key);
      }
    }
  }
}

export class PersistentCache<T = any> extends BaseCache<T> {
  private storageKey: string;
  private autoSave: boolean;
  
  constructor(storageKey: string, options: CacheOptions & { autoSave?: boolean } = {}) {
    super(options);
    this.storageKey = storageKey;
    this.autoSave = options.autoSave ?? true;
    this.load();
  }
  
  set(key: string, value: T, ttl?: number): void {
    super.set(key, value, ttl);
    if (this.autoSave) {
      this.save();
    }
  }
  
  delete(key: string): boolean {
    const result = super.delete(key);
    if (result && this.autoSave) {
      this.save();
    }
    return result;
  }
  
  clear(): void {
    super.clear();
    if (this.autoSave) {
      this.save();
    }
  }
  
  save(): void {
    // In a real implementation, this would save to localStorage, IndexedDB, or a file
    console.log(`Saving cache to ${this.storageKey}`);
    
    const serialized = JSON.stringify({
      entries: Array.from(this.entries.entries()),
      stats: this.stats
    });
    
    // In a browser environment:
    // localStorage.setItem(this.storageKey, serialized);
    
    // In a Node.js environment:
    // fs.writeFileSync(this.storageKey, serialized);
  }
  
  load(): void {
    // In a real implementation, this would load from localStorage, IndexedDB, or a file
    console.log(`Loading cache from ${this.storageKey}`);
    
    // In a browser environment:
    // const serialized = localStorage.getItem(this.storageKey);
    
    // In a Node.js environment:
    // let serialized;
    // try {
    //   serialized = fs.readFileSync(this.storageKey, 'utf8');
    // } catch (error) {
    //   serialized = null;
    // }
    
    // if (serialized) {
    //   const data = JSON.parse(serialized);
    //   this.entries = new Map(data.entries);
    //   this.stats = data.stats;
    // }
  }
}

export class CacheManager {
  private caches: Map<string, Cache<any>> = new Map();
  
  createCache<T>(name: string, options: CacheOptions = {}): Cache<T> {
    const cache = new MemoryCache<T>(options);
    this.caches.set(name, cache);
    return cache;
  }
  
  createPersistentCache<T>(name: string, storageKey: string, options: CacheOptions = {}): Cache<T> {
    const cache = new PersistentCache<T>(storageKey, options);
    this.caches.set(name, cache);
    return cache;
  }
  
  getCache<T>(name: string): Cache<T> | undefined {
    return this.caches.get(name) as Cache<T> | undefined;
  }
  
  hasCache(name: string): boolean {
    return this.caches.has(name);
  }
  
  deleteCache(name: string): boolean {
    return this.caches.delete(name);
  }
  
  clearAllCaches(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }
  
  getAllCacheStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    
    return stats;
  }
}

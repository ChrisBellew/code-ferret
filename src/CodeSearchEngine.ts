import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSourceFiles } from './utils.js';

// Define interfaces for our data structures
interface CodeMetadata {
  file: string;
  code: string;
  keywords: Map<string, number> | [string, number][]; // Map of keywords to their frequency or serialized version
  checksum: string; // File checksum to detect changes
}

interface SearchResult {
  file: string;
  code: string;
  similarityScore: number;
  rank: number;
}

export class CodeSearchEngine {
  // Map of directory paths to their respective indices
  private directoryIndices: Map<string, CodeMetadata[]> = new Map();
  private indexedExtensions: Map<string, string[]> = new Map();
  
  /**
   * Initialize the search engine
   */
  constructor() {
    // No need to load existing index, we'll create in-memory indices as needed
  }
  
  /**
   * Calculate file checksum to detect changes
   * @param content File content
   * @returns MD5 checksum
   */
  private calculateChecksum(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  /**
   * Extract keywords from code content
   * @param code Source code content
   * @returns Map of keywords to their frequency
   */
  private extractKeywords(code: string): Map<string, number> {
    const keywords = new Map<string, number>();
    
    // Convert to lowercase and remove common symbols
    const normalizedCode = code.toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace non-alphanumeric chars with spaces
      .replace(/\s+/g, ' ')      // Replace multiple spaces with a single space
      .trim();
    
    // Split into words and count frequency
    const words = normalizedCode.split(' ');
    for (const word of words) {
      // Skip short words and common programming keywords
      if (word.length <= 2 || this.isCommonKeyword(word)) {
        continue;
      }
      
      keywords.set(word, (keywords.get(word) || 0) + 1);
    }
    
    // Extract class and function names with higher weight
    const classMatches = code.match(/class\s+(\w+)/g) || [];
    for (const match of classMatches) {
      const className = match.replace('class ', '').toLowerCase();
      keywords.set(className, (keywords.get(className) || 0) + 10); // Higher weight for class names
    }
    
    const functionMatches = code.match(/function\s+(\w+)|(\w+)\s*\(/g) || [];
    for (const match of functionMatches) {
      const functionName = match.replace(/function\s+|\s*\(/g, '').toLowerCase();
      if (functionName.length > 2 && !this.isCommonKeyword(functionName)) {
        keywords.set(functionName, (keywords.get(functionName) || 0) + 5); // Higher weight for function names
      }
    }
    
    return keywords;
  }
  
  /**
   * Check if a word is a common programming keyword
   * @param word Word to check
   * @returns True if the word is a common keyword
   */
  private isCommonKeyword(word: string): boolean {
    const commonKeywords = new Set([
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'return', 'try', 'catch', 'finally', 'throw', 'new', 'delete', 'typeof',
      'instanceof', 'void', 'this', 'super', 'class', 'interface', 'extends',
      'implements', 'static', 'public', 'private', 'protected', 'const', 'let',
      'var', 'function', 'async', 'await', 'import', 'export', 'from', 'as',
      'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'
    ]);
    
    return commonKeywords.has(word);
  }
  
  /**
   * Get the normalized directory path (with trailing slash)
   * @param directory Directory path
   * @returns Normalized directory path
   */
  private getNormalizedDirectory(directory: string): string {
    const resolvedDir = path.resolve(directory);
    return resolvedDir.endsWith(path.sep) ? resolvedDir : resolvedDir + path.sep;
  }
  
  /**
   * Create a new search index from source files in the directory
   * @param directory Directory to index
   * @param extensions File extensions to include
   * @param forceReindex If true, reindex all files even if they're already in the index
   * @param respectGitignore Whether to respect .gitignore files (default: true)
   */
  async createIndex(
    directory: string, 
    extensions?: string[]
  ): Promise<void> {
    const normalizedDir = this.getNormalizedDirectory(directory);
    
    // Always create a fresh index for the directory
    console.log(`Creating index for ${normalizedDir}`);
    
    // Find all source files first
    const files = await getSourceFiles(directory, extensions);
    
    // If no files found in the directory, try to search in subdirectories
    if (files.length === 0) {
      console.log(`No files found directly in ${directory} with extensions ${extensions?.join(', ')}`);
      console.log(`Checking subdirectories...`);
      
      // Get subdirectories
      const fs = await import('fs');
      const path = await import('path');
      
      try {
        const subdirs = fs.readdirSync(directory)
          .filter(item => {
            try {
              return fs.statSync(path.join(directory, item)).isDirectory();
            } catch (e) {
              return false;
            }
          })
          .map(item => path.join(directory, item));
        
        console.log(`Found subdirectories: ${subdirs.join(', ')}`);
        
        // Try to index each subdirectory
        let allFiles: string[] = [];
        
        for (const subdir of subdirs) {
          try {
            console.log(`Checking subdirectory: ${subdir}`);
            const subFiles = await getSourceFiles(subdir, extensions);
            allFiles = [...allFiles, ...subFiles];
          } catch (subError) {
            console.log(`Could not get files from ${subdir}: ${subError instanceof Error ? subError.message : String(subError)}`);
          }
        }
        
        if (allFiles.length === 0) {
          throw new Error(`No files found in ${directory} or its subdirectories with extensions ${extensions?.join(', ')}`);
        }
        
        files.push(...allFiles);
      } catch (error) {
        throw new Error(`No files found in ${directory} with extensions ${extensions?.join(', ')}`);
      }
    }
    
    console.log(`Found ${files.length} source files to index`);
    
    // Store the extensions used for this directory
    this.indexedExtensions.set(normalizedDir, extensions || ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.cs']);
    
    // Create a new metadata array for this directory
    const metadata: CodeMetadata[] = [];
    
    // Process each file
    console.log("Indexing files...");
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const checksum = this.calculateChecksum(content);
        
        // Extract keywords from the content
        const keywords = this.extractKeywords(content);
        
        // Create metadata
        metadata.push({
          file,
          code: content,
          keywords,
          checksum
        });
      } catch (error) {
        console.error(`Error processing ${file}: ${error}`);
        continue;
      }
    }
    
    // Store the metadata for this directory
    this.directoryIndices.set(normalizedDir, metadata);
    
    console.log(`\nIndexing complete! Indexed ${metadata.length} files for directory ${normalizedDir}`);
  }
  
  /**
   * Get the metadata for a directory
   * @param directory Directory path
   * @returns Array of CodeMetadata objects
   */
  private getMetadataForDirectory(directory: string): CodeMetadata[] {
    const normalizedDir = this.getNormalizedDirectory(directory);
    return this.directoryIndices.get(normalizedDir) || [];
  }
  
  /**
   * Quick search to just get relevant file paths without code content
   * @param query Search query
   * @param directory Directory to search in
   * @returns Array of file paths
   */
  async getRelevantFiles(query: string, directory: string): Promise<string[]> {
    const results = await this.search(query, directory);
    return results.map(result => result.file);
  }
  
  /**
   * Perform keyword-based search on code files
   * @param query Search query
   * @param directory Directory to search in
   * @returns Map of file paths to keyword scores
   */
  private keywordSearch(query: string, directory: string): Map<string, number> {
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    const scores = new Map<string, number>();
    
    // If no meaningful keywords, return empty map
    if (queryKeywords.length === 0) {
      return scores;
    }
    
    console.log(`Searching for keywords: ${queryKeywords.join(', ')}`);
    
    // Get metadata for the directory
    const metadata = this.getMetadataForDirectory(directory);
    
    // Check if we have pre-built keyword indices
    const hasKeywordIndices = metadata.some(item => {
      if (!item.keywords) return false;
      if (item.keywords instanceof Map) return item.keywords.size > 0;
      return Array.isArray(item.keywords) && item.keywords.length > 0;
    });
    
    if (hasKeywordIndices) {
      console.log('Using pre-built keyword indices');
      
      // Use pre-built keyword indices
      for (const item of metadata) {
        if (!item.keywords) continue;
        
        let score = 0;
        const keywordsMap = item.keywords instanceof Map ? 
          item.keywords : 
          new Map<string, number>(item.keywords as [string, number][]);
        
        for (const keyword of queryKeywords) {
          const keywordScore = keywordsMap.get(keyword) || 0;
          score += keywordScore * 0.01;
          
          // Check for partial matches (e.g. "email" matches "emailService")
          for (const [indexedKeyword, indexedScore] of keywordsMap.entries()) {
            if (typeof indexedKeyword === 'string' && 
                indexedKeyword.includes(keyword) && 
                indexedKeyword !== keyword) {
              score += indexedScore * 0.005; // Lower weight for partial matches
            }
          }
        }
        
        if (score > 0) {
          scores.set(item.file, score);
        }
      }
    } else {
      console.log('No pre-built keyword indices found, falling back to on-the-fly search');
      
      // Fall back to on-the-fly search
      for (const item of metadata) {
        const code = item.code.toLowerCase();
        let score = 0;
        
        for (const keyword of queryKeywords) {
          // Count occurrences of the keyword in the code
          const regex = new RegExp(keyword, 'g');
          const matches = code.match(regex);
          if (matches) {
            // Add the number of matches to the score, with some weighting
            score += matches.length * 0.01;
            
            // Boost score for matches in class/function names and comments
            const classMatch = new RegExp(`class\\s+\\w*${keyword}\\w*`, 'i').test(code);
            const functionMatch = new RegExp(`function\\s+\\w*${keyword}\\w*|\\w*${keyword}\\w*\\s*\\(`, 'i').test(code);
            const commentMatch = new RegExp(`\\/\\/.*${keyword}|\\*.*${keyword}`, 'i').test(code);
            
            if (classMatch) score += 0.3;
            if (functionMatch) score += 0.2;
            if (commentMatch) score += 0.1;
          }
        }
        
        if (score > 0) {
          scores.set(item.file, score);
        }
      }
    }
    
    return scores;
  }
  
  /**
   * Search for code snippets that match the query
   * @param query Search query
   * @returns Array of search results
   */
  async search(query: string, directory: string): Promise<SearchResult[]> {
    const normalizedDir = this.getNormalizedDirectory(directory);
    
    // Check if we have an index for this directory
    if (!this.directoryIndices.has(normalizedDir)) {
      // Create an index for this directory
      console.log(`No index found for ${normalizedDir}, creating one...`);
      const extensions = this.indexedExtensions.get(normalizedDir) || ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.cs'];
      await this.createIndex(directory, extensions);
    }
    
    const metadata = this.getMetadataForDirectory(directory);
    
    if (metadata.length === 0) {
      throw new Error(`No files indexed for directory ${directory}. Please index the directory first.`);
    }
    
    // Get keyword search scores
    const keywordScores = this.keywordSearch(query, directory);
    
    // Sort by score and get top k
    const scoredResults = Array.from(keywordScores.entries())
      .map(([file, score]) => {
        const item = metadata.find(m => m.file === file)!;
        return {
          file,
          code: item.code,
          similarityScore: score
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Format results
    return scoredResults.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
  }
}

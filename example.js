#!/usr/bin/env node

import { CodeSearchEngine } from './build/CodeSearchEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node example.js <repo-path> <search-query> [top-results]');
    console.log('Example: node example.js ./src "function search" 10');
    process.exit(1);
  }
  
  const repoPath = path.resolve(args[0]);
  const searchQuery = args[1];
  const topResults = args[2] ? parseInt(args[2]) : 5;
  
  console.log(`Repository: ${repoPath}`);
  console.log(`Search query: "${searchQuery}"`);
  console.log(`Top results: ${topResults}`);
  
  try {
    // Create a temporary index path
    const indexPath = path.join(__dirname, 'temp_index');
    
    // Create a new search engine
    const engine = new CodeSearchEngine(indexPath);
    
    // Index the repository
    console.log('\nIndexing repository...');
    await engine.createIndex(repoPath, undefined, false, true); // Respect .gitignore files
    
    // Search for code
    console.log('\nSearching...');
    const results = await engine.search(searchQuery, topResults);
    
    // Display results
    console.log('\nResults:');
    console.log('========');
    
    for (const result of results) {
      console.log(`\nRank: ${result.rank}`);
      console.log(`File: ${result.file}`);
      console.log(`Score: ${result.similarityScore.toFixed(3)}`);
      
      // Show a snippet of the code (first 5 lines)
      const codeLines = result.code.split('\n');
      const snippet = codeLines.slice(0, 5).join('\n');
      console.log('Snippet:');
      console.log('--------');
      console.log(snippet);
      if (codeLines.length > 5) {
        console.log('...');
      }
    }
    
    // Get just the file paths
    console.log('\nRelevant files:');
    const files = await engine.getRelevantFiles(searchQuery, topResults);
    for (const file of files) {
      console.log(`- ${file}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);

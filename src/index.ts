#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import dotenv from 'dotenv';
import { CodeSearchEngine } from './CodeSearchEngine.js';
import { spawn } from 'child_process';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Create a new command line program
const program = new Command();

// Set up program metadata
program
  .name('code-ferret')
  .description('Lightweight code search tool using keyword indexing')
  .version('1.0.0');

// Add index command
program
  .command('index')
  .description('Index source code files in a directory')
  .requiredOption('-d, --directory <path>', 'Directory to index')
  .option('-e, --extensions <extensions...>', 'File extensions to include (e.g. .ts .js)')
  .option('-i, --index-path <path>', 'Path to save the index', 'code_index')
  .option('-f, --force', 'Force reindexing of all files even if they exist in the index')
  .option('--no-gitignore', 'Ignore .gitignore files when indexing')
  .action(async (options) => {
    try {
      const directory = path.resolve(options.directory);
      const indexPath = options.indexPath;
      const extensions = options.extensions;
      const forceReindex = options.force || false;
      const respectGitignore = options.gitignore !== false;
      
      console.log(`Indexing directory: ${directory}`);
      console.log(`Using extensions: ${extensions ? extensions.join(', ') : 'default'}`);
      console.log(`Force reindex: ${forceReindex}`);
      console.log(`Respect .gitignore: ${respectGitignore}`);
      
      const engine = new CodeSearchEngine();
      await engine.createIndex(directory, extensions);
      
      console.log('Indexing complete!');
    } catch (error) {
      console.error('Error during indexing:', error);
      process.exit(1);
    }
  });

// Add search command
program
  .command('search')
  .description('Search for code snippets matching a query')
  .requiredOption('-q, --query <text>', 'Search query')
  .option('-t, --top <number>', 'Number of results to return', '5')
  .option('-i, --index-path <path>', 'Path to the index', 'code_index')
  .option('-f, --files-only', 'Only show file paths, not code content')
  .action(async (options) => {
    try {
      const query = options.query;
      const topK = parseInt(options.top);
      const indexPath = options.indexPath;
      const filesOnly = options.filesOnly || false;
      
      console.log(`Searching for: "${query}"`);
      
      const engine = new CodeSearchEngine();
      const currentDirectory = process.cwd();
      
      if (filesOnly) {
        // Just show file paths
        const files = await engine.getRelevantFiles(query, currentDirectory);
        console.log('\nRelevant Files:');
        console.log('===============');
        for (const file of files) {
          console.log(`- ${file}`);
        }
      } else {
        // Show detailed results
        const results = await engine.search(query, currentDirectory);
        
        console.log('\nSearch Results:');
        console.log('==============');
        for (const result of results) {
          console.log(`\nRank: ${result.rank}`);
          console.log(`File: ${result.file}`);
          console.log(`Relevance Score: ${result.similarityScore.toFixed(3)}`);
          console.log('Code Example:');
          console.log('------------');
          console.log(result.code);
          console.log();
        }
      }
    } catch (error) {
      console.error('Error during search:', error);
      process.exit(1);
    }
  });

// Add MCP server command
program
  .command('mcp')
  .description('Run as an MCP server for integration with Cline')
  .option('-i, --index-path <path>', 'Path to save the index', 'code_index')
  .action(async (options) => {
    try {
      const indexPath = options.indexPath;
      
      console.log(`Starting Code Ferret MCP server with index path: ${indexPath}`);
      console.log('This server will run until terminated (Ctrl+C)');
      
      // Get the path to the mcp-server.js file
      const scriptPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'mcp-server.js');
      
      // Check if the script exists
      if (!fs.existsSync(scriptPath)) {
        console.error(`Error: MCP server script not found at ${scriptPath}`);
        process.exit(1);
      }
      
      // Spawn the MCP server process
      const mcpProcess = spawn('node', [scriptPath, indexPath], {
        stdio: 'inherit',
      });
      
      // Handle process exit
      mcpProcess.on('exit', (code) => {
        if (code !== 0) {
          console.error(`MCP server exited with code ${code}`);
          process.exit(code || 1);
        }
      });
      
      // Handle process errors
      mcpProcess.on('error', (error) => {
        console.error('Error starting MCP server:', error);
        process.exit(1);
      });
      
      // Forward signals to the child process
      const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
      signals.forEach((signal) => {
        process.on(signal, () => {
          if (!mcpProcess.killed) {
            mcpProcess.kill(signal);
          }
        });
      });
    } catch (error) {
      console.error('Error starting MCP server:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

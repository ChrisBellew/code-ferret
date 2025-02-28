#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'path';
import { z } from 'zod';
import { CodeSearchEngine } from './CodeSearchEngine.js';

/**
 * Main entry point for the Code Ferret MCP server
 */
async function main() {
  try {
    // Get index path from command line args or use default
    const indexPath = process.argv[2] || 'code_index';
    const currentDirectory = process.cwd();
    
    console.log(`Starting Code Ferret MCP server with index path: ${indexPath}`);
    console.log(`Current working directory: ${currentDirectory}`);
    
    // Initialize the search engine
    const searchEngine = new CodeSearchEngine();
    
    // Create an MCP server
    const server = new McpServer({
      name: 'code-ferret-mcp',
      version: '1.0.0'
    });
    
    // Add search_code tool
    server.tool(
      'search_code',
      {
        query: z.string().describe('Search query to find in code'),
        directory: z.string().optional().describe('Directory to search in (defaults to current directory)'),
        extensions: z.array(z.string()).optional().describe('File extensions to include in search').default(['.ts', '.tsx', '.js', '.jsx', '.kt', '.py', '.java', '.cpp', '.cs']),
        top: z.number().optional().describe('Number of results to return (default: 10)').default(10),
      },
      async ({ query, directory, extensions }) => {
        try {
          console.log(`Searching for: "${query}"`);
          
          const resolvedDirectory = directory ? path.resolve(directory) : currentDirectory;
          
          // Index the directory if specified
          if (directory) {
            console.log(`Indexing directory: ${resolvedDirectory}`);
            // Use default extensions if not provided
            const defaultExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.cs'];
            const resolvedExtensions = extensions || defaultExtensions;
            await searchEngine.createIndex(resolvedDirectory, resolvedExtensions);
          }
          
          // Search for code
          console.log(`Performing search...`);
          const results = await searchEngine.search(query, resolvedDirectory);
          
          // Extract just the file paths
          const filePaths = results.map(result => result.file);
          
          console.log(`Found ${filePaths.length} results`);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(filePaths, null, 2)
              },
              {
                type: 'text',
                text: `Found ${filePaths.length} results for query "${query}"`
              }
            ]
          };
        } catch (error) {
          console.error('Error in search_code:', error);
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`
              }
            ],
            isError: true
          };
        }
      }
    );
    
    // Start the server
    console.log('Connecting to stdio transport...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('Code Ferret MCP server running on stdio');
    
    // Handle signals for graceful shutdown
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    
    async function handleShutdown() {
      console.log('Shutting down server...');
      try {
        await server.close();
        console.log('Server closed successfully');
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
      process.exit(0);
    }
  } catch (error) {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});

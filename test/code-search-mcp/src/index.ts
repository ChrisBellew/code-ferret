#!/usr/bin/env node

/**
 * This is a simple MCP server that implements code search functionality.
 * It demonstrates how to expose tools for searching code and indexing directories.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import { CodeSearchEngine } from "../../../src/CodeSearchEngine.js";

/**
 * Create an MCP server with capabilities for tools (to search code and index directories).
 */
const server = new Server(
  {
    name: "Code Search MCP Server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize the code search engine
const indexPath = process.argv[2] || "code_index";
const currentDirectory = process.cwd();
const searchEngine = new CodeSearchEngine(indexPath);

/**
 * Handler that lists available tools.
 * Exposes tools for searching code and indexing directories.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_code",
        description: "Search for code snippets matching a query",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            directory: {
              type: "string",
              description: "Directory to search in (default: current directory)",
            },
            extensions: {
              type: "array",
              items: {
                type: "string",
              },
              description: "File extensions to include (e.g. [\".ts\", \".js\"])",
            },
            top: {
              type: "number",
              description: "Number of results to return (default: 15)",
            },
            forceReindex: {
              type: "boolean",
              description: "Force reindexing of all files (default: false)",
            },
            respectGitignore: {
              type: "boolean",
              description: "Respect .gitignore files (default: true)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "index_directory",
        description: "Index a directory for code search",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Directory to index",
            },
            extensions: {
              type: "array",
              items: {
                type: "string",
              },
              description: "File extensions to include (e.g. [\".ts\", \".js\"])",
            },
            forceReindex: {
              type: "boolean",
              description: "Force reindexing of all files (default: false)",
            },
            respectGitignore: {
              type: "boolean",
              description: "Respect .gitignore files (default: true)",
            },
          },
          required: ["directory"],
        },
      },
    ],
  };
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Code Search MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

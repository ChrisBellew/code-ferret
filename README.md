# Code Ferret

A lightweight code search tool using keyword indexing. Code Ferret helps you quickly find relevant code snippets across your codebase.

## Features

- Fast code search using keyword indexing
- In-memory index for quick searches
- MCP server integration for use with Cline and other LLM tools
- Command-line interface for direct usage

## Installation

You can install Code Ferret globally:

```bash
npm install -g code-ferret
```

Or use it directly with npx:

```bash
npx code-ferret <command>
```

## Usage

### Command Line Interface

#### Index a directory

```bash
code-ferret index --directory ./src --extensions .ts .js
```

#### Search for code

```bash
code-ferret search --query "function fetchData"
```

#### Show only file paths

```bash
code-ferret search --query "fetchData" --files-only
```

### MCP Server

Code Ferret can run as an MCP (Model Context Protocol) server, which allows it to be used by LLM tools like Cline.

#### Run the MCP server

```bash
npx code-ferret mcp
```

Or if installed globally:

```bash
code-ferret mcp
```

#### Run the MCP server directly

You can also run the MCP server directly using npx:

```bash
npx code-ferret-mcp
```

### MCP Server Integration

When running as an MCP server, Code Ferret exposes the following tools:

- `search_code`: Search for code snippets matching a query
  - Parameters:
    - `query`: Search query (required)
    - `directory`: Directory to search in (optional, defaults to current directory)
    - `extensions`: File extensions to include (optional)

## Examples

### Search for code using the CLI

```bash
code-ferret search --query "database connection"
```

### Search for code using the MCP server

When using with Cline or other LLM tools that support MCP, you can use the `search_code` tool:

```
search_code(query="database connection", directory="./src")
```

## How It Works

Code Ferret creates an in-memory index of your code files, extracting keywords and their frequencies. When you search, it uses this index to quickly find relevant code snippets based on keyword matching and scoring.

## License

MIT

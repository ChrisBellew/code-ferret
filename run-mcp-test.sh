#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Make the MCP server executable
chmod +x build/mcp-server.js

# Run the test script
echo -e "\nRunning MCP server test..."
node test-mcp-request.js

echo -e "\nDone!"

#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Make the MCP server executable
chmod +x build/mcp-server.js

# Create a test script for the MCP server
echo -e "\nCreating test script..."
cat > test-mcp-request.js << 'EOF'
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Start the MCP server process
  console.log('Starting MCP server...');
  const serverProcess = spawn('node', ['build/mcp-server.js'], {
    stdio: ['pipe', 'pipe', process.stderr]
  });
  
  // Wait for the server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send a listTools request
  console.log('Sending listTools request...');
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'listTools',
    params: {}
  };
  
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
  
  // Handle the response
  serverProcess.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      console.log('Received response:');
      console.log(JSON.stringify(response, null, 2));
      
      // Send a search_code request
      console.log('\nSending search_code request...');
      const searchRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'callTool',
        params: {
          name: 'search_code',
          arguments: {
            query: 'keyword',
            directory: '.',
            top: 3
          }
        }
      };
      
      serverProcess.stdin.write(JSON.stringify(searchRequest) + '\n');
    } catch (error) {
      console.error('Error parsing response:', error);
      serverProcess.kill();
      process.exit(1);
    }
  });
  
  // Set a timeout to terminate the process
  setTimeout(() => {
    console.log('\nTest complete, terminating server...');
    serverProcess.kill();
    process.exit(0);
  }, 5000);
}

main().catch(console.error);
EOF

# Run the test script
echo -e "\nRunning MCP server test..."
node test-mcp-request.js

echo -e "\nDone!"

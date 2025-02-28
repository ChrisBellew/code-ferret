import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Start the MCP server process
  console.log('Starting MCP server...');
  const serverProcess = spawn('node', ['build/mcp-server.js'], {
    stdio: ['pipe', 'pipe', process.stderr],
    env: { ...process.env, DEBUG: 'mcp:*' } // Enable MCP debug logging
  });
  
  // Track request/response state
  let listToolsResponseReceived = false;
  let searchCodeResponseReceived = false;
  let searchCodeRequestSent = false;
  
  // Set up error handling for the server process
  serverProcess.on('error', (error) => {
    console.error('Server process error:', error);
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Server process exited with code ${code}`);
      process.exit(1);
    }
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
      const responseText = data.toString().trim();
      // Handle potential multiple JSON objects in one data chunk
      const jsonStrings = responseText.split('\n').filter(str => str.trim());
      
      for (const jsonStr of jsonStrings) {
        const response = JSON.parse(jsonStr);
        console.log('Received response:');
        console.log(JSON.stringify(response, null, 2));
        
        // Track which response we received
        if (response.id === 1) {
          listToolsResponseReceived = true;
          
          // Check if the response has an error
          if (response.error) {
            console.error('Error in listTools response:', response.error);
            console.log('Test failed, terminating server...');
            serverProcess.kill();
            process.exit(1);
          }
          
          // Only send the search_code request if we haven't sent it yet
          if (!searchCodeRequestSent) {
            searchCodeRequestSent = true;
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
          }
        } else if (response.id === 2) {
          searchCodeResponseReceived = true;
          
          // Check if the response has an error
          if (response.error) {
            console.error('Error in search_code response:', response.error);
            console.log('Test failed, terminating server...');
            serverProcess.kill();
            process.exit(1);
          } else {
            console.log('Test successful!');
            console.log('Terminating server...');
            serverProcess.kill();
            process.exit(0);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      serverProcess.kill();
      process.exit(1);
    }
  });
  
  // Set a timeout to terminate the process
  setTimeout(() => {
    console.log('\nTest timeout reached.');
    
    if (!listToolsResponseReceived) {
      console.error('Error: No response received for listTools request');
    } else if (!searchCodeResponseReceived && searchCodeRequestSent) {
      console.error('Error: No response received for search_code request');
    }
    
    console.log('Terminating server...');
    serverProcess.kill();
    process.exit(1);
  }, 5000);
}

main().catch(console.error);

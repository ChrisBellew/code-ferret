#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Create an index of our own code
echo -e "\nIndexing our own code..."
node build/index.js index --directory ./src --extensions .ts --force

# Search for something in our code
echo -e "\nSearching for 'keyword'..."
node build/index.js search --query "keyword" --files-only

echo -e "\nDone!"

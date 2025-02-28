#!/bin/bash

# Check if required arguments are provided
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <repo-path> <search-query> [options]"
    echo ""
    echo "Options:"
    echo "  --top <number>      Number of results to return (default: 5)"
    echo "  --extensions <ext>  File extensions to include (e.g. .ts .js)"
    echo "  --files-only        Only show file paths, not code content"
    echo ""
    echo "Example:"
    echo "  $0 ~/projects/my-repo \"function calculateTotal\" --extensions .ts .js --top 10"
    exit 1
fi

# Extract the first two required arguments
REPO_PATH="$1"
QUERY="$2"
shift 2

# Default values
TOP=5
EXTENSIONS=""
FILES_ONLY=""

# Parse remaining options
while [[ $# -gt 0 ]]; do
    case "$1" in
        --top)
            TOP="$2"
            shift 2
            ;;
        --extensions)
            # Collect all extensions until the next option
            EXTENSIONS=""
            while [[ $# -gt 1 && ! "$2" =~ ^-- ]]; do
                EXTENSIONS="$EXTENSIONS $2"
                shift
            done
            shift
            ;;
        --files-only)
            FILES_ONLY="--files-only"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Ensure the repository path exists
if [ ! -d "$REPO_PATH" ]; then
    echo "Error: Repository path '$REPO_PATH' does not exist or is not a directory"
    exit 1
fi

# Create a temporary index path
INDEX_PATH="$(mktemp -d)/code_index"

# Build the project if needed
if [ ! -d "build" ]; then
    echo "Building project..."
    npm run build
fi

# Index the repository
echo -e "\nIndexing repository: $REPO_PATH"
EXTENSIONS_ARGS=""
if [ ! -z "$EXTENSIONS" ]; then
    for EXT in $EXTENSIONS; do
        EXTENSIONS_ARGS="$EXTENSIONS_ARGS --extensions $EXT"
    done
fi

# Always respect .gitignore files by default (this is the default behavior)
node build/index.js index --directory "$REPO_PATH" $EXTENSIONS_ARGS --index-path "$INDEX_PATH"

# Search the repository
echo -e "\nSearching for: \"$QUERY\""
node build/index.js search --query "$QUERY" --top "$TOP" --index-path "$INDEX_PATH" $FILES_ONLY

echo -e "\nDone!"

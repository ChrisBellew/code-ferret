import { glob } from 'glob';
import fs from 'fs';
import path from 'path';
import ignore from 'ignore';

/**
 * Load and parse .gitignore file
 * @param directory Directory containing .gitignore file
 * @returns Ignore instance for pattern matching
 */
function loadGitignore(directory: string): ignore.Ignore {
  const ig = ignore();
  
  // Find all .gitignore files in the directory and its parents
  let currentDir = directory;
  const gitignoreFiles = [];
  
  while (currentDir !== path.parse(currentDir).root) {
    const gitignorePath = path.join(currentDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      gitignoreFiles.push(gitignorePath);
    }
    currentDir = path.dirname(currentDir);
  }
  
  // Process .gitignore files from root to the target directory
  for (const gitignorePath of gitignoreFiles.reverse()) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      ig.add(content);
    } catch (error) {
      console.warn(`Error reading .gitignore file at ${gitignorePath}:`, error);
    }
  }
  
  // Always ignore node_modules
  ig.add('node_modules/**');
  
  return ig;
}

/**
 * Recursively find all source files in the given directory
 * @param directory Directory to search
 * @param extensions File extensions to include
 * @returns Array of file paths
 */
export async function getSourceFiles(
  directory: string,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.cs']
): Promise<string[]> {
  const files: string[] = [];
  
  // Load .gitignore patterns
  const ig = loadGitignore(directory);
  
  // Get absolute path for proper .gitignore filtering
  const absoluteDirectory = path.resolve(directory);
  
  for (const ext of extensions) {
    // Use glob to find all files with the extension
    const matches = await glob(`${directory}/**/*${ext}`);
    
    // Filter files based on .gitignore if needed
    if (ig) {
      const filteredMatches = matches.filter(file => {
        // Convert to relative path for .gitignore matching
        const relativePath = path.relative(absoluteDirectory, file);
        return !ig.ignores(relativePath);
      });
      files.push(...filteredMatches);
    } else {
      files.push(...matches);
    }
  }
  
  // Filter out test files unless explicitly searching for tests
  // But don't filter out files in the test directory structure if they're not actual test files
  return files.filter(file => {
    const filename = path.basename(file).toLowerCase();
    const isTestFile = 
      filename.includes('.spec.') || 
      filename.includes('.test.') || 
      file.includes('__tests__');
    
    // Keep the file if it's not a test file
    return !isTestFile;
  });
}

/**
 * Extract code information to aid in understanding its purpose
 * @param code Source code content
 * @param filePath Path to the source file
 * @returns Object containing extracted information
 */
export function extractCodeInfo(code: string, filePath: string): Record<string, any> {
  const info: Record<string, any> = {
    imports: [] as string[],
    definitions: [] as string[],
    services: [] as string[],
    storageRelated: false,
    apiRelated: false,
    authRelated: false
  };
  
  // Extract imports and definitions
  const lines = code.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('from ')) {
      info.imports.push(trimmedLine);
    } else if (
      trimmedLine.includes('class ') || 
      trimmedLine.includes('interface ') || 
      trimmedLine.includes('function ') || 
      trimmedLine.includes('const ') || 
      trimmedLine.includes('type ')
    ) {
      let definitionLine = trimmedLine;
      if (definitionLine.includes('{')) {
        definitionLine = definitionLine.split('{')[0].trim();
      }
      
      info.definitions.push(definitionLine);
      
      // Look for service definitions
      if (
        definitionLine.toLowerCase().includes('service') || 
        definitionLine.toLowerCase().includes('client')
      ) {
        info.services.push(definitionLine);
      }
    }
  }
  
  // Detect storage-related code
  const storagePatterns = ['s3', 'storage', 'bucket', 'aws', 'file', 'upload', 'download'];
  info.storageRelated = storagePatterns.some(pattern => code.toLowerCase().includes(pattern));
  
  // Detect API-related code
  const apiPatterns = ['api', 'endpoint', 'http', 'rest', 'request', 'response'];
  info.apiRelated = apiPatterns.some(pattern => code.toLowerCase().includes(pattern));
  
  // Detect auth-related code
  const authPatterns = ['auth', 'login', 'jwt', 'token', 'credential'];
  info.authRelated = authPatterns.some(pattern => code.toLowerCase().includes(pattern));
  
  return info;
}

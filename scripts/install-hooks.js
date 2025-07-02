#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const hookContent = `#!/bin/sh
#
# Pre-commit hook to run build and prevent commits if build fails
#

echo "Running pre-commit build check..."

# Try to run the build first
npm run build

# If build fails with esbuild platform error, try to fix it
if [ $? -ne 0 ]; then
    echo "Build failed, checking if it's an esbuild platform issue..."
    
    # Check if the error mentions esbuild platform mismatch
    npm run build 2>&1 | grep -q "esbuild.*platform"
    if [ $? -eq 0 ]; then
        echo "🔧 Detected esbuild platform mismatch, rebuilding esbuild..."
        npm rebuild esbuild
        
        # Try build again after rebuilding esbuild
        echo "Retrying build after esbuild rebuild..."
        npm run build
    fi
    
    # Final check
    if [ $? -ne 0 ]; then
        echo "❌ Build failed! Commit aborted."
        echo "Fix the build errors and try again."
        exit 1
    fi
fi

echo "✅ Build succeeded!"
exit 0
`;

const hookPath = path.join('.git', 'hooks', 'pre-commit');

try {
    // Create the hook file
    fs.writeFileSync(hookPath, hookContent);
    
    // Make it executable
    fs.chmodSync(hookPath, '755');
    
    console.log('✅ Pre-commit hook installed successfully!');
    console.log('The hook will run `npm run build` before each commit.');
} catch (error) {
    if (error.code === 'ENOENT' && error.path.includes('.git')) {
        console.error('❌ Error: Not in a git repository or .git directory not found');
    } else {
        console.error('❌ Error installing pre-commit hook:', error.message);
    }
    process.exit(1);
}
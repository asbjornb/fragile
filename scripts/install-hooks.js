#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const hookContent = `#!/bin/sh
#
# Pre-commit hook to run build and prevent commits if build fails
#

echo "Running pre-commit build check..."

# Run the build
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Commit aborted."
    echo "Fix the build errors and try again."
    exit 1
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
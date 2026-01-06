#!/usr/bin/env node

/**
 * Pre-commit validation script for Vercel deployment
 * Checks common issues that cause Vercel build failures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

let hasErrors = false;

// 1. Check if required files exist
info('Checking required files...');
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'vercel.json',
  'firestore.rules'
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    error(`Missing required file: ${file}`);
    hasErrors = true;
  } else {
    success(`Found: ${file}`);
  }
});

// 2. Check package.json scripts
info('\nChecking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'build', 'lint'];
  
  requiredScripts.forEach(script => {
    if (!packageJson.scripts[script]) {
      error(`Missing script: ${script}`);
      hasErrors = true;
    } else {
      success(`Script found: ${script}`);
    }
  });
} catch (e) {
  error(`Failed to read package.json: ${e.message}`);
  hasErrors = true;
}

// 3. Check TypeScript compilation
info('\nChecking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  success('TypeScript compilation passed');
} catch (e) {
  error('TypeScript compilation failed');
  hasErrors = true;
}

// 4. Check ESLint
info('\nChecking ESLint...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  success('ESLint passed');
} catch (e) {
  error('ESLint failed');
  hasErrors = true;
}

// 5. Check build
info('\nChecking build...');
try {
  // Clean dist folder first
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  execSync('npm run build', { stdio: 'inherit' });
  success('Build passed');
  
  // Check if dist/index.html exists
  if (!fs.existsSync('dist/index.html')) {
    error('dist/index.html not found after build');
    hasErrors = true;
  } else {
    success('Build output verified');
  }
} catch (e) {
  error('Build failed');
  hasErrors = true;
}

// 6. Check vercel.json configuration
info('\nChecking vercel.json configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (!vercelConfig.rewrites || !Array.isArray(vercelConfig.rewrites)) {
    warning('vercel.json missing rewrites (SPA routing may not work)');
  } else {
    success('vercel.json rewrites configured');
  }
} catch (e) {
  error(`Failed to parse vercel.json: ${e.message}`);
  hasErrors = true;
}

// 7. Check for common Vercel issues
info('\nChecking for common Vercel issues...');

// Check for large files (> 1MB)
const checkLargeFiles = (dir, maxSize = 1024 * 1024) => {
  if (!fs.existsSync(dir)) return false;
  
  const files = fs.readdirSync(dir);
  let foundLarge = false;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    try {
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        if (checkLargeFiles(filePath, maxSize)) foundLarge = true;
      } else if (stats.isFile() && stats.size > maxSize) {
        warning(`Large file detected: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        foundLarge = true;
      }
    } catch (e) {
      // Ignore errors
    }
  });
  
  return foundLarge;
};

if (checkLargeFiles('src')) {
  warning('Large files detected - may slow down Vercel deployment');
}

// Check for environment variables in code (should use process.env)
info('\nChecking for hardcoded secrets...');
try {
  const srcFiles = [];
  const walkDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          walkDir(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          srcFiles.push(filePath);
        }
      } catch (e) {
        // Ignore errors
      }
    });
  };
  
  walkDir('src');
  
  const suspiciousPatterns = [
    /apiKey\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /secret\s*[:=]\s*['"][^'"]{20,}['"]/i,
    /password\s*[:=]\s*['"][^'"]{10,}['"]/i,
  ];
  
  let foundSuspicious = false;
  srcFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(content) && !content.includes('process.env') && !content.includes('import.meta.env')) {
          warning(`Potential hardcoded secret in: ${file}`);
          foundSuspicious = true;
        }
      });
    } catch (e) {
      // Ignore errors
    }
  });
  
  if (!foundSuspicious) {
    success('No hardcoded secrets detected');
  }
} catch (e) {
  warning(`Could not check for hardcoded secrets: ${e.message}`);
}

// 8. Check Firebase configuration
info('\nChecking Firebase configuration...');
try {
  const firebaseFile = 'src/services/firebase.ts';
  if (fs.existsSync(firebaseFile)) {
    const content = fs.readFileSync(firebaseFile, 'utf8');
    if (content.includes('process.env') || content.includes('import.meta.env')) {
      success('Firebase uses environment variables');
    } else {
      warning('Firebase configuration may not use environment variables');
    }
  }
} catch (e) {
  warning(`Could not check Firebase config: ${e.message}`);
}

// Final summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  error('Pre-commit checks FAILED');
  error('Please fix the errors above before committing');
  process.exit(1);
} else {
  success('All pre-commit checks PASSED');
  success('Ready for commit and deployment');
  process.exit(0);
}

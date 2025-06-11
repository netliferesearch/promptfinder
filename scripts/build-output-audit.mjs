#!/usr/bin/env node

/**
 * Build Output Audit Script for PromptFinder Chrome Extension
 *
 * This script validates production build outputs to ensure:
 * - No test files are included
 * - No source maps in production builds
 * - No development tools or debugging code
 * - No system files (.DS_Store, .gitignore, etc.)
 * - Proper file structure for Chrome extension
 * - Optimized asset sizes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const BUILD_DIRECTORIES = ['dist', 'css-min'];
const EXCLUDED_PATTERNS = [
  // Test files
  /\.test\./,
  /test-/,
  /spec\./,
  /_test\./,
  /\.spec\./,

  // Source maps
  /\.map$/,
  /\.js\.map$/,
  /\.css\.map$/,

  // Development files
  /\.dev\./,
  /\.development\./,
  /rollup\.config\./,
  /babel\.config\./,
  /eslint\.config\./,
  /jest\.config\./,

  // System files
  /\.DS_Store$/,
  /Thumbs\.db$/,
  /\.gitignore$/,
  /\.gitkeep$/,

  // Source control
  /\.git\//,
  /\.svn\//,

  // IDE files
  /\.vscode\//,
  /\.idea\//,
  /\.vs\//,

  // Log files
  /\.log$/,
  /npm-debug\./,
  /yarn-error\./,

  // Temporary files
  /\.tmp$/,
  /\.temp$/,
  /~$/,

  // Scripts directory content (should not be in build)
  /scripts\//,

  // Test directories
  /tests\//,
  /__tests__\//,
  /test\//,

  // Documentation (should not be in build)
  /docs\//,
  /README\./,
  /CHANGELOG\./,
  /LICENSE/,

  // Task files
  /tasks\//,
  /ai-tasks\//,

  // Config files
  /package\.json$/,
  /package-lock\.json$/,
  /yarn\.lock$/,

  // Audit results
  /-audit-results\.json$/,
  /-report\.json$/,
];

const REQUIRED_PATTERNS = [
  // Essential Chrome extension files
  /manifest\.json$/,
  /popup\.html$/,

  // Core JavaScript files
  /app\.js$/,
  /firebase-init\.js$/,

  // Core CSS files
  /popup\.css$/,
  /global\.css$/,
];

const DEVELOPMENT_CODE_PATTERNS = [
  // Console debugging
  /console\.debug\(/,
  /console\.trace\(/,
  /console\.table\(/,
  /console\.group\(/,
  /console\.time\(/,

  // Debug flags
  /DEBUG\s*=\s*true/,
  /DEVELOPMENT\s*=\s*true/,
  /process\.env\.NODE_ENV\s*===\s*['"]development['"]/,

  // Test code patterns
  /describe\(/,
  /it\(/,
  /test\(/,
  /expect\(/,
  /jest\./,
  /beforeEach\(/,
  /afterEach\(/,
  /beforeAll\(/,
  /afterAll\(/,

  // Development imports
  /import.*test/,
  /require.*test/,
  /from\s+['"].*test.*['"]/,
];

/**
 * Main build audit function
 */
async function runBuildAudit() {
  console.log('🔍 Starting Build Output Audit for PromptFinder...\n');

  const results = {
    structure: auditBuildStructure(),
    content: await auditFileContent(),
    assets: auditAssetOptimization(),
    extension: auditChromeExtensionFiles(),
    security: auditSecurityAspects(),
  };

  const score = calculateAuditScore(results);
  displayResults(results, score);

  return {
    score,
    results,
    passed: score >= 90,
  };
}

/**
 * Audit build directory structure
 */
function auditBuildStructure() {
  const structure = {
    directories: [],
    files: [],
    excluded: [],
    systemFiles: [],
    requiredPresent: [],
    requiredMissing: [],
  };

  console.log('📁 Auditing build directory structure...');

  for (const buildDir of BUILD_DIRECTORIES) {
    if (!fs.existsSync(buildDir)) {
      console.log(`⚠️  Build directory ${buildDir} does not exist`);
      continue;
    }

    const files = getAllFilesRecursive(buildDir);
    structure.directories.push(buildDir);

    for (const file of files) {
      const relativePath = path.relative(projectRoot, file);
      structure.files.push(relativePath);

      // Check for excluded patterns
      const isExcluded = EXCLUDED_PATTERNS.some(pattern => pattern.test(relativePath));
      if (isExcluded) {
        structure.excluded.push(relativePath);
      }

      // Check for system files
      const fileName = path.basename(file);
      if (fileName.startsWith('.DS_Store') || fileName.startsWith('Thumbs.db')) {
        structure.systemFiles.push(relativePath);
      }

      // Check for required files
      const isRequired = REQUIRED_PATTERNS.some(pattern => pattern.test(relativePath));
      if (isRequired) {
        structure.requiredPresent.push(relativePath);
      }
    }
  }

  // Check for missing required files
  for (const pattern of REQUIRED_PATTERNS) {
    const found = structure.requiredPresent.some(file => pattern.test(file));
    if (!found) {
      structure.requiredMissing.push(pattern.source);
    }
  }

  return structure;
}

/**
 * Audit file content for development code
 */
async function auditFileContent() {
  const content = {
    totalFiles: 0,
    jsFiles: 0,
    cssFiles: 0,
    htmlFiles: 0,
    developmentCode: [],
    minificationStatus: [],
    sizeAnalysis: [],
  };

  console.log('📄 Auditing file content...');

  for (const buildDir of BUILD_DIRECTORIES) {
    if (!fs.existsSync(buildDir)) continue;

    const files = getAllFilesRecursive(buildDir);

    for (const file of files) {
      const relativePath = path.relative(projectRoot, file);
      const ext = path.extname(file).toLowerCase();
      content.totalFiles++;

      try {
        const fileContent = fs.readFileSync(file, 'utf-8');
        const fileSize = fs.statSync(file).size;

        // Categorize by file type
        if (ext === '.js') {
          content.jsFiles++;

          // Check for development code patterns
          for (const pattern of DEVELOPMENT_CODE_PATTERNS) {
            if (pattern.test(fileContent)) {
              content.developmentCode.push({
                file: relativePath,
                pattern: pattern.source,
                issue: 'Development code found',
              });
            }
          }

          // Check minification (rough heuristic)
          const isMinified = checkIfMinified(fileContent);
          content.minificationStatus.push({
            file: relativePath,
            minified: isMinified,
            size: fileSize,
          });
        } else if (ext === '.css') {
          content.cssFiles++;

          // Check CSS minification
          const isMinified = checkIfCSSMinified(fileContent);
          content.minificationStatus.push({
            file: relativePath,
            minified: isMinified,
            size: fileSize,
          });
        } else if (ext === '.html') {
          content.htmlFiles++;
        }

        // Size analysis for all files
        content.sizeAnalysis.push({
          file: relativePath,
          size: fileSize,
          type: ext,
        });
      } catch (error) {
        console.warn(`⚠️  Could not read file ${relativePath}: ${error.message}`);
      }
    }
  }

  // Sort size analysis by size (largest first)
  content.sizeAnalysis.sort((a, b) => b.size - a.size);

  return content;
}

/**
 * Audit asset optimization
 */
function auditAssetOptimization() {
  const assets = {
    images: [],
    icons: [],
    css: [],
    js: [],
    totalSize: 0,
    optimizationSuggestions: [],
  };

  console.log('🖼️  Auditing asset optimization...');

  // Check main project files for assets
  const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
  const allFiles = getAllFilesRecursive('.');

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    const fileName = path.basename(file);
    const relativePath = path.relative(projectRoot, file);

    // Skip build directories and node_modules
    if (relativePath.includes('node_modules') || relativePath.includes('.git')) {
      continue;
    }

    if (assetExtensions.includes(ext)) {
      const stats = fs.statSync(file);
      const assetInfo = {
        file: relativePath,
        size: stats.size,
        type: ext,
      };

      if (fileName.includes('icon') || relativePath.includes('icons')) {
        assets.icons.push(assetInfo);
      } else {
        assets.images.push(assetInfo);
      }

      assets.totalSize += stats.size;

      // Size optimization suggestions
      if (stats.size > 100 * 1024) {
        // > 100KB
        assets.optimizationSuggestions.push({
          file: relativePath,
          currentSize: stats.size,
          suggestion: 'Consider compressing large asset',
        });
      }
    }
  }

  return assets;
}

/**
 * Audit Chrome extension specific files
 */
function auditChromeExtensionFiles() {
  const extension = {
    manifestPresent: false,
    manifestValid: false,
    popupPresent: false,
    iconsPresent: false,
    permissions: [],
    contentSecurityPolicy: null,
    errors: [],
  };

  console.log('🔌 Auditing Chrome extension files...');

  // Check manifest.json
  if (fs.existsSync('manifest.json')) {
    extension.manifestPresent = true;

    try {
      const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
      extension.manifestValid = true;
      extension.permissions = manifest.permissions || [];
      extension.contentSecurityPolicy = manifest.content_security_policy;

      // Validate required fields
      if (!manifest.name || !manifest.version || !manifest.manifest_version) {
        extension.errors.push('Manifest missing required fields');
      }

      // Check for popup
      if (manifest.action?.default_popup) {
        const popupFile = manifest.action.default_popup;
        extension.popupPresent = fs.existsSync(popupFile);
        if (!extension.popupPresent) {
          extension.errors.push(`Popup file ${popupFile} not found`);
        }
      }

      // Check for icons
      if (manifest.icons) {
        extension.iconsPresent = Object.values(manifest.icons).every(iconPath =>
          fs.existsSync(iconPath)
        );
        if (!extension.iconsPresent) {
          extension.errors.push('Some icon files are missing');
        }
      }
    } catch (error) {
      extension.manifestValid = false;
      extension.errors.push(`Manifest JSON parse error: ${error.message}`);
    }
  } else {
    extension.errors.push('manifest.json not found');
  }

  return extension;
}

/**
 * Audit security aspects of build
 */
function auditSecurityAspects() {
  const security = {
    noInlineScripts: true,
    noUnsafeEval: true,
    noSecrets: true,
    issues: [],
  };

  console.log('🔒 Auditing security aspects...');

  // Check HTML files for inline scripts
  const htmlFiles = getAllFilesRecursive('.').filter(f => f.endsWith('.html'));

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    if (content.includes('<script>') && !content.includes('<!DOCTYPE')) {
      security.noInlineScripts = false;
      security.issues.push(`Inline script found in ${file}`);
    }

    if (content.includes('eval(') || content.includes('Function(')) {
      security.noUnsafeEval = false;
      security.issues.push(`Unsafe eval found in ${file}`);
    }
  }

  // Check JS files for potential secrets
  const jsFiles = getAllFilesRecursive('.').filter(f => f.endsWith('.js'));

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Skip test files and node_modules
    if (file.includes('test') || file.includes('node_modules')) continue;

    // Check for potential secrets (very basic check)
    if (
      content.includes('password') ||
      content.includes('secret') ||
      content.includes('private_key')
    ) {
      // More sophisticated check would be needed for real secrets
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('password') && !line.includes('//') && !line.includes('placeholder')) {
          security.noSecrets = false;
          security.issues.push(`Potential secret in ${file}:${index + 1}`);
        }
      });
    }
  }

  return security;
}

/**
 * Calculate overall audit score
 */
function calculateAuditScore(results) {
  let score = 100;

  // Structure penalties
  score -= results.structure.excluded.length * 5; // -5 per excluded file
  score -= results.structure.systemFiles.length * 10; // -10 per system file
  score -= results.structure.requiredMissing.length * 20; // -20 per missing required file

  // Content penalties
  score -= results.content.developmentCode.length * 15; // -15 per dev code issue

  // Asset penalties
  score -= results.assets.optimizationSuggestions.length * 5; // -5 per optimization suggestion

  // Extension penalties
  score -= results.extension.errors.length * 10; // -10 per extension error

  // Security penalties
  score -= results.security.issues.length * 20; // -20 per security issue

  return Math.max(0, Math.min(100, score));
}

/**
 * Display audit results
 */
function displayResults(results, score) {
  console.log('\n🔍 BUILD OUTPUT AUDIT RESULTS');
  console.log('='.repeat(50));
  console.log(`📊 Overall Score: ${score}/100 ${getGrade(score)}\n`);

  // Structure Results
  console.log('📁 DIRECTORY STRUCTURE:');
  console.log(`   Total Files: ${results.structure.files.length}`);
  console.log(`   Build Directories: ${results.structure.directories.join(', ')}`);

  if (results.structure.excluded.length > 0) {
    console.log(`   ❌ Excluded Files Found: ${results.structure.excluded.length}`);
    results.structure.excluded.forEach(file => {
      console.log(`      - ${file}`);
    });
  } else {
    console.log('   ✅ No excluded files found');
  }

  if (results.structure.systemFiles.length > 0) {
    console.log(`   ⚠️  System Files Found: ${results.structure.systemFiles.length}`);
    results.structure.systemFiles.forEach(file => {
      console.log(`      - ${file}`);
    });
  } else {
    console.log('   ✅ No system files found');
  }

  console.log(`   ✅ Required Files Present: ${results.structure.requiredPresent.length}`);
  if (results.structure.requiredMissing.length > 0) {
    console.log(`   ❌ Required Files Missing: ${results.structure.requiredMissing.length}`);
  }
  console.log();

  // Content Results
  console.log('📄 FILE CONTENT:');
  console.log(`   Total Files: ${results.content.totalFiles}`);
  console.log(`   JS Files: ${results.content.jsFiles}`);
  console.log(`   CSS Files: ${results.content.cssFiles}`);
  console.log(`   HTML Files: ${results.content.htmlFiles}`);

  if (results.content.developmentCode.length > 0) {
    console.log(`   ⚠️  Development Code Issues: ${results.content.developmentCode.length}`);
    results.content.developmentCode.forEach(issue => {
      console.log(`      - ${issue.file}: ${issue.issue}`);
    });
  } else {
    console.log('   ✅ No development code found');
  }

  // Minification status
  const minifiedJS = results.content.minificationStatus.filter(
    f => f.file.endsWith('.js') && f.minified
  ).length;
  const totalJS = results.content.minificationStatus.filter(f => f.file.endsWith('.js')).length;
  console.log(`   📦 JS Minification: ${minifiedJS}/${totalJS} files minified`);
  console.log();

  // Assets
  console.log('🖼️  ASSETS:');
  console.log(`   Total Asset Size: ${formatBytes(results.assets.totalSize)}`);
  console.log(`   Images: ${results.assets.images.length}`);
  console.log(`   Icons: ${results.assets.icons.length}`);

  if (results.assets.optimizationSuggestions.length > 0) {
    console.log(`   💡 Optimization Suggestions: ${results.assets.optimizationSuggestions.length}`);
  }
  console.log();

  // Extension
  console.log('🔌 CHROME EXTENSION:');
  console.log(`   Manifest Present: ${results.extension.manifestPresent ? '✅' : '❌'}`);
  console.log(`   Manifest Valid: ${results.extension.manifestValid ? '✅' : '❌'}`);
  console.log(`   Popup Present: ${results.extension.popupPresent ? '✅' : '❌'}`);
  console.log(`   Icons Present: ${results.extension.iconsPresent ? '✅' : '❌'}`);

  if (results.extension.errors.length > 0) {
    console.log(`   ❌ Extension Errors: ${results.extension.errors.length}`);
    results.extension.errors.forEach(error => {
      console.log(`      - ${error}`);
    });
  }
  console.log();

  // Security
  console.log('🔒 SECURITY:');
  console.log(`   No Inline Scripts: ${results.security.noInlineScripts ? '✅' : '❌'}`);
  console.log(`   No Unsafe Eval: ${results.security.noUnsafeEval ? '✅' : '❌'}`);
  console.log(`   No Secrets: ${results.security.noSecrets ? '✅' : '❌'}`);

  if (results.security.issues.length > 0) {
    console.log(`   ⚠️  Security Issues: ${results.security.issues.length}`);
    results.security.issues.forEach(issue => {
      console.log(`      - ${issue}`);
    });
  }
  console.log();

  // Summary
  console.log('🎯 SUMMARY:');
  if (score >= 90) {
    console.log('   ✅ BUILD OUTPUT PASSED - Ready for production');
  } else if (score >= 70) {
    console.log('   ⚠️  BUILD OUTPUT NEEDS ATTENTION - Minor issues found');
  } else {
    console.log('   ❌ BUILD OUTPUT FAILED - Major issues found');
  }

  console.log('\n📝 Detailed report saved to: build-audit-results.json');

  // Save detailed results
  fs.writeFileSync(
    'build-audit-results.json',
    JSON.stringify(
      {
        score,
        grade: getGrade(score),
        timestamp: new Date().toISOString(),
        results,
      },
      null,
      2
    )
  );
}

/**
 * Utility functions
 */
function getAllFilesRecursive(dir) {
  const files = [];

  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip certain directories
          if (!item.startsWith('.') && item !== 'node_modules') {
            scan(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  scan(dir);
  return files;
}

function checkIfMinified(content) {
  // Simple heuristics for minification
  const lines = content.split('\n');
  const avgLineLength = content.length / lines.length;
  const hasWhitespace = content.includes('  '); // Multiple spaces

  // Minified JS typically has very long lines and minimal whitespace
  return avgLineLength > 100 && !hasWhitespace;
}

function checkIfCSSMinified(content) {
  // CSS minification removes most whitespace and newlines
  const lines = content.split('\n');
  const avgLineLength = content.length / lines.length;

  return avgLineLength > 50;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getGrade(score) {
  if (score >= 90) return '(Grade A)';
  if (score >= 80) return '(Grade B)';
  if (score >= 70) return '(Grade C)';
  if (score >= 60) return '(Grade D)';
  return '(Grade F)';
}

// Run the audit
if (import.meta.url === `file://${process.argv[1]}`) {
  runBuildAudit()
    .then(result => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Build audit failed:', error);
      process.exit(1);
    });
}

export { runBuildAudit };

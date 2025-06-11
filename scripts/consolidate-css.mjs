#!/usr/bin/env node
/**
 * CSS Consolidation Script
 * Identifies duplicate selectors that can be merged to reduce file size
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Consolidate CSS rules in popup.css
 */
function consolidatePopupCSS() {
  const filePath = join(projectRoot, 'css/pages/popup.css');
  let content = readFileSync(filePath, 'utf8');

  console.log('🔧 Consolidating duplicate selectors in popup.css...');

  // Find and merge duplicate .filter-grid rules
  const filterGridRules = [];
  const lines = content.split('\n');
  let currentRule = '';
  let inRule = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('.filter-grid') && line.includes('{')) {
      // Start of filter-grid rule
      currentRule = line;
      inRule = true;
      braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    } else if (inRule) {
      currentRule += '\n' + line;
      braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (braceCount === 0) {
        filterGridRules.push({
          rule: currentRule,
          lineStart: i - currentRule.split('\n').length + 1,
        });
        inRule = false;
        currentRule = '';
      }
    }
  }

  if (filterGridRules.length > 1) {
    console.log(`   Found ${filterGridRules.length} .filter-grid rules to consolidate`);

    // Merge the properties
    const mergedProperties = new Set();
    filterGridRules.forEach(item => {
      const props = item.rule.match(/^\s*[^{}]+:\s*[^;}]+;/gm);
      if (props) {
        props.forEach(prop => mergedProperties.add(prop.trim()));
      }
    });

    // Create consolidated rule
    const consolidatedRule = `.filter-grid {
  ${Array.from(mergedProperties).join('\n  ')}
}`;

    console.log('   Consolidated rule created');
    console.log('   ⚠️  Manual review required - check for conflicting properties');
  }

  return content;
}

/**
 * Consolidate CSS rules in cards.css
 */
function consolidateCardsCSS() {
  const filePath = join(projectRoot, 'css/components/cards.css');
  let content = readFileSync(filePath, 'utf8');

  console.log('🔧 Analyzing cards.css for consolidation opportunities...');

  // Find all .prompt-item rules
  const promptItemMatches = content.match(/\.prompt-item[^{]*{[^}]*}/g);
  if (promptItemMatches && promptItemMatches.length > 1) {
    console.log(`   Found ${promptItemMatches.length} .prompt-item rules`);

    // Group by selector specificity
    const basePromptItem = promptItemMatches.filter(
      rule => rule.match(/^\.prompt-item\s*{/) || rule.match(/^\.prompt-card,\s*\.prompt-item\s*{/)
    );

    if (basePromptItem.length > 1) {
      console.log('   ⚠️  Multiple base .prompt-item rules found - consider consolidating');
      console.log('   📝 Manual consolidation recommended for safety');
    }
  }

  return content;
}

/**
 * Generate CSS optimization report
 */
function generateOptimizationReport() {
  console.log('\n📊 CSS Consolidation Report\n');

  const filesToAnalyze = [
    { name: 'popup.css', path: 'css/pages/popup.css' },
    { name: 'cards.css', path: 'css/components/cards.css' },
    { name: 'prompt-details.css', path: 'css/pages/prompt-details.css' },
  ];

  filesToAnalyze.forEach(file => {
    const content = readFileSync(join(projectRoot, file.path), 'utf8');
    const rules = content.match(/[^{}]+{[^}]*}/g) || [];
    const selectors = rules.map(rule => rule.split('{')[0].trim());

    // Find duplicates
    const selectorCount = {};
    selectors.forEach(selector => {
      selectorCount[selector] = (selectorCount[selector] || 0) + 1;
    });

    const duplicates = Object.entries(selectorCount).filter(([_, count]) => count > 1);

    console.log(`📄 ${file.name}:`);
    console.log(`   Total rules: ${rules.length}`);
    console.log(`   Duplicate selectors: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('   Duplicates found:');
      duplicates.slice(0, 5).forEach(([selector, count]) => {
        console.log(`     "${selector}" appears ${count} times`);
      });
      if (duplicates.length > 5) {
        console.log(`     ... and ${duplicates.length - 5} more`);
      }
    }
    console.log('');
  });

  console.log('🎯 Recommended Actions:');
  console.log('   1. Review duplicate selectors manually');
  console.log('   2. Merge compatible rules with same selectors');
  console.log('   3. Use CSS custom properties for repeated values');
  console.log('   4. Consider CSS logical grouping for better maintainability');
  console.log('');

  console.log('⚡ Quick Wins:');
  console.log('   • Remove debug/testing styles (already done)');
  console.log('   • Consolidate !important usage (partially done)');
  console.log('   • Merge duplicate utility classes');
  console.log('   • Optimize specificity to avoid conflicts');
}

// Run consolidation analysis
async function main() {
  console.log('🧹 CSS Consolidation Analysis\n');

  try {
    consolidatePopupCSS();
    consolidateCardsCSS();
    generateOptimizationReport();

    console.log('✅ CSS consolidation analysis complete!');
    console.log('💡 Run npm run css:purge && npm run css:analyze to see updated metrics');
  } catch (error) {
    console.error('❌ Error during consolidation:', error);
    process.exit(1);
  }
}

main().catch(console.error);

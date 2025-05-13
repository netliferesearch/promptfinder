const { PurgeCSS } = require('purgecss');
const fs = require('fs');
const path = require('path');

async function analyzeCSS() {
  console.log('Analyzing CSS usage in the PromptFinder extension...');

  const result = await new PurgeCSS().purge({
    content: [
      './popup.html',
      './add-prompt.html',
      './edit-prompt.html',
      './**/*.js', // Include all JavaScript files
    ],
    css: [
      './css/**/*.css', // Include all CSS files
    ],
    safelist: {
      standard: ['active', 'hidden', 'show', 'fa-*'],
      deep: [/^fa-/], // For Font Awesome icons
      greedy: [/^button/, /^form/, /^card/], // For dynamically added classes
    },
  });

  // Create a directory for optimized CSS
  if (!fs.existsSync('./css-optimized')) {
    fs.mkdirSync('./css-optimized', { recursive: true });
    fs.mkdirSync('./css-optimized/base', { recursive: true });
    fs.mkdirSync('./css-optimized/components', { recursive: true });
    fs.mkdirSync('./css-optimized/layout', { recursive: true });
    fs.mkdirSync('./css-optimized/pages', { recursive: true });
  }

  // Create a CSS usage report
  let reportContent = '# CSS Usage Analysis Report\n\n';

  result.forEach(file => {
    const originalPath = file.file;
    const fileName = path.basename(originalPath);
    const dirPath = path.dirname(originalPath).replace('./css', './css-optimized');

    const originalSize = fs.readFileSync(originalPath, 'utf8').length;
    const optimizedSize = file.css.length;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

    reportContent += `## ${fileName}\n`;
    reportContent += `- Original size: ${originalSize} bytes\n`;
    reportContent += `- Optimized size: ${optimizedSize} bytes\n`;
    reportContent += `- Reduction: ${reduction}%\n\n`;

    fs.writeFileSync(path.join(dirPath, fileName), file.css);
    console.log(`Optimized ${fileName} - Saved ${reduction}% space`);
  });

  // Create the global.css file for the optimized version
  const originalGlobalCss = fs.readFileSync('./css/global.css', 'utf8');
  fs.writeFileSync('./css-optimized/global.css', originalGlobalCss);

  // Save the report
  fs.writeFileSync('./css-usage-report.md', reportContent);
  console.log('Analysis complete! See css-usage-report.md for details.');
}

analyzeCSS().catch(err => console.error('Error analyzing CSS:', err));

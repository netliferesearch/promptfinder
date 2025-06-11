#!/usr/bin/env node
/**
 * Icon Optimization Script
 * Optimizes PNG icons for Chrome Web Store submission
 * Uses lossless and lossy compression for optimal file sizes
 */

import imagemin from 'imagemin';
import imageminOptipng from 'imagemin-optipng';
import imageminPngquant from 'imagemin-pngquant';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = readFileSync(filePath);
    return stats.length;
  } catch (error) {
    return 0;
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Optimize PNG icons
 */
async function optimizeIcons() {
  console.log('🎨 Starting icon optimization...\n');

  const iconsDir = join(projectRoot, 'icons');
  const optimizedDir = join(projectRoot, 'icons-optimized');

  // Get original file sizes
  const originalSizes = {
    'icon16.png': getFileSize(join(iconsDir, 'icon16.png')),
    'icon48.png': getFileSize(join(iconsDir, 'icon48.png')),
    'icon128.png': getFileSize(join(iconsDir, 'icon128.png')),
  };

  console.log('📊 Original sizes:');
  Object.entries(originalSizes).forEach(([file, size]) => {
    console.log(`  ${file}: ${formatBytes(size)}`);
  });
  console.log('');

  try {
    // Optimize with lossless compression first (OptPNG)
    console.log('🔧 Applying lossless optimization (OptPNG)...');
    const losslessFiles = await imagemin([join(iconsDir, '*.png')], {
      destination: optimizedDir,
      plugins: [
        imageminOptipng({
          optimizationLevel: 7, // Maximum compression
          bitDepthReduction: true,
          colorTypeReduction: true,
          paletteReduction: true,
        }),
      ],
    });

    console.log(`✅ Lossless optimization complete: ${losslessFiles.length} files processed\n`);

    // For larger icons (48px and 128px), apply additional lossy compression if beneficial
    console.log('🎯 Applying targeted lossy optimization (PngQuant)...');

    // Check if 128px icon is still large after lossless compression
    const icon128Path = join(optimizedDir, 'icon128.png');
    const icon128Size = getFileSize(icon128Path);

    if (icon128Size > 15000) {
      // If still larger than 15KB
      console.log('  📉 128px icon still large, applying lossy compression...');

      const lossyFiles = await imagemin([icon128Path], {
        destination: optimizedDir,
        plugins: [
          imageminPngquant({
            quality: [0.8, 0.95], // High quality lossy compression
            strip: true, // Remove metadata
            dithering: 0.5,
          }),
        ],
      });

      console.log(`  ✅ Lossy optimization applied to ${lossyFiles.length} large icons`);
    }

    // Get optimized file sizes
    console.log('\n📊 Optimization results:');
    const optimizedSizes = {
      'icon16.png': getFileSize(join(optimizedDir, 'icon16.png')),
      'icon48.png': getFileSize(join(optimizedDir, 'icon48.png')),
      'icon128.png': getFileSize(join(optimizedDir, 'icon128.png')),
    };

    let totalOriginal = 0;
    let totalOptimized = 0;

    Object.entries(originalSizes).forEach(([file, originalSize]) => {
      const optimizedSize = optimizedSizes[file];
      const reduction = originalSize - optimizedSize;
      const reductionPercent = ((reduction / originalSize) * 100).toFixed(1);

      totalOriginal += originalSize;
      totalOptimized += optimizedSize;

      console.log(`  ${file}:`);
      console.log(`    Original:  ${formatBytes(originalSize)}`);
      console.log(`    Optimized: ${formatBytes(optimizedSize)}`);
      console.log(`    Saved:     ${formatBytes(reduction)} (${reductionPercent}%)`);
      console.log('');
    });

    const totalReduction = totalOriginal - totalOptimized;
    const totalReductionPercent = ((totalReduction / totalOriginal) * 100).toFixed(1);

    console.log(`🎉 Total optimization results:`);
    console.log(`   Original total:  ${formatBytes(totalOriginal)}`);
    console.log(`   Optimized total: ${formatBytes(totalOptimized)}`);
    console.log(`   Total saved:     ${formatBytes(totalReduction)} (${totalReductionPercent}%)`);
    console.log('');

    // Chrome Web Store guidelines check
    console.log('📋 Chrome Web Store compliance check:');
    const maxRecommended = 128 * 1024; // 128KB recommended max for all icons combined
    const withinLimits = totalOptimized <= maxRecommended;

    console.log(`   Combined size: ${formatBytes(totalOptimized)}`);
    console.log(`   Recommended max: ${formatBytes(maxRecommended)}`);
    console.log(`   Status: ${withinLimits ? '✅ Within limits' : '⚠️ Exceeds recommended size'}`);

    if (withinLimits) {
      console.log('');
      console.log('🎯 Icons are optimized and ready for Chrome Web Store submission!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Review optimized icons in icons-optimized/ directory');
      console.log('2. If satisfied with quality, replace original icons');
      console.log('3. Update build process to use optimized icons');
    }
  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
}

// Run optimization
optimizeIcons().catch(console.error);

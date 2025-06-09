#!/usr/bin/env node

import { PurgeCSS } from 'purgecss';
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

async function purgeCSSFiles() {
  console.log('🧹 Starting CSS purge process...');

  const config = {
    content: [
      join(projectRoot, 'pages/**/*.html'),
      join(projectRoot, 'js/**/*.js'),
      join(projectRoot, 'dist/js/**/*.js'),
      join(projectRoot, '*.js'),
    ],
    css: [join(projectRoot, 'css/**/*.css')],
    safelist: {
      standard: [
        // All classes from HTML inspection
        'popup-container',
        'pf-header',
        'pf-header__icon',
        'header-actions',
        'main-controls',
        'category-sort-bar',
        'category-dropdown-wrapper',
        'category-dropdown',
        'category-input-icon',
        'form-input',
        'sort-row',
        'sort-dropdown-wrapper',
        'sort-dropdown',
        'sort-input-icon',
        'tabs',
        'filter-sort-row',
        'sticky-search-header',
        'search-bar',
        'search-input',
        'search-input-icon',
        'prompt-counter-row',
        'fab',
        'detail-card',
        'prompt-card-btn',
        'prompt-item__header',
        'prompt-item__title',
        'prompt-item__actions',
        'prompt-item__category',
        'button',
        'button-primary',
        'button-secondary',
        'button-tertiary',
        'button-danger',
        'button-link',
        'button-sm',
        'toggle-favorite',
        'back-to-list-btn',
        'copy-prompt-label',
        'detail-label',
        'detail-card__main',
        'detail-card__description',
        'detail-card__prompt',
        'prompt-text-container',
        'code-block-wrapper',
        'detail-card__meta',
        'prompt-meta',
        'ratings-section',
        'user-rating-section',
        'star-rating-wrapper',
        'interactive-stars',
        'read-only-stars',
        'community-rating-section',
        'rating-message-label',
        'prompt-owner-actions',
        'section-divider',
        'prompt-edit-actions',
        'hidden',
        'active',
        'visually-hidden',

        // Analytics-related classes
        'analytics-status',
        'debug-panel',
        'console-output',
        'validation-result',
        'error-message',
        'warning-message',
        'success-message',
        'info-message',
        'analytics-enabled',
        'analytics-disabled',
        'realtime-status',
        'performance-metrics',
        'event-status',
        'ga4-debug',
        'validation-score',
        'test-mode',
        'analytics-error',
        'tracking-disabled',

        // Font Awesome classes
        'fa',
        'fas',
        'far',
        'fab',
        'fa-solid',
        'fa-regular',
        'fa-search',
        'fa-list',
        'fa-filter',
        'fa-heart',
        'fa-lock',
        'fa-plus',
        'fa-copy',
        'fa-edit',
        'fa-trash',
        'fa-arrow-left',
        'fa-arrow-down-wide-short',
        'fa-user-circle',
        'fa-star',
        'fa-star-half-alt',
      ],

      deep: [
        /^fa-/, // All Font Awesome icons
        /^prompt-/, // All prompt-related classes
        /^button/, // All button variants
        /^form/, // All form classes
        /^search/, // All search classes
        /^category/, // All category classes
        /^sort/, // All sort classes
        /^sticky/, // All sticky classes
        /^detail/, // All detail classes
        /^rating/, // All rating classes
        /^star/, // All star classes
        /^header/, // All header classes
        /^main/, // All main classes
        /^tab/, // All tab classes
        /^card/, // All card classes
        /^toast/, // All toast classes
        /^filter/, // All filter classes
        /^community/, // All community classes
        /^user/, // All user classes
        /^edit/, // All edit classes
        /^add/, // All add classes
        /^copy/, // All copy classes
        /^toggle/, // All toggle classes
        /^back/, // All back classes
        /^language-/, // Prism.js syntax highlighting

        // Analytics-related classes
        /^analytics/, // Analytics UI elements
        /^debug/, // Debug UI elements
        /^console/, // Console-related UI
        /^tracker/, // Tracker UI elements
        /^ga4/, // GA4-specific classes
        /^validation/, // Validation UI elements
        /^error/, // Error display classes
        /^warning/, // Warning display classes
        /^success/, // Success display classes
        /^info/, // Info display classes
        /^realtime/, // Realtime validation UI
        /^performance/, // Performance monitoring UI
        /^testing/, // Testing utility UI
        /^event/, // Event-related UI classes
        /^metrics/, // Metrics display classes
        /^status/, // Status indicator classes
      ],
    },
    fontFace: true,
    keyframes: true,
    variables: true,
  };

  try {
    const purgeCSSResult = await new PurgeCSS().purge(config);

    // Ensure output directories exist
    const outputDir = join(projectRoot, 'dist/css-purged');
    await ensureDir(outputDir);
    await ensureDir(join(outputDir, 'base'));
    await ensureDir(join(outputDir, 'components'));
    await ensureDir(join(outputDir, 'layout'));
    await ensureDir(join(outputDir, 'pages'));

    // Write purged CSS files
    for (const result of purgeCSSResult) {
      const originalPath = result.file;
      const fileName = basename(originalPath);
      const outputPath = join(outputDir, fileName);

      await fs.writeFile(outputPath, result.css);

      const originalSize = (await fs.stat(originalPath)).size;
      const purgedSize = Buffer.byteLength(result.css, 'utf8');
      const reduction = (((originalSize - purgedSize) / originalSize) * 100).toFixed(1);

      console.log(`✅ ${fileName}: ${originalSize}B → ${purgedSize}B (${reduction}% reduction)`);
    }

    console.log('🎉 CSS purge completed successfully!');
  } catch (error) {
    console.error('❌ Error during CSS purge:', error);
    process.exit(1);
  }
}

purgeCSSFiles();

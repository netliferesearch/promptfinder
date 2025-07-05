#!/usr/bin/env node
import { copyFile, mkdir, readdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function copyExternalModules() {
  console.log('🔄 Copying external modules for dynamic imports...');

  // Create target directories
  const targetDir = join(rootDir, 'dist', 'js', 'js');

  await mkdir(targetDir, { recursive: true });

  // NOTE: Most files are now processed by Rollup and automatically minified
  // This script now only handles special cases that can't go through Rollup

  // Copy bundled firebase-init.js and create ES module wrapper
  try {
    const bundledFirebaseSrc = join(rootDir, 'dist', 'js', 'firebase-init.js');
    let bundledContent = await readFile(bundledFirebaseSrc, 'utf8');

    // Remove problematic remote script loading code for Chrome Web Store compliance
    console.log('🔧 Removing remote script loading code from Firebase bundle...');

    // Remove _loadJS function definition and calls
    bundledContent = bundledContent.replace(
      /function _loadJS\(url\)\s*{[^}]*}/g,
      'function _loadJS(url) { return Promise.resolve(); }'
    );

    // Remove specific problematic URLs
    bundledContent = bundledContent.replace(
      /_loadJS\(`https:\/\/apis\.google\.com\/js\/api\.js[^`]*`\)/g,
      'Promise.resolve()'
    );

    bundledContent = bundledContent.replace(
      /_loadJS\(RECAPTCHA_ENTERPRISE_URL[^)]*\)/g,
      'Promise.resolve()'
    );

    // Remove any remaining references to remote script URLs
    bundledContent = bundledContent.replace(/https:\/\/apis\.google\.com\/js\/api\.js/g, '""');

    bundledContent = bundledContent.replace(
      /https:\/\/www\.google\.com\/recaptcha\/api\.js/g,
      '""'
    );

    bundledContent = bundledContent.replace(
      /https:\/\/www\.google\.com\/recaptcha\/enterprise\.js/g,
      '""'
    );

    // Remove reCAPTCHA constants
    bundledContent = bundledContent.replace(
      /const RECAPTCHA_ENTERPRISE_URL = [^;]*;/g,
      'const RECAPTCHA_ENTERPRISE_URL = "";'
    );

    bundledContent = bundledContent.replace(
      /const RECAPTCHA_V2_URL = [^;]*;/g,
      'const RECAPTCHA_V2_URL = "";'
    );

    // Write the cleaned content back
    await writeFile(bundledFirebaseSrc, bundledContent, 'utf8');
    console.log('✅ Removed remote script loading code from Firebase bundle');

    // Create ES module wrapper that executes the IIFE and exports the results
    const esModuleWrapper = `// ES Module wrapper for bundled Firebase (IIFE format)
// Execute the IIFE and capture the exports
const firebaseExports = ${bundledContent.replace('var FirebaseInit = ', '').replace(/\n\/\/# sourceMappingURL.*$/, '')};

// Export the Firebase instances that were returned by the IIFE
export const auth = firebaseExports.auth;
export const db = firebaseExports.db;
export const functions = firebaseExports.functions;
export const enableNetwork = firebaseExports.enableNetwork;
export const disableNetwork = firebaseExports.disableNetwork;

// Export Firebase auth functions
export const createUserWithEmailAndPassword = firebaseExports.createUserWithEmailAndPassword;
export const signInWithEmailAndPassword = firebaseExports.signInWithEmailAndPassword;
export const firebaseSignOut = firebaseExports.firebaseSignOut;
export const firebaseOnAuthStateChanged = firebaseExports.firebaseOnAuthStateChanged;
export const GoogleAuthProvider = firebaseExports.GoogleAuthProvider;
export const signInWithCredential = firebaseExports.signInWithCredential;
export const updateProfile = firebaseExports.updateProfile;
export const sendPasswordResetEmail = firebaseExports.sendPasswordResetEmail;
export const firebaseSendEmailVerification = firebaseExports.firebaseSendEmailVerification;
export const firebaseReload = firebaseExports.firebaseReload;

// Export Firebase firestore functions
export const collection = firebaseExports.collection;
export const doc = firebaseExports.doc;
export const setDoc = firebaseExports.setDoc;
export const addDoc = firebaseExports.addDoc;
export const getDoc = firebaseExports.getDoc;
export const getDocs = firebaseExports.getDocs;
export const updateDoc = firebaseExports.updateDoc;
export const deleteDoc = firebaseExports.deleteDoc;
export const query = firebaseExports.query;
export const where = firebaseExports.where;
export const serverTimestamp = firebaseExports.serverTimestamp;
export const Timestamp = firebaseExports.Timestamp;

// Export Firebase functions
export const httpsCallable = firebaseExports.httpsCallable;
`;

    const targetFirebaseFile = join(targetDir, 'firebase-init.js');
    await writeFile(targetFirebaseFile, esModuleWrapper, 'utf8');
    console.log('✅ Created firebase-init.js ES module wrapper with IIFE');
  } catch (error) {
    console.error('❌ Error processing firebase-init.js:', error);
    throw error;
  }

  console.log('✅ External modules copied successfully!');
  console.log(
    '📝 Note: Source files (ui.js, analytics/, etc.) are now processed by Rollup and automatically minified'
  );
}

copyExternalModules().catch(console.error);

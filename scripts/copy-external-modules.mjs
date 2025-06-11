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
  const analyticsTargetDir = join(targetDir, 'analytics');

  await mkdir(targetDir, { recursive: true });
  await mkdir(analyticsTargetDir, { recursive: true });

  // Copy oauth-config.js from config directory
  try {
    const oauthConfigSrc = join(rootDir, 'config', 'oauth-config.js');
    const oauthConfigDest = join(targetDir, 'oauth-config.js');
    await copyFile(oauthConfigSrc, oauthConfigDest);
    console.log(`✅ Copied oauth-config.js from config/`);
  } catch (error) {
    console.warn(`⚠️  Failed to copy oauth-config.js:`, error.message);
  }

  // Copy external modules (with special handling for promptData.js)
  const externalFiles = [
    'ui.js',
    'firebase-connection-handler.js',
    'utils.js',
    'categories.js',
    'text-constants.js',
  ];

  for (const file of externalFiles) {
    const src = join(rootDir, 'js', file);
    const dest = join(targetDir, file);
    try {
      await copyFile(src, dest);
      console.log(`✅ Copied ${file}`);
    } catch (error) {
      console.warn(`⚠️  Failed to copy ${file}:`, error.message);
    }
  }

  // Copy promptData.js with fixed import path for oauth-config.js
  try {
    const promptDataSrc = join(rootDir, 'js', 'promptData.js');
    const promptDataContent = await readFile(promptDataSrc, 'utf8');

    // Fix the oauth-config import path from '../config/oauth-config.js' to './oauth-config.js'
    const fixedContent = promptDataContent.replace(
      "import { getOAuth2Config } from '../config/oauth-config.js';",
      "import { getOAuth2Config } from './oauth-config.js';"
    );

    const promptDataDest = join(targetDir, 'promptData.js');
    await writeFile(promptDataDest, fixedContent);
    console.log(`✅ Copied promptData.js with fixed oauth-config import path`);
  } catch (error) {
    console.warn(`⚠️  Failed to copy promptData.js:`, error.message);
  }

  // Copy bundled firebase-init.js and create ES module wrapper
  try {
    const bundledFirebaseSrc = join(rootDir, 'dist', 'js', 'firebase-init.js');
    const bundledContent = await readFile(bundledFirebaseSrc, 'utf8');

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

    const wrapperDest = join(targetDir, 'firebase-init.js');
    await writeFile(wrapperDest, esModuleWrapper);
    console.log(`✅ Created firebase-init.js ES module wrapper with IIFE`);
  } catch (error) {
    console.warn(`⚠️  Failed to create firebase-init wrapper:`, error.message);
  }

  // Copy analytics modules
  const analyticsDir = join(rootDir, 'js', 'analytics');
  try {
    const analyticsFiles = await readdir(analyticsDir);
    for (const file of analyticsFiles) {
      if (file.endsWith('.js')) {
        const src = join(analyticsDir, file);
        const dest = join(analyticsTargetDir, file);
        await copyFile(src, dest);
        console.log(`✅ Copied analytics/${file}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Failed to copy analytics modules:', error.message);
  }

  // Copy vendor modules
  const vendorDir = join(rootDir, 'js', 'vendor');
  const vendorTargetDir = join(targetDir, 'vendor');

  try {
    await mkdir(vendorTargetDir, { recursive: true });
    const vendorFiles = await readdir(vendorDir);
    for (const file of vendorFiles) {
      if (file.endsWith('.js')) {
        const src = join(vendorDir, file);
        const dest = join(vendorTargetDir, file);
        await copyFile(src, dest);
        console.log(`✅ Copied vendor/${file}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Failed to copy vendor files:', error.message);
  }

  console.log('✅ External modules copied successfully!');
}

copyExternalModules().catch(error => {
  console.error('❌ Failed to copy external modules:', error);
  process.exit(1);
});

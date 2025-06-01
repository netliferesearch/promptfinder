import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
// --- Search libraries ---
import type { IFuseOptions } from 'fuse.js';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Fuse.js options (field weighting and typo tolerance)
const fuseOptions: IFuseOptions<any> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.2 },
    { name: 'text', weight: 0.2 },
    { name: 'category', weight: 0.1 },
    { name: 'tags', weight: 0.1 },
  ],
  includeScore: true,
  includeMatches: true, // Needed to determine which fields matched
  threshold: 0.4, // typo tolerance
  useExtendedSearch: true,
};

/**
 * searchPrompts Cloud Function
 * Accepts a search query and returns ranked prompt results.
 */
export async function searchPromptsHandler(request: any): Promise<any> {
  // Dynamically import Fuse.js for ESM/CJS compatibility
  const FuseModule = await import('fuse.js');
  const Fuse = FuseModule.default || FuseModule;

  // Start timing
  const startTime = Date.now();

  // Input validation
  const { query, limit } = request.data || {};

  if (typeof query !== 'string' || !query.trim()) {
    throw new functions.HttpsError('invalid-argument', 'A non-empty search query is required.');
  }

  // Optional: limit number of results
  const resultLimit = typeof limit === 'number' && limit > 0 && limit <= 100 ? limit : 20;

  // Optional: userId for private prompt access
  // (Assume authentication is handled by callable context)
  const authUserId = request.auth?.uid || null;

  // Fetch prompts from Firestore (public and, if authenticated, private)
  let prompts: any[] = [];
  try {
    // Fetch all public prompts (limit to 1000 for performance)
    const publicSnap = await db
      .collection('prompts')
      .where('isPrivate', '==', false)
      .limit(1000)
      // Only fetch required fields for search
      .select('title', 'description', 'text', 'category', 'tags', 'isPrivate', 'userId')
      .get();
    const publicPrompts = publicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    prompts = publicPrompts;

    // If authenticated, fetch user's private prompts as well (limit to 1000)
    if (authUserId) {
      const privateSnap = await db
        .collection('prompts')
        .where('isPrivate', '==', true)
        .where('userId', '==', authUserId)
        .limit(1000)
        // Only fetch required fields for search
        .select('title', 'description', 'text', 'category', 'tags', 'isPrivate', 'userId')
        .get();
      const privatePrompts = privateSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      prompts = prompts.concat(privatePrompts);
    }
  } catch (error) {
    throw new functions.HttpsError('internal', 'Failed to fetch prompts from Firestore.');
  }

  // Edge case: No prompts found
  if (!prompts.length) {
    const duration = Date.now() - startTime;
    return {
      results: [],
      total: 0,
      durationMs: duration,
      message: 'No prompts found for search.'
    };
  }

  // Structure data for downstream search processing
  // Only include necessary fields for search to optimize memory usage
  const searchData = prompts.map((prompt: any) => ({
    id: prompt.id,
    title: prompt.title || '',
    description: prompt.description || '',
    text: prompt.text || '',
    category: prompt.category || '',
    tags: Array.isArray(prompt.tags) ? (prompt.tags as string[]) : [],
    isPrivate: !!prompt.isPrivate,
    userId: prompt.userId || '',
    // Add other fields as needed for search/ranking
  }));

  // --- Fuse.js search with field weighting and cumulative scoring ---
  const fuse = new Fuse(searchData, fuseOptions);
  const fuseResults = fuse.search(query, { limit: resultLimit });

  // Ensure exact matches are ranked above partial/fuzzy matches
  const lowerQuery = query.trim().toLowerCase();

  const results = fuseResults.map((res: any) => {
    // Count unique fields matched
    const matchedFields = new Set(
      (res.matches || []).map((m: any) => m.key)
    );
    const numFieldsMatched = matchedFields.size;
    let adjustedScore = res.score;

    // Check for exact match in any field
    let isExactMatch = false;
    for (const match of res.matches || []) {
      const fieldValue = match.value;
      if (typeof fieldValue === 'string') {
        if (fieldValue.trim().toLowerCase() === lowerQuery) {
          isExactMatch = true;
          break;
        }
      } else if (Array.isArray(fieldValue)) {
        // For tags (array), check if any tag is an exact match
        if ((fieldValue as string[]).some((tag: string) => tag.trim().toLowerCase() === lowerQuery)) {
          isExactMatch = true;
          break;
        }
      }
    }
    // Apply strong score boost for exact matches
    if (isExactMatch && typeof adjustedScore === 'number') {
      adjustedScore = 0.001; // Absolute top
    } else if (res.item.title && typeof res.item.title === 'string' && res.item.title.trim().toLowerCase().startsWith(lowerQuery)) {
      adjustedScore = 0.01; // Just below exact match
    } else if (numFieldsMatched > 1 && typeof adjustedScore === 'number') {
      // For each additional field beyond one, apply a small score reduction (lower is better)
      adjustedScore = adjustedScore * Math.pow(0.95, numFieldsMatched - 1);
    }
    return {
      id: res.item.id,
      title: res.item.title,
      description: res.item.description,
      text: res.item.text,
      category: res.item.category,
      tags: res.item.tags,
      isPrivate: res.item.isPrivate,
      userId: res.item.userId,
      score: adjustedScore,
      fieldsMatched: Array.from(matchedFields),
      isExactMatch,
      matchedIn: Array.from(matchedFields),
      // matchFields: to be expanded in later tasks
    };
  });

  // Sort results by adjusted score (lower is better)
  results.sort((a: any, b: any) => (a.score ?? 1) - (b.score ?? 1));

  // End timing
  const duration = Date.now() - startTime;

  // Console log for server-side search timing
  console.log('[PromptFinder][searchPrompts] query="' + query + '" userId=' + (authUserId || 'public') + ' durationMs=' + duration);

  return {
    results,
    total: results.length,
    durationMs: duration,
    message: 'Search completed with exact match boost.'
  };
}

// The onCall export just wraps the handler:
export const searchPrompts = onCall(
  { region: 'europe-west1' },
  async (request) => {
    return await searchPromptsHandler(request);
  }
); 
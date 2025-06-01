// Move Firestore mocks to the very top
jest.mock('firebase-admin', () => {
  const original = jest.requireActual('firebase-admin');
  return {
    ...original,
    firestore: jest.fn(),
    apps: [],
    initializeApp: jest.fn(),
  };
});

const mockFirestore = {
  collection: jest.fn(),
};

import * as admin from 'firebase-admin';
jest.spyOn(admin, 'firestore').mockReturnValue(mockFirestore as any);

// Now import the handler AFTER the mocks are set up
import { searchPromptsHandler } from './searchPrompts';

// Helper to mock Firestore query chains
function mockQueryChain(docs: any[]) {
  return {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: docs.map((d: any) => ({ id: d.id, data: () => d })) }),
  };
}

describe('searchPrompts Cloud Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw on empty query', async () => {
    const request: any = { data: { query: '' }, auth: { uid: 'user1' } };
    await expect(searchPromptsHandler(request)).rejects.toThrow('A non-empty search query is required.');
  });

  it('should return no results if no prompts exist', async () => {
    mockFirestore.collection.mockReturnValue(mockQueryChain([]));
    const request: any = { data: { query: 'test' }, auth: { uid: 'user1' } };
    const res = await searchPromptsHandler(request);
    expect(res.results).toEqual([]);
    expect(res.total).toBe(0);
  });

  it('should return public prompts matching the query', async () => {
    const prompts = [
      { id: '1', title: 'Test Prompt', description: 'desc', text: 'body', category: 'cat', tags: ['tag'], isPrivate: false, userId: 'user1' },
      { id: '2', title: 'Other', description: 'desc', text: 'body', category: 'cat', tags: ['tag'], isPrivate: false, userId: 'user2' },
    ];
    mockFirestore.collection.mockReturnValueOnce(mockQueryChain(prompts)).mockReturnValueOnce(mockQueryChain([]));
    const request: any = { data: { query: 'Test' }, auth: { uid: 'user1' } };
    const res = await searchPromptsHandler(request);
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.results[0].title).toBe('Test Prompt');
    expect(res.results[0].matchedIn).toContain('title');
  });

  it('should only return private prompts to their owner', async () => {
    const publicPrompts: any[] = [];
    const privatePrompts: any[] = [
      { id: '3', title: 'Private Prompt', description: '', text: '', category: '', tags: [], isPrivate: true, userId: 'user1' },
    ];
    mockFirestore.collection.mockReturnValueOnce(mockQueryChain(publicPrompts)).mockReturnValueOnce(mockQueryChain(privatePrompts));
    const request: any = { data: { query: 'Private' }, auth: { uid: 'user1' } };
    const res = await searchPromptsHandler(request);
    expect(res.results.length).toBe(1);
    expect(res.results[0].title).toBe('Private Prompt');
    expect(res.results[0].isPrivate).toBe(true);
  });

  it('should boost exact matches above partial matches', async () => {
    const prompts = [
      { id: '1', title: 'ExactMatch', description: '', text: '', category: '', tags: [], isPrivate: false, userId: 'user1' },
      { id: '2', title: 'Exact', description: '', text: '', category: '', tags: [], isPrivate: false, userId: 'user2' },
    ];
    mockFirestore.collection.mockReturnValueOnce(mockQueryChain(prompts)).mockReturnValueOnce(mockQueryChain([]));
    const request: any = { data: { query: 'ExactMatch' }, auth: { uid: 'user1' } };
    const res = await searchPromptsHandler(request);
    expect(res.results[0].title).toBe('ExactMatch');
    expect(res.results[0].isExactMatch).toBe(true);
  });

  // More tests can be added for multi-field boost, performance, etc.
}); 
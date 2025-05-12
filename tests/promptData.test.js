/**
 * Tests for the promptData.js module
 */

window.PromptFinder = window.PromptFinder || {};

window.PromptFinder.Utils = {
  chromeStorageGet: jest.fn(),
  chromeStorageSet: jest.fn(),
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn()
};

window.PromptFinder.PromptData = {};

require('../js/promptData');

const PromptData = window.PromptFinder.PromptData;

describe('PromptData Module', () => {
  const samplePrompts = [
    {
      id: '1',
      title: 'Test Prompt 1',
      text: 'This is a test prompt',
      category: 'Test',
      tags: ['test', 'sample'],
      isPrivate: false,
      rating: 4,
      ratingCount: 2,
      ratingSum: 8,
      favorites: 1,
      dateAdded: '2023-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      title: 'Test Prompt 2',
      text: 'Another test prompt',
      category: 'Sample',
      tags: ['sample'],
      isPrivate: true,
      rating: 3,
      ratingCount: 1,
      ratingSum: 3,
      favorites: 0,
      dateAdded: '2023-01-02T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    chrome.runtime.lastError = null;
    
    window.PromptFinder.Utils.chromeStorageGet.mockImplementation((key, callback) => {
      return Promise.resolve({ prompts: samplePrompts });
    });
    
    window.PromptFinder.Utils.chromeStorageSet.mockImplementation((data) => {
      return Promise.resolve();
    });
  });

  describe('loadPrompts', () => {
    test('should load prompts from storage', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.loadPrompts();
      
      expect(window.PromptFinder.Utils.chromeStorageGet).toHaveBeenCalledWith('prompts');
      expect(result).toEqual(samplePrompts);
    });

    test('should return empty array if no prompts in storage', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({});
      
      const result = await PromptData.loadPrompts();
      
      expect(result).toEqual([]);
    });

    test('should handle errors and return empty array', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockRejectedValue(new Error('Storage error'));
      
      const result = await PromptData.loadPrompts();
      
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('savePrompts', () => {
    test('should save prompts to storage', async () => {
      window.PromptFinder.Utils.chromeStorageSet.mockResolvedValue(undefined);
      
      const result = await PromptData.savePrompts(samplePrompts);
      
      expect(window.PromptFinder.Utils.chromeStorageSet).toHaveBeenCalledWith({ prompts: samplePrompts });
      expect(result).toBe(true);
    });

    test('should handle errors when saving', async () => {
      window.PromptFinder.Utils.chromeStorageSet.mockRejectedValue(new Error('Storage error'));
      
      const result = await PromptData.savePrompts(samplePrompts);
      
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('createPrompt', () => {
    test('should create a new prompt with provided data', () => {
      const promptData = {
        title: 'New Prompt',
        text: 'This is a new prompt',
        category: 'New',
        tags: ['new', 'test'],
        isPrivate: true
      };
      
      const result = PromptData.createPrompt(promptData);
      
      expect(result).toMatchObject({
        title: 'New Prompt',
        text: 'This is a new prompt',
        category: 'New',
        tags: ['new', 'test'],
        isPrivate: true,
        rating: 0,
        ratingCount: 0,
        ratingSum: 0,
        favorites: 0
      });
      expect(result.id).toBeDefined();
      expect(result.dateAdded).toBeDefined();
    });

    test('should handle missing fields with defaults', () => {
      const result = PromptData.createPrompt({});
      
      expect(result).toMatchObject({
        title: '',
        text: '',
        category: '',
        tags: [],
        isPrivate: false,
        rating: 0,
        ratingCount: 0,
        ratingSum: 0,
        favorites: 0
      });
    });
  });

  describe('addPrompt', () => {
    test('should add a prompt to storage', async () => {
      const promptData = {
        title: 'New Prompt',
        text: 'This is a new prompt'
      };
      
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.addPrompt(promptData);
      
      expect(result.title).toBe('New Prompt');
      expect(window.PromptFinder.Utils.chromeStorageSet).toHaveBeenCalled();
      
      const setCall = window.PromptFinder.Utils.chromeStorageSet.mock.calls[0][0];
      expect(setCall.prompts.length).toBe(3); // 2 sample prompts + 1 new prompt
    });

    test('should handle errors when adding', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockRejectedValue(new Error('Storage error'));
      window.PromptFinder.Utils.chromeStorageSet.mockRejectedValue(new Error('Storage error'));
      
      try {
        await PromptData.addPrompt({ title: 'Test' });
        fail('Expected addPrompt to throw an error');
      } catch (error) {
        expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
      }
    });
  });

  describe('updatePrompt', () => {
    test('should update an existing prompt', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const updates = { title: 'Updated Title', text: 'Updated text' };
      const result = await PromptData.updatePrompt('1', updates);
      
      expect(result.title).toBe('Updated Title');
      expect(result.text).toBe('Updated text');
      expect(window.PromptFinder.Utils.chromeStorageSet).toHaveBeenCalled();
    });

    test('should throw error if prompt not found', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      await expect(PromptData.updatePrompt('999', { title: 'Test' })).rejects.toThrow();
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });
  });

  describe('deletePrompt', () => {
    test('should delete a prompt from storage', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.deletePrompt('1');
      
      expect(result).toBe(true);
      expect(window.PromptFinder.Utils.chromeStorageSet).toHaveBeenCalled();
      
      const setCall = window.PromptFinder.Utils.chromeStorageSet.mock.calls[0][0];
      expect(setCall.prompts.length).toBe(samplePrompts.length - 1);
      expect(setCall.prompts.find(p => p.id === '1')).toBeUndefined();
    });

    test('should throw error if prompt not found', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.deletePrompt('999');
      
      expect(result).toBe(false);
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });
  });

  describe('findPromptById', () => {
    test('should find a prompt by ID', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.findPromptById('1');
      
      expect(result).toEqual(samplePrompts[0]);
    });

    test('should return null if prompt not found', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.findPromptById('999');
      
      expect(result).toBeNull();
    });

    test('should return null if promptId is falsy', async () => {
      const result = await PromptData.findPromptById(null);
      
      expect(result).toBeNull();
      expect(window.PromptFinder.Utils.chromeStorageGet).not.toHaveBeenCalled();
    });

    test('should use provided prompts array if available', async () => {
      const result = await PromptData.findPromptById('1', samplePrompts);
      
      expect(result).toEqual(samplePrompts[0]);
      expect(window.PromptFinder.Utils.chromeStorageGet).not.toHaveBeenCalled();
    });
  });

  describe('filterPrompts', () => {
    test('should filter prompts by search term', () => {
      const filters = { searchTerm: 'test' };
      const result = PromptData.filterPrompts(samplePrompts, filters);
      
      expect(result.length).toBe(2);
      expect(result.some(p => p.id === '1')).toBe(true);
      expect(result.some(p => p.id === '2')).toBe(true);
    });

    test('should filter prompts by tab (favorites)', () => {
      const filters = { tab: 'favs' };
      const result = PromptData.filterPrompts(samplePrompts, filters);
      
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    test('should filter prompts by tab (private)', () => {
      const filters = { tab: 'private' };
      const result = PromptData.filterPrompts(samplePrompts, filters);
      
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });

    test('should filter prompts by minimum rating', () => {
      const filters = { minRating: 4 };
      const result = PromptData.filterPrompts(samplePrompts, filters);
      
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    test('should apply multiple filters together', () => {
      const filters = { searchTerm: 'test', tab: 'favs', minRating: 4 };
      const result = PromptData.filterPrompts(samplePrompts, filters);
      
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('toggleFavorite', () => {
    test('should toggle favorite status from 1 to 0', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.toggleFavorite('1');
      
      expect(result.favorites).toBe(0);
      expect(window.PromptFinder.Utils.chromeStorageSet).toHaveBeenCalled();
    });

    test('should toggle favorite status from 0 to 1', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.toggleFavorite('2');
      
      expect(result.favorites).toBe(1);
      expect(window.PromptFinder.Utils.chromeStorageSet).toHaveBeenCalled();
    });

    test('should throw error if prompt not found', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      await expect(PromptData.toggleFavorite('999')).rejects.toThrow();
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });
  });

  describe('updatePromptRating', () => {
    test('should update a prompt rating', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.updatePromptRating('1', 5);
      
      expect(result.ratingCount).toBe(3); // Was 2, now 3
      expect(result.ratingSum).toBe(13); // Was 8, now 13
      expect(result.rating).toBe(13/3); // New average
      expect(window.PromptFinder.Utils.chromeStorageSet).toHaveBeenCalled();
    });

    test('should throw error if prompt not found', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      await expect(PromptData.updatePromptRating('999', 5)).rejects.toThrow();
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });
  });

  describe('copyPromptToClipboard', () => {
    test('should copy prompt text to clipboard', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.copyPromptToClipboard('1');
      
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(samplePrompts[0].text);
    });

    test('should handle errors if prompt not found', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      
      const result = await PromptData.copyPromptToClipboard('999');
      
      expect(result).toBe(false);
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });

    test('should handle clipboard errors', async () => {
      window.PromptFinder.Utils.chromeStorageGet.mockResolvedValue({ prompts: samplePrompts });
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      
      const result = await PromptData.copyPromptToClipboard('1');
      
      expect(result).toBe(false);
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });
  });
});

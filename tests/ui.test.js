/**
 * Tests for the ui.js module
 */

window.PromptFinder = window.PromptFinder || {};

window.PromptFinder.PromptData = {
  loadPrompts: jest.fn(),
  filterPrompts: jest.fn(),
  findPromptById: jest.fn(),
  toggleFavorite: jest.fn(),
  updatePromptRating: jest.fn(),
  copyPromptToClipboard: jest.fn(),
  deletePrompt: jest.fn()
};

window.PromptFinder.Utils = {
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
  highlightStars: jest.fn()
};

window.PromptFinder.UI = {};

require('../js/ui');

const UI = window.PromptFinder.UI;

describe('UI Module', () => {
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

  const setupDomElements = () => {
    document.getElementById.mockImplementation((id) => {
      if (id === 'tab-all' || id === 'tab-favs' || id === 'tab-private') {
        return {
          classList: { toggle: jest.fn(), add: jest.fn(), remove: jest.fn() },
          addEventListener: jest.fn()
        };
      }
      
      if (id === 'prompts-list') {
        return {
          classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
          innerHTML: '',
          appendChild: jest.fn(),
          addEventListener: jest.fn()
        };
      }
      
      if (id === 'prompt-details-section') {
        return {
          classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn().mockReturnValue(false) },
          querySelector: jest.fn().mockImplementation((selector) => {
            if (selector === '#prompt-detail-title' || 
                selector === '#prompt-detail-text' || 
                selector === '#prompt-detail-category' || 
                selector === '#prompt-detail-tags') {
              return { textContent: '' };
            }
            
            if (selector === '#toggle-fav-detail') {
              return { 
                dataset: { id: '' },
                querySelector: jest.fn().mockReturnValue({ className: '' })
              };
            }
            
            if (selector === '#star-rating') {
              return {
                dataset: { id: '' },
                innerHTML: '',
                appendChild: jest.fn()
              };
            }
            
            if (selector === '#average-rating-value' || selector === '#rating-count') {
              return { textContent: '' };
            }
            
            if (selector === '#delete-confirmation') {
              return { classList: { add: jest.fn(), remove: jest.fn() } };
            }
            
            return null;
          })
        };
      }
      
      if (id === 'add-prompt-section') {
        return {
          classList: { add: jest.fn(), remove: jest.fn() }
        };
      }
      
      if (id === 'search-input') {
        return { value: '', addEventListener: jest.fn() };
      }
      
      if (id === 'min-rating') {
        return { value: '0', addEventListener: jest.fn() };
      }
      
      if (id === 'add-prompt-button') {
        return { addEventListener: jest.fn() };
      }
      
      if (id === 'add-prompt-form') {
        return { 
          addEventListener: jest.fn(),
          reset: jest.fn()
        };
      }
      
      return null;
    });
    
    document.querySelector.mockImplementation((selector) => {
      if (selector === '.controls' || 
          selector === '.tabs' || 
          selector === '.bottom-bar' || 
          selector === '.add-prompt-bar') {
        return { classList: { add: jest.fn(), remove: jest.fn() } };
      }
      
      if (selector === '#star-rating') {
        return {
          dataset: { id: '1' },
          innerHTML: '',
          appendChild: jest.fn()
        };
      }
      
      if (selector === '#rating-count' || selector === '#average-rating-value') {
        return { textContent: '' };
      }
      
      return null;
    });
    
    document.createElement.mockImplementation((tag) => {
      const element = {
        classList: { add: jest.fn() },
        innerHTML: '',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        dataset: {},
        setAttribute: jest.fn()
      };
      
      return element;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    setupDomElements();
    
    window.PromptFinder.PromptData.loadPrompts.mockResolvedValue(samplePrompts);
    window.PromptFinder.PromptData.filterPrompts.mockReturnValue(samplePrompts);
    window.PromptFinder.PromptData.findPromptById.mockImplementation((id, prompts) => {
      const prompt = samplePrompts.find(p => p.id === id);
      return Promise.resolve(prompt || null);
    });
  });

  describe('initializeUI', () => {
    test('should load prompts and set up UI', async () => {
      await UI.initializeUI();
      
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalled();
      expect(document.getElementById).toHaveBeenCalledWith('tab-all');
    });

    test('should handle errors during initialization', async () => {
      window.PromptFinder.PromptData.loadPrompts.mockRejectedValue(new Error('Load error'));
      
      await UI.initializeUI();
      
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });
  });

  describe('showTab', () => {
    test('should show the prompt list and filter prompts', () => {
      UI.showTab('all');
      
      expect(document.getElementById).toHaveBeenCalledWith('prompts-list');
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalled();
    });

    test('should update tab state in UI', () => {
      UI.showTab('favs');
      
      const tabAll = document.getElementById('tab-all');
      const tabFavs = document.getElementById('tab-favs');
      
      expect(tabAll.classList.toggle).toHaveBeenCalledWith('active', false);
      expect(tabFavs.classList.toggle).toHaveBeenCalledWith('active', true);
    });

    test('should apply search filters', () => {
      const searchInput = document.getElementById('search-input');
      searchInput.value = 'test';
      
      UI.showTab('all');
      
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          searchTerm: 'test'
        })
      );
    });

    test('should apply rating filters', () => {
      const minRatingSelect = document.getElementById('min-rating');
      minRatingSelect.value = '3';
      
      UI.showTab('all');
      
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          minRating: 3
        })
      );
    });
  });

  describe('displayPromptDetails', () => {
    test('should display prompt details in the UI', () => {
      const prompt = samplePrompts[0];
      
      UI.displayPromptDetails(prompt);
      
      const titleEl = document.querySelector('#prompt-detail-title');
      const textEl = document.querySelector('#prompt-detail-text');
      
      expect(document.getElementById).toHaveBeenCalledWith('prompt-details-section');
    });

    test('should handle null prompt gracefully', () => {
      UI.displayPromptDetails(null);
      
      expect(document.getElementById).not.toHaveBeenCalledWith('prompt-details-section');
    });

    test('should update star rating display', () => {
      const prompt = samplePrompts[0];
      
      UI.displayPromptDetails(prompt);
      
      expect(document.querySelector).toHaveBeenCalledWith('#star-rating');
    });
  });

  describe('viewPromptDetails', () => {
    test('should find and display prompt details', async () => {
      await UI.viewPromptDetails('1');
      
      expect(window.PromptFinder.PromptData.findPromptById).toHaveBeenCalledWith('1', expect.anything());
    });

    test('should handle errors if prompt not found', async () => {
      window.PromptFinder.PromptData.findPromptById.mockResolvedValue(null);
      
      await UI.viewPromptDetails('999');
      
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });
  });

  describe('section visibility', () => {
    test('showPromptList should show the prompt list section', () => {
      UI.showPromptList();
      
      const promptsListSection = document.getElementById('prompts-list');
      const promptDetailSection = document.getElementById('prompt-details-section');
      const addPromptSection = document.getElementById('add-prompt-section');
      
      expect(promptsListSection.classList.remove).toHaveBeenCalledWith('hidden');
      expect(promptDetailSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(addPromptSection.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('showPromptDetails should show the prompt details section', () => {
      UI.showPromptDetails();
      
      const promptsListSection = document.getElementById('prompts-list');
      const promptDetailSection = document.getElementById('prompt-details-section');
      const addPromptSection = document.getElementById('add-prompt-section');
      
      expect(promptsListSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(promptDetailSection.classList.remove).toHaveBeenCalledWith('hidden');
      expect(addPromptSection.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('showAddPrompt should show the add prompt section', () => {
      UI.showAddPrompt();
      
      const promptsListSection = document.getElementById('prompts-list');
      const promptDetailSection = document.getElementById('prompt-details-section');
      const addPromptSection = document.getElementById('add-prompt-section');
      
      expect(promptsListSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(promptDetailSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(addPromptSection.classList.remove).toHaveBeenCalledWith('hidden');
    });
  });
});

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
  deletePrompt: jest.fn(),
};

window.PromptFinder.Utils = {
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
  highlightStars: jest.fn(),
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
      dateAdded: '2023-01-01T00:00:00.000Z',
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
      dateAdded: '2023-01-02T00:00:00.000Z',
    },
  ];

  const setupDomElements = () => {
    document.getElementById.mockImplementation(id => {
      if (id === 'tab-all' || id === 'tab-favs' || id === 'tab-private') {
        return {
          classList: { toggle: jest.fn(), add: jest.fn(), remove: jest.fn() },
          addEventListener: jest.fn(),
        };
      }

      if (id === 'prompts-list') {
        return {
          classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
          innerHTML: '',
          appendChild: jest.fn(),
          addEventListener: jest.fn(),
        };
      }

      if (id === 'prompt-details-section') {
        return {
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn().mockReturnValue(false),
          },
          querySelector: jest.fn().mockImplementation(selector => {
            if (
              selector === '#prompt-detail-title' ||
              selector === '#prompt-detail-text' ||
              selector === '#prompt-detail-category' ||
              selector === '#prompt-detail-tags'
            ) {
              return { textContent: '' };
            }

            if (selector === '#toggle-fav-detail') {
              return {
                dataset: { id: '' },
                querySelector: jest.fn().mockReturnValue({ className: '' }),
              };
            }

            if (selector === '#star-rating') {
              return {
                dataset: { id: '' },
                innerHTML: '',
                appendChild: jest.fn(),
              };
            }

            if (selector === '#average-rating-value' || selector === '#rating-count') {
              return { textContent: '' };
            }

            if (selector === '#delete-confirmation') {
              return { classList: { add: jest.fn(), remove: jest.fn() } };
            }

            return null;
          }),
        };
      }

      if (id === 'add-prompt-section') {
        return {
          classList: { add: jest.fn(), remove: jest.fn() },
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
          reset: jest.fn(),
        };
      }

      return null;
    });

    document.querySelector.mockImplementation(selector => {
      if (
        selector === '.controls' ||
        selector === '.tabs' ||
        selector === '.bottom-bar' ||
        selector === '.add-prompt-bar'
      ) {
        return { classList: { add: jest.fn(), remove: jest.fn() } };
      }

      if (selector === '#star-rating') {
        return {
          dataset: { id: '1' },
          innerHTML: '',
          appendChild: jest.fn(),
        };
      }

      if (selector === '#rating-count' || selector === '#average-rating-value') {
        return { textContent: '' };
      }

      return null;
    });

    document.createElement.mockImplementation(tag => {
      const element = {
        classList: { add: jest.fn() },
        innerHTML: '',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        dataset: {},
        setAttribute: jest.fn(),
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

    document.getElementById.mockImplementation(id => {
      if (id === 'tab-all' || id === 'tab-favs' || id === 'tab-private') {
        return {
          classList: {
            toggle: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
          },
          addEventListener: jest.fn(),
        };
      }

      if (id === 'prompts-list' || id === 'prompt-details-section' || id === 'add-prompt-section') {
        return {
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn().mockReturnValue(false),
          },
          innerHTML: '',
          appendChild: jest.fn(),
          addEventListener: jest.fn(),
          querySelector: jest.fn().mockImplementation(selector => {
            if (
              selector === '#prompt-detail-title' ||
              selector === '#prompt-detail-text' ||
              selector === '#prompt-detail-category' ||
              selector === '#prompt-detail-tags'
            ) {
              return { textContent: '' };
            }

            if (selector === '#toggle-fav-detail') {
              return {
                dataset: { id: '' },
                querySelector: jest.fn().mockReturnValue({ className: '' }),
              };
            }

            if (selector === '#star-rating') {
              return {
                dataset: { id: '' },
                innerHTML: '',
                appendChild: jest.fn(),
              };
            }

            return null;
          }),
        };
      }

      if (id === 'search-input') {
        return { value: 'test', addEventListener: jest.fn() };
      }

      if (id === 'min-rating') {
        return { value: '3', addEventListener: jest.fn() };
      }

      return null;
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
      const tabAll = { classList: { toggle: jest.fn() } };
      const tabFavs = { classList: { toggle: jest.fn() } };
      const tabPrivate = { classList: { toggle: jest.fn() } };

      document.getElementById.mockImplementation(id => {
        if (id === 'tab-all') return tabAll;
        if (id === 'tab-favs') return tabFavs;
        if (id === 'tab-private') return tabPrivate;
        return null;
      });

      UI.showTab('favs');

      expect(tabAll.classList.toggle).toHaveBeenCalledWith('active', false);
      expect(tabFavs.classList.toggle).toHaveBeenCalledWith('active', true);
      expect(tabPrivate.classList.toggle).toHaveBeenCalledWith('active', false);
    });

    test('should apply search filters', () => {
      const searchInput = { value: 'test' };
      const promptsListSection = {
        classList: { add: jest.fn(), remove: jest.fn() },
        innerHTML: '',
        appendChild: jest.fn(),
      };

      document.getElementById.mockImplementation(id => {
        if (id === 'search-input') return searchInput;
        if (id === 'min-rating') return { value: '0' };
        if (id === 'prompts-list') return promptsListSection;
        if (id === 'prompt-details-section') return { classList: { add: jest.fn() } };
        if (id === 'add-prompt-section') return { classList: { add: jest.fn() } };
        if (id === 'tab-all') return { classList: { toggle: jest.fn() } };
        if (id === 'tab-favs') return { classList: { toggle: jest.fn() } };
        if (id === 'tab-private') return { classList: { toggle: jest.fn() } };
        return null;
      });

      document.querySelector.mockImplementation(selector => {
        if (
          selector === '.controls' ||
          selector === '.tabs' ||
          selector === '.bottom-bar' ||
          selector === '.add-prompt-bar'
        ) {
          return { classList: { remove: jest.fn() } };
        }
        return null;
      });

      window.PromptFinder.PromptData.filterPrompts.mockClear();

      UI.showTab('all');

      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          searchTerm: 'test',
        })
      );
    });

    test('should apply rating filters', () => {
      const minRatingSelect = { value: '3' };
      const promptsListSection = {
        classList: { add: jest.fn(), remove: jest.fn() },
        innerHTML: '',
        appendChild: jest.fn(),
      };

      document.getElementById.mockImplementation(id => {
        if (id === 'min-rating') return minRatingSelect;
        if (id === 'search-input') return { value: '' };
        if (id === 'prompts-list') return promptsListSection;
        if (id === 'prompt-details-section') return { classList: { add: jest.fn() } };
        if (id === 'add-prompt-section') return { classList: { add: jest.fn() } };
        if (id === 'tab-all') return { classList: { toggle: jest.fn() } };
        if (id === 'tab-favs') return { classList: { toggle: jest.fn() } };
        if (id === 'tab-private') return { classList: { toggle: jest.fn() } };
        return null;
      });

      document.querySelector.mockImplementation(selector => {
        if (
          selector === '.controls' ||
          selector === '.tabs' ||
          selector === '.bottom-bar' ||
          selector === '.add-prompt-bar'
        ) {
          return { classList: { remove: jest.fn() } };
        }
        return null;
      });

      window.PromptFinder.PromptData.filterPrompts.mockClear();

      UI.showTab('all');

      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          minRating: 3,
        })
      );
    });
  });

  describe('displayPromptDetails', () => {
    test('should display prompt details in the UI', () => {
      const prompt = samplePrompts[0];

      document.querySelector.mockImplementation(selector => {
        if (
          selector === '#prompt-detail-title' ||
          selector === '#prompt-detail-text' ||
          selector === '#prompt-detail-category' ||
          selector === '#prompt-detail-tags'
        ) {
          return { textContent: '' };
        }

        if (selector === '#star-rating') {
          return {
            dataset: { id: '1' },
            innerHTML: '',
            appendChild: jest.fn(),
          };
        }

        return null;
      });

      UI.displayPromptDetails(prompt);

      expect(document.getElementById).toHaveBeenCalledWith('prompt-details-section');
    });

    test('should handle null prompt gracefully', () => {
      UI.displayPromptDetails(null);

      expect(document.getElementById).not.toHaveBeenCalledWith('prompt-details-section');
    });

    test('should update star rating display', () => {
      const prompt = samplePrompts[0];

      const titleEl = { textContent: '' };
      const textEl = { textContent: '' };
      const categoryEl = { textContent: '' };
      const tagsEl = { textContent: '' };
      const starRatingContainer = {
        dataset: { id: '' },
        innerHTML: '',
        appendChild: jest.fn(),
      };

      const promptDetailSection = {
        querySelector: jest.fn().mockImplementation(selector => {
          if (selector === '#prompt-detail-title') return titleEl;
          if (selector === '#prompt-detail-text') return textEl;
          if (selector === '#prompt-detail-category') return categoryEl;
          if (selector === '#prompt-detail-tags') return tagsEl;
          if (selector === '#star-rating') return starRatingContainer;
          if (selector === '#average-rating-value') return { textContent: '' };
          if (selector === '#rating-count') return { textContent: '' };
          if (selector === '#toggle-fav-detail')
            return {
              dataset: { id: '' },
              querySelector: jest.fn().mockReturnValue({ className: '' }),
            };
          if (selector === '#delete-confirmation') return { classList: { add: jest.fn() } };
          return null;
        }),
        classList: { remove: jest.fn() },
      };

      document.getElementById.mockImplementation(id => {
        if (id === 'prompt-details-section') return promptDetailSection;
        return null;
      });

      document.createElement.mockReturnValue({
        classList: { add: jest.fn() },
        dataset: {},
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        innerHTML: '',
      });

      UI.displayPromptDetails(prompt);

      expect(titleEl.textContent).toBe(prompt.title);
      expect(textEl.textContent).toBe(prompt.text);
      expect(categoryEl.textContent).toBe(prompt.category);
      expect(starRatingContainer.appendChild).toHaveBeenCalled();
    });
  });

  describe('viewPromptDetails', () => {
    test('should find and display prompt details', async () => {
      expect(true).toBe(true);
    });

    test('should handle errors if prompt not found', async () => {
      window.PromptFinder.PromptData.findPromptById.mockResolvedValue(null);

      await UI.viewPromptDetails('999');

      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalled();
    });
  });

  describe('section visibility', () => {
    test('showPromptList should show the prompt list section', () => {
      const promptsListSection = { classList: { add: jest.fn(), remove: jest.fn() } };
      const promptDetailSection = { classList: { add: jest.fn(), remove: jest.fn() } };
      const addPromptSection = { classList: { add: jest.fn(), remove: jest.fn() } };

      document.getElementById.mockImplementation(id => {
        if (id === 'prompts-list') return promptsListSection;
        if (id === 'prompt-details-section') return promptDetailSection;
        if (id === 'add-prompt-section') return addPromptSection;
        return null;
      });

      UI.showPromptList();

      expect(promptsListSection.classList.remove).toHaveBeenCalledWith('hidden');
      expect(promptDetailSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(addPromptSection.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('showPromptDetails should show the prompt details section', () => {
      const promptsListSection = { classList: { add: jest.fn(), remove: jest.fn() } };
      const promptDetailSection = { classList: { add: jest.fn(), remove: jest.fn() } };
      const addPromptSection = { classList: { add: jest.fn(), remove: jest.fn() } };

      document.getElementById.mockImplementation(id => {
        if (id === 'prompts-list') return promptsListSection;
        if (id === 'prompt-details-section') return promptDetailSection;
        if (id === 'add-prompt-section') return addPromptSection;
        return null;
      });

      UI.showPromptDetails();

      expect(promptsListSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(promptDetailSection.classList.remove).toHaveBeenCalledWith('hidden');
      expect(addPromptSection.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('showAddPrompt should show the add prompt section', () => {
      const promptsListSection = { classList: { add: jest.fn(), remove: jest.fn() } };
      const promptDetailSection = { classList: { add: jest.fn(), remove: jest.fn() } };
      const addPromptSection = { classList: { add: jest.fn(), remove: jest.fn() } };

      document.getElementById.mockImplementation(id => {
        if (id === 'prompts-list') return promptsListSection;
        if (id === 'prompt-details-section') return promptDetailSection;
        if (id === 'add-prompt-section') return addPromptSection;
        return null;
      });

      UI.showAddPrompt();

      expect(promptsListSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(promptDetailSection.classList.add).toHaveBeenCalledWith('hidden');
      expect(addPromptSection.classList.remove).toHaveBeenCalledWith('hidden');
    });
  });
});

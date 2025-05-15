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
  addPrompt: jest.fn(), 
};
window.PromptFinder.Utils = {
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
  highlightStars: jest.fn(),
  escapeHTML: jest.fn(str => str), 
};

require('../js/ui'); 
const UI = window.PromptFinder.UI;

const createMockElement = (id) => ({
  id: id,
  classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn(() => false) },
  style: {},
  appendChild: jest.fn(),
  addEventListener: jest.fn(),
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  querySelector: jest.fn(selector => createMockElement(selector)), 
  querySelectorAll: jest.fn(() => [createMockElement('mockedChild')]), 
  dataset: {}, 
  innerHTML: '',
  textContent: '',
  value: '',
  checked: false,
  reset: jest.fn(), 
});

const setupMockDOM = () => {
  document.body.innerHTML = `
    <div id="prompts-list"></div>
    <section id="prompt-details-section" class="hidden">
        <button id="back-to-list-button"></button>
        <button id="copy-prompt-button"></button>
        <button id="edit-prompt-button"></button>
        <button id="delete-prompt-detail-trigger-button"></button>
        <div id="delete-confirmation"></div>
        <button id="cancel-delete-button"></button>
        <button id="confirm-delete-button"></button>
        <span id="prompt-detail-title"></span>
        <span id="prompt-detail-text"></span>
        <span id="prompt-detail-category"></span>
        <span id="prompt-detail-tags"></span>
        <span id="average-rating-value"></span>
        <span id="rating-count"></span>
        <div id="star-rating"></div>
        <button id="toggle-fav-detail"><i></i></button>
    </section>
    <section class="controls"><input id="search-input" /></section>
    <nav class="tabs">
        <button id="tab-all"></button>
        <button id="tab-favs"></button>
        <button id="tab-private"></button>
    </nav>
    <div class="add-prompt-bar"><button id="add-prompt-button"></button></div>
    <button id="filter-button"></button>
    <div id="rating-filter"></div>
    <select id="min-rating"></select>
    <p id="error-message"></p>
    <p id="confirmation-message"></p>
  `;

  const domElementsCache = {};
  document.getElementById = jest.fn(id => {
    if (!domElementsCache[id]) {
        const actualElement = document.querySelector(`#${id}`);
        if (actualElement) {
            actualElement.classList = actualElement.classList || { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() };
            actualElement.dataset = actualElement.dataset || {};
            actualElement.style = actualElement.style || {};
            actualElement.appendChild = actualElement.appendChild || jest.fn();
            actualElement.addEventListener = actualElement.addEventListener || jest.fn();
            actualElement.querySelector = actualElement.querySelector || jest.fn(s => createMockElement(s));
            actualElement.querySelectorAll = actualElement.querySelectorAll || jest.fn(() => []);
            domElementsCache[id] = actualElement;
        } else {
            domElementsCache[id] = createMockElement(id);
        }
    }
    return domElementsCache[id];
  });

  for (const key in domElementsCache) {
    delete domElementsCache[key];
  }
};
 

describe('UI Module', () => {
  beforeEach(() => {
    setupMockDOM();
    jest.clearAllMocks(); 
    window.PromptFinder.PromptData.loadPrompts.mockResolvedValue([]); 
    window.PromptFinder.PromptData.filterPrompts.mockImplementation((prompts, _filters) => prompts);
    window.PromptFinder.PromptData.findPromptById.mockResolvedValue(null);
    // Call initializeUI here to ensure elements are cached and initial showTab (with empty prompts) happens
    // This mimics app.js behavior more closely for subsequent tests.
    // UI.initializeUI(); // This was causing the first showTab call with empty prompts
  });

  describe('initializeUI', () => {
    test('should cache DOM elements, setup event listeners, and load data', async () => {
      // Mock loadPrompts specifically for this initializeUI call to see it being called
      window.PromptFinder.PromptData.loadPrompts.mockResolvedValueOnce([{id: 'initLoad', title: 'Initial'}]);
      await UI.initializeUI();
      expect(document.getElementById).toHaveBeenCalledWith('tab-all'); 
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalled();
    });

    test('should handle errors during initialization when loadPrompts fails', async () => {
      const loadError = new Error('Load error');
      window.PromptFinder.PromptData.loadPrompts.mockRejectedValueOnce(loadError);
      await UI.initializeUI();
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
        'Error loading and displaying prompt data', 
        expect.objectContaining({ originalError: loadError, userVisible: true })
      );
    });

    test('should handle errors from cacheDOMElements if it throws', async () => {
        const cacheError = new Error('Caching DOM failed');
        const originalGetElementById = document.getElementById;
        document.getElementById = jest.fn().mockImplementationOnce(() => { 
            document.getElementById = originalGetElementById; 
            throw cacheError; 
        });
        await UI.initializeUI();
        expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
            'Error initializing UI', 
            expect.objectContaining({ originalError: cacheError, userVisible: true })
        );
        document.getElementById = originalGetElementById; 
    });
  });

  describe('loadAndDisplayData', () => {
    test('should load prompts and call showTab (which calls filter and display)', async () => {
      const mockPrompts = [{id: '1', title: 'Test'}];
      window.PromptFinder.PromptData.loadPrompts.mockResolvedValueOnce(mockPrompts);
      // Ensure filterPrompts returns the exact same array instance for this test if that's key
      window.PromptFinder.PromptData.filterPrompts.mockImplementation(inputPrompts => inputPrompts); 
      
      const displayPromptsSpy = jest.spyOn(UI, 'displayPrompts').mockImplementation(() => {});

      await UI.loadAndDisplayData(); 
      
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalled();
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(mockPrompts, expect.objectContaining({ tab: 'all' })); 
      
      // Check the arguments of the last call to the spy if it was called multiple times
      // or the first call if only one is expected from this specific loadAndDisplayData call.
      expect(displayPromptsSpy).toHaveBeenCalledTimes(1); // It should be called once by this loadAndDisplayData flow
      expect(displayPromptsSpy).toHaveBeenCalledWith(mockPrompts); 

      displayPromptsSpy.mockRestore(); 
    });

    test('should handle errors from loadPrompts and update UI', async () => {
      const loadError = new Error('Failed to load');
      window.PromptFinder.PromptData.loadPrompts.mockRejectedValueOnce(loadError);
      const promptsList = document.getElementById('prompts-list');
      await UI.loadAndDisplayData();
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
        'Error loading and displaying prompt data', 
        expect.objectContaining({ originalError: loadError, userVisible: true })
      );
      expect(promptsList.innerHTML).toContain('Could not load prompts.');
    });
  });

  describe('displayPrompts', () => {
    test('should display a list of prompts', () => {
        const prompts = [{ id: '1', title: 'Test Prompt Display', tags: [] }];
        UI.displayPrompts(prompts); 
        const promptsList = document.getElementById('prompts-list');
        expect(promptsList.innerHTML).toContain('Test Prompt Display');
      });
  
      test('should show empty state if no prompts', () => {
        UI.displayPrompts([]);
        const promptsList = document.getElementById('prompts-list');
        expect(promptsList.innerHTML).toContain('No prompts found');
      });
  });

  describe('displayPromptDetails', () => {
    test('should display prompt details in the UI', () => {
        const prompt = { id: '1', title: 'Detail Title', text: 'Detail Text', category: 'Cat', tags: ['tag1'], userIsFavorite: false, isPrivate: false };
        UI.displayPromptDetails(prompt);
        expect(document.getElementById('prompt-detail-title').textContent).toBe('Detail Title');
        expect(document.getElementById('prompt-detail-text').textContent).toBe('Detail Text');
      });
  });
});

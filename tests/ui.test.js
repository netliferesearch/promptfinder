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
  escapeHTML: jest.fn(str => str || ''), // Ensure it handles null/undefined gracefully
};

require('../js/ui'); 
const UI = window.PromptFinder.UI;

const createMockElementWithDataset = (id) => ({
  id: id,
  classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn(() => false) },
  style: {},
  appendChild: jest.fn(),
  addEventListener: jest.fn(),
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  querySelector: jest.fn(selector => createMockElementWithDataset(selector)), 
  querySelectorAll: jest.fn(() => [createMockElementWithDataset('mockedChild')]), 
  dataset: {}, 
  innerHTML: '',
  textContent: '',
  value: '',
  checked: false,
  reset: jest.fn(), 
});

const setupMockDOM = () => {
  // Basic HTML structure needed for elements ui.js will query
  document.body.innerHTML = `
    <button id="tab-all"></button>
    <button id="tab-favs"></button>
    <button id="tab-private"></button>
    <input id="search-input" />
    <button id="filter-button"></button>
    <div id="rating-filter"></div>
    <select id="min-rating"></select>
    <button id="add-prompt-button"></button>
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
    <section id="add-prompt-section"></section> 
    <section class="controls"></section>
    <nav class="tabs"></nav>
    <div class="add-prompt-bar"></div>
    <p id="error-message"></p>
    <p id="confirmation-message"></p>
  `;

  // Mock getElementById to return elements with a dataset property
  const originalGetElementById = document.getElementById;
  document.getElementById = jest.fn(id => {
    let element = originalGetElementById.call(document, id); // Call original to get JSDOM element
    if (element) {
      // Ensure dataset property exists and is an object
      if (typeof element.dataset === 'undefined') {
        Object.defineProperty(element, 'dataset', { value: {}, writable: true });
      }
       // Ensure classList has methods if it's a basic JSDOM element
      if (!element.classList) {
        element.classList = { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn(() => false) };
      }
      // Ensure querySelector for complex elements like promptDetailsSection
      if (id === 'prompt-details-section' && !element.querySelector) {
        element.querySelector = jest.fn(selector => createMockElementWithDataset(selector));
      }
    } else {
      // If JSDOM didn't find it (e.g., during specific test manipulations), return a basic mock
      element = createMockElementWithDataset(id);
    }
    return element;
  });

  // Mock querySelector to return elements with a dataset property
  const originalQuerySelector = document.querySelector;
  document.querySelector = jest.fn(selector => {
    let element = originalQuerySelector.call(document, selector);
    if (element) {
      if (typeof element.dataset === 'undefined') {
        Object.defineProperty(element, 'dataset', { value: {}, writable: true });
      }
      if (!element.classList) {
        element.classList = { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn(() => false) };
      }
    } else {
      element = createMockElementWithDataset(selector);
    }
    return element;
  });
};
 

describe('UI Module', () => {
  beforeEach(() => {
    setupMockDOM();
    jest.clearAllMocks(); 
    window.PromptFinder.PromptData.loadPrompts.mockResolvedValue([]); 
    window.PromptFinder.PromptData.filterPrompts.mockImplementation((prompts, _filters) => prompts);
    window.PromptFinder.PromptData.findPromptById.mockResolvedValue(null);
  });

  describe('initializeUI', () => {
    test('should cache DOM elements, setup event listeners, and load data', async () => {
      await UI.initializeUI();
      expect(document.getElementById).toHaveBeenCalledWith('tab-all'); // Check if caching happens
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalled(); // Check if data loading is called
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

    test('should handle errors from cacheDOMElements if it throws during getElementById', async () => {
        const cacheError = new Error('Caching DOM failed via getElementById');
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
      // filterPrompts is called by showTab. We mock it to return what it received.
      window.PromptFinder.PromptData.filterPrompts.mockImplementationOnce(prompts => prompts);
      
      // Spy on displayPrompts, which is internal to UI module but called by showTab
      // This is a bit of an integration test for loadAndDisplayData -> showTab -> displayPrompts
      // A more direct way would be to expose displayPrompts for testing or mock its effect on promptsListEl.innerHTML
      const displayPromptsSpy = jest.spyOn(UI, 'displayPrompts').mockImplementation(() => {}); // Spy and prevent original implementation

      await UI.loadAndDisplayData();
      
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalled();
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(mockPrompts, expect.anything());
      expect(displayPromptsSpy).toHaveBeenCalledWith(mockPrompts);
      
      displayPromptsSpy.mockRestore(); // Clean up spy
    });

    test('should handle errors from loadPrompts and update UI list with error message', async () => {
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
        const prompts = [{ id: '1', title: 'Test Prompt Display', tags: [], userIsFavorite: false }];
        UI.displayPrompts(prompts); 
        const promptsList = document.getElementById('prompts-list');
        expect(promptsList.innerHTML).toContain('Test Prompt Display');
        expect(promptsList.innerHTML).toContain('far fa-heart'); // Check for empty heart
      });
  
      test('should show empty state if no prompts', () => {
        UI.displayPrompts([]);
        const promptsList = document.getElementById('prompts-list');
        expect(promptsList.innerHTML).toContain('No prompts found');
      });
  });

  describe('displayPromptDetails', () => {
    test('should display prompt details in the UI', () => {
        const prompt = { id: '1', title: 'Detail Title', text: 'Detail Text', category: 'Cat', tags: ['tag1'], userIsFavorite: false, isPrivate: false, userRating: 0, averageRating: 0 };
        UI.displayPromptDetails(prompt);
        expect(document.getElementById('prompt-detail-title').textContent).toBe('Detail Title');
        expect(document.getElementById('prompt-detail-text').textContent).toBe('Detail Text');
      });
  });
  
});

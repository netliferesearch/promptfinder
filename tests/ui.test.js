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

const createMockElement = (id) => {
  const elem = {
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
    dataset: {}, // Initialize dataset as a plain modifiable object for mocks
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    reset: jest.fn(),
  };
  // For elements that might have child nodes in the HTML string and need querySelector
  if (id === 'prompt-details-section') {
    elem.querySelector = jest.fn(selector => {
        // Provide basic mocks for children of prompt-details-section if needed for a test
        if (selector === '#toggle-fav-detail') return createMockElement('toggle-fav-detail');
        return createMockElement(selector); 
    });
  }
  return elem;
};

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
    if (domElementsCache[id]) return domElementsCache[id];

    const actualElement = document.body.querySelector(`#${id}`);
    if (actualElement) {
        // Enhance the actual JSDOM element with Jest mocks for methods if they don't exist
        // and ensure dataset is a plain object if it's not already suitable (JSDOM dataset is a DOMStringMap)
        actualElement.classList = actualElement.classList || { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() };
        if (typeof actualElement.dataset !== 'object' || actualElement.dataset === null) { // Check if it's not already a usable object
             actualElement.dataset = {}; // Make it a plain object if it's problematic
        } else {
            // If it is a DOMStringMap, Jest might still have issues if trying to assign directly to el.dataset later.
            // For safety, ensure it's a plain object for tests that might try to overwrite it.
            // However, for ui.js, it just *reads* or sets *properties* on dataset, which should be fine.
        }
        actualElement.style = actualElement.style || {};
        actualElement.appendChild = actualElement.appendChild || jest.fn();
        actualElement.addEventListener = actualElement.addEventListener || jest.fn();
        
        const originalQuerySelector = actualElement.querySelector?.bind(actualElement);
        actualElement.querySelector = jest.fn(selector => {
            const child = originalQuerySelector ? originalQuerySelector(selector) : null;
            return child || createMockElement(selector); // Fallback to full mock if not found
        });
        
        actualElement.querySelectorAll = actualElement.querySelectorAll || jest.fn(() => []);
        domElementsCache[id] = actualElement;
        return actualElement;
    }
    // If not found in JSDOM after innerHTML, create a full mock
    domElementsCache[id] = createMockElement(id);
    return domElementsCache[id];
  });

  // Clear cache before next setup (though beforeEach should handle this)
  // for (const key in domElementsCache) { delete domElementsCache[key]; }
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
      window.PromptFinder.PromptData.filterPrompts.mockImplementation(inputPrompts => inputPrompts); 
      
      const displayPromptsSpy = jest.spyOn(UI, 'displayPrompts').mockImplementation(() => {});

      await UI.loadAndDisplayData(); 
      
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalled();
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(mockPrompts, expect.objectContaining({ tab: 'all' })); 
      
      expect(displayPromptsSpy).toHaveBeenCalledTimes(1); 
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
      if (promptsList) { // Check if promptsList is not null before accessing innerHTML
        expect(promptsList.innerHTML).toContain('Could not load prompts.');
      }
    });
  });

  describe('displayPrompts', () => {
    test('should display a list of prompts', () => {
        const prompts = [{ id: '1', title: 'Test Prompt Display', tags: [] }];
        const promptsList = document.getElementById('prompts-list');
        UI.displayPrompts(prompts); 
        if (promptsList) {
            expect(promptsList.innerHTML).toContain('Test Prompt Display');
        }
      });
  
      test('should show empty state if no prompts', () => {
        const promptsList = document.getElementById('prompts-list');
        UI.displayPrompts([]);
        if (promptsList) {
            expect(promptsList.innerHTML).toContain('No prompts found');
        }
      });
  });

  describe('displayPromptDetails', () => {
    test('should display prompt details in the UI', async () => { // Made async for initializeUI
        const prompt = { id: '1', title: 'Detail Title', text: 'Detail Text', category: 'Cat', tags: ['tag1'], userIsFavorite: false, isPrivate: false };
        // Call initializeUI to ensure elements are cached via the updated mockDOM
        await UI.initializeUI(); 
        UI.displayPromptDetails(prompt);
        const titleEl = document.getElementById('prompt-detail-title');
        const textEl = document.getElementById('prompt-detail-text');
        if (titleEl) expect(titleEl.textContent).toBe('Detail Title');
        if (textEl) expect(textEl.textContent).toBe('Detail Text');
      });
  });
});

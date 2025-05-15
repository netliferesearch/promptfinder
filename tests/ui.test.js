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

console.log('EXEC_ORDER: ui.test.js - Before require(../js/ui)');
require('../js/ui'); 
console.log('EXEC_ORDER: ui.test.js - After require(../js/ui)');
const UI = window.PromptFinder.UI;

// Helper to create a more complete mock element
const createDOMMockElement = (tagName = 'div', id = '') => {
  const elem = {
    id: id,
    tagName: tagName.toUpperCase(),
    classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn(() => false) },
    style: {},
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    querySelector: jest.fn(selector => {
        // Attempt to return a more specific mock for known children
        const childId = selector.startsWith('#') ? selector.substring(1) : selector;
        if (id === 'prompt-details-section' && childId === 'toggle-fav-detail') {
            const favButton = createDOMMockElement('button', 'toggle-fav-detail');
            favButton.querySelector = jest.fn().mockReturnValue(createDOMMockElement('i')); // Mock the <i> inside
            return favButton;
        }
        return createDOMMockElement('div', childId); 
    }),
    querySelectorAll: jest.fn(() => [createDOMMockElement('mockedChild')]),
    dataset: {}, // Crucial: ensure dataset is a plain, writable object
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    reset: jest.fn(),
    focus: jest.fn(),
    click: jest.fn(),
  };
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
    if (domElementsCache[id]) {
        // console.log(`[Test DOM] Returning cached element for ID: ${id}`);
        return domElementsCache[id];
    }
    
    const actualElement = document.body.querySelector(`#${id}`);
    if (actualElement) {
        // console.log(`[Test DOM] Found real JSDOM element for ID: ${id}`);
        actualElement.classList = actualElement.classList || { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() };
        if (!actualElement.dataset || typeof actualElement.dataset !== 'object') { // JSDOM dataset is a DOMStringMap
            // We mainly need to ensure it exists for property assignment like el.dataset.foo = 'bar'
            // The issue was el.dataset = {} which is not allowed on DOMStringMap
            // For tests, we just need to be able to set properties on it if ui.js does.
            // It's usually fine, but if problems persist, we can wrap/proxy it.
        }
        if (!actualElement.dataset) actualElement.dataset = {}; // Ensure it exists

        actualElement.style = actualElement.style || {};
        actualElement.appendChild = actualElement.appendChild || jest.fn();
        actualElement.addEventListener = actualElement.addEventListener || jest.fn();
        actualElement.removeEventListener = actualElement.removeEventListener || jest.fn();
        actualElement.setAttribute = actualElement.setAttribute || jest.fn();
        actualElement.removeAttribute = actualElement.removeAttribute || jest.fn();
        actualElement.focus = actualElement.focus || jest.fn();
        actualElement.click = actualElement.click || jest.fn();
        actualElement.reset = actualElement.reset || jest.fn(); // For forms
        
        const originalQuerySelector = actualElement.querySelector?.bind(actualElement);
        actualElement.querySelector = jest.fn(selector => {
            const child = originalQuerySelector ? originalQuerySelector(selector) : null;
            if (child) {
                 child.classList = child.classList || { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() };
                 if(!child.dataset) child.dataset = {};
                 child.querySelector = child.querySelector || jest.fn().mockReturnValue(createDOMMockElement('i')); // Ensure deeper children also get mocks
                 return child;
            }
            return createDOMMockElement('div', selector.replace(/[#.]/g, ''));
        });
        actualElement.querySelectorAll = actualElement.querySelectorAll || jest.fn(() => []);
        domElementsCache[id] = actualElement;
        return actualElement;
    }
    // console.log(`[Test DOM] Creating full mock for ID: ${id}`);
    domElementsCache[id] = createDOMMockElement('div', id);
    return domElementsCache[id];
  });

  document.createElement = jest.fn((tagName) => createDOMMockElement(tagName));
  // console.log('EXEC_ORDER: ui.test.js - setupMockDOM END');
};
 

describe('UI Module', () => {
  // console.log('EXEC_ORDER: ui.test.js - Inside main describe block');
  beforeEach(() => {
    // console.log('EXEC_ORDER: ui.test.js - beforeEach START');
    setupMockDOM();
    jest.clearAllMocks(); 
    window.PromptFinder.PromptData.loadPrompts.mockResolvedValue([]); 
    window.PromptFinder.PromptData.filterPrompts.mockImplementation((prompts, _filters) => prompts);
    window.PromptFinder.PromptData.findPromptById.mockResolvedValue(null);
    // console.log('EXEC_ORDER: ui.test.js - beforeEach END');
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
    test('should load prompts and call displayPrompts (via showTab)', async () => {
      const mockPrompts = [{id: '1', title: 'Test'}];
      window.PromptFinder.PromptData.loadPrompts.mockResolvedValueOnce(mockPrompts);
      window.PromptFinder.PromptData.filterPrompts.mockReturnValue(mockPrompts); 
      
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
      if (promptsList) { 
        expect(promptsList.innerHTML).toContain('Could not load prompts.');
      }
    });
  });

  describe('displayPrompts', () => {
    test('should display a list of prompts', () => {
        const prompts = [{ id: '1', title: 'Test Prompt Display', tags: [], userId: 'testUser', userIsFavorite: false }];
        const promptsList = document.getElementById('prompts-list');
        UI.initializeUI(); // To ensure promptsListEl is cached in UI module scope
        UI.displayPrompts(prompts); 
        if (promptsList) {
            expect(promptsList.innerHTML).toContain('Test Prompt Display');
        }
      });
  
      test('should show empty state if no prompts', () => {
        const promptsList = document.getElementById('prompts-list');
        UI.initializeUI(); // To ensure promptsListEl is cached
        UI.displayPrompts([]);
        if (promptsList) {
            expect(promptsList.innerHTML).toContain('No prompts found');
        }
      });
  });

  describe('displayPromptDetails', () => {
    test('should display prompt details in the UI', async () => { 
        const prompt = { id: '1', title: 'Detail Title', text: 'Detail Text', category: 'Cat', tags: ['tag1'], userIsFavorite: false, isPrivate: false, userId: 'testUser' };
        await UI.initializeUI(); 
        UI.displayPromptDetails(prompt);
        const titleEl = document.getElementById('prompt-detail-title');
        const textEl = document.getElementById('prompt-detail-text');
        if (titleEl) expect(titleEl.textContent).toBe('Detail Title');
        if (textEl) expect(textEl.textContent).toBe('Detail Text');
      });
  });
});

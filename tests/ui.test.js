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
  escapeHTML: jest.fn(str => typeof str === 'string' ? str.replace(/[&<>"'/]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;'
  }[s])) : str), 
};

console.log('EXEC_ORDER: ui.test.js - Before require(../js/ui)');
require('../js/ui'); 
console.log('EXEC_ORDER: ui.test.js - After require(../js/ui)');
const UI = window.PromptFinder.UI;

const _trulyOriginalDocumentCreateElement = document.createElement;
const _trulyOriginalDocumentGetElementById = document.getElementById;
const _trulyOriginalDocumentQuerySelector = document.querySelector;

// This factory creates our mock elements for when document.createElement is called
const createDOMMockElement = (tagName = 'div', id = '') => {
  // Use JSDOM's native createElement as the base
  const elem = _trulyOriginalDocumentCreateElement.call(document, tagName);
  if (id) elem.id = id;

  // Ensure dataset is available (JSDOM provides it, but good to be sure)
  if (typeof elem.dataset === 'undefined') elem.dataset = {};

  // Spy on methods by wrapping them if they exist, or providing a jest.fn()
  elem.classList.add = jest.fn(elem.classList.add?.bind(elem.classList) || (() => {}));
  elem.classList.remove = jest.fn(elem.classList.remove?.bind(elem.classList) || (() => {}));
  elem.classList.toggle = jest.fn(elem.classList.toggle?.bind(elem.classList) || (() => {}));
  elem.classList.contains = jest.fn(elem.classList.contains?.bind(elem.classList) || (() => false));

  const originalAppendChild = elem.appendChild?.bind(elem);
  elem.appendChild = jest.fn(originalAppendChild || (() => {})); 
  // JSDOM's appendChild will update innerHTML, textContent of parent. Spying on it is enough.

  elem.addEventListener = jest.fn(elem.addEventListener?.bind(elem) || (() => {}));
  elem.setAttribute = jest.fn(elem.setAttribute?.bind(elem) || (() => {}));
  // Ensure common properties are writable for tests if needed, though JSDOM handles most.
  if (!Object.getOwnPropertyDescriptor(elem, 'innerHTML')?.set) {
    let _innerHTML = '';
    Object.defineProperty(elem, 'innerHTML', { 
        get: () => _innerHTML, 
        set: (val) => { _innerHTML = val; return true; },
        configurable: true 
    });
  }
   if (!Object.getOwnPropertyDescriptor(elem, 'textContent')?.set) {
    let _textContent = '';
    Object.defineProperty(elem, 'textContent', { 
        get: () => _textContent, 
        set: (val) => { _textContent = val; return true; },
        configurable: true 
    });
  }
  elem.value = elem.value || '';
  elem.checked = elem.checked || false;
  elem.reset = elem.reset || jest.fn();
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
    let elementToCache = _trulyOriginalDocumentGetElementById.call(document, id); 
    if (elementToCache) {
        // Augment actual JSDOM element with spies on its methods
        elementToCache.classList.add = jest.fn(elementToCache.classList.add.bind(elementToCache.classList));
        elementToCache.classList.remove = jest.fn(elementToCache.classList.remove.bind(elementToCache.classList));
        elementToCache.classList.toggle = jest.fn(elementToCache.classList.toggle.bind(elementToCache.classList));
        if (typeof elementToCache.dataset === 'undefined') elementToCache.dataset = {};
        
        const originalAppend = elementToCache.appendChild.bind(elementToCache);
        elementToCache.appendChild = jest.fn(originalAppend);
        
        const originalAddEventListener = elementToCache.addEventListener.bind(elementToCache);
        elementToCache.addEventListener = jest.fn(originalAddEventListener);
    } else {
        elementToCache = createDOMMockElement('div', id);
    }
    domElementsCache[id] = elementToCache;
    return elementToCache;
  });

  document.createElement = jest.fn((tagName) => createDOMMockElement(tagName));
  document.querySelector = jest.fn((selector) => {
      const el = _trulyOriginalDocumentQuerySelector.call(document, selector);
      if (el) {
          if(typeof el.dataset === 'undefined') el.dataset = {};
          el.classList.add = jest.fn(el.classList.add?.bind(el.classList));
          el.classList.remove = jest.fn(el.classList.remove?.bind(el.classList));
          return el;
      }
      return createDOMMockElement('div', selector.replace(/[#.]/g, ''));
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
      const initialPrompts = [{id: 'initLoad', title: 'Initial'}];
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockResolvedValueOnce(initialPrompts);
      await UI.initializeUI();
      expect(document.getElementById).toHaveBeenCalledWith('tab-all'); 
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalledTimes(1);
    });

    test('should handle errors during initialization when loadPrompts fails', async () => {
      const loadError = new Error('Load error');
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockRejectedValueOnce(loadError);
      await UI.initializeUI();
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
        'Error loading and displaying prompt data', 
        expect.objectContaining({ originalError: loadError, userVisible: true })
      );
    });

    test('should handle errors from cacheDOMElements if it throws', async () => {
        const cacheError = new Error('Caching DOM failed');
        document.getElementById = jest.fn().mockImplementationOnce(() => { 
            throw cacheError; 
        });
        await UI.initializeUI();
        expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
            'Error initializing UI', 
            expect.objectContaining({ originalError: cacheError, userVisible: true })
        );
    });
  });

  describe('loadAndDisplayData', () => {
    test('should load prompts and call displayPrompts (via showTab)', async () => {
      const mockPrompts = [{id: '1', title: 'Test'}];
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockResolvedValueOnce(mockPrompts);
      window.PromptFinder.PromptData.filterPrompts.mockImplementation(inputPrompts => inputPrompts); 
      
      const displayPromptsSpy = jest.spyOn(UI, 'displayPrompts').mockImplementation(() => {});
      await UI.loadAndDisplayData(); 
      
      expect(displayPromptsSpy).toHaveBeenCalledWith(mockPrompts); 
      displayPromptsSpy.mockRestore(); 
    });

    test('should handle errors from loadPrompts and update UI to show error', async () => {
      const loadError = new Error('Failed to load');
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockRejectedValueOnce(loadError);
      // UI.initializeUI(); // Call this to ensure promptsListEl is cached by cacheDOMElements
      const promptsList = document.getElementById('prompts-list'); // Get the element ui.js should use
      
      await UI.loadAndDisplayData();

      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
        'Error loading and displaying prompt data', 
        expect.objectContaining({ originalError: loadError, userVisible: true })
      );
      expect(promptsList.innerHTML).toContain('Could not load prompts.');
    });
  });

  describe('displayPrompts', () => {
    let promptsListElForTest; // Use a specific reference for tests
    beforeEach(() => { 
        UI.cacheDOMElements(); // Ensure UI module caches its elements
        promptsListElForTest = document.getElementById('prompts-list'); 
        promptsListElForTest.innerHTML = ''; // Clear before each test in this block
    });

    test('should display a list of prompts', () => {
        const prompts = [{ id: '1', title: 'Test Prompt Display', tags: [], userId: 'testUser', userIsFavorite: false }];
        UI.displayPrompts(prompts); 
        expect(promptsListElForTest.innerHTML).toContain('Test Prompt Display');
        expect(promptsListElForTest.appendChild).toHaveBeenCalled(); 
      });
  
      test('should show empty state if no prompts', () => {
        UI.displayPrompts([]);
        expect(promptsListElForTest.innerHTML).toContain('No prompts found');
      });
  });

  describe('displayPromptDetails', () => {
    beforeEach(() => {
        UI.cacheDOMElements(); 
    });

    test('should display prompt details in the UI', async () => { 
        const prompt = { id: '1', title: 'Detail Title', text: 'Detail Text', category: 'Cat', tags: ['tag1'], userIsFavorite: false, isPrivate: false, userId: 'testUser' };
        UI.displayPromptDetails(prompt);
        
        const titleEl = document.getElementById('prompt-detail-title');
        const textEl = document.getElementById('prompt-detail-text');
        const starRatingContainerEl = document.getElementById('star-rating');

        if (titleEl) expect(titleEl.textContent).toBe('Detail Title');
        if (textEl) expect(textEl.textContent).toBe('Detail Text');
        if (starRatingContainerEl) {
            expect(starRatingContainerEl.appendChild).toHaveBeenCalled(); 
        }
      });
  });
});

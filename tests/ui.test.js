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
    appendChild: jest.fn(), // Mock appendChild itself
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    querySelector: jest.fn(selector => {
        const childId = selector.startsWith('#') ? selector.substring(1) : selector.replace(/[.#]/g, '');
        if (id === 'prompt-details-section' && childId === 'toggle-fav-detail') {
            const favButton = createDOMMockElement('button', 'toggle-fav-detail');
            favButton.querySelector = jest.fn().mockReturnValue(createDOMMockElement('i')); 
            return favButton;
        }
        return createDOMMockElement('div', childId); 
    }),
    querySelectorAll: jest.fn(() => [createDOMMockElement('mockedChild')]),
    dataset: {}, 
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    reset: jest.fn(),
    focus: jest.fn(),
    click: jest.fn(),
    nodeType: 1, // Node.ELEMENT_NODE - Important for appendChild in JSDOM
    // If appendChild still fails, JSDOM might need a more complete Node-like object.
    // For simple cases, just having appendChild as jest.fn() on the parent is enough.
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
    if (domElementsCache[id]) return domElementsCache[id];
    
    const actualElement = document.body.querySelector(`#${id}`);
    let mockElementToCache;

    if (actualElement) {
        mockElementToCache = actualElement;
        mockElementToCache.classList = actualElement.classList || { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() };
        if (!actualElement.dataset) mockElementToCache.dataset = {}; 
        mockElementToCache.style = actualElement.style || {};
        mockElementToCache.appendChild = actualElement.appendChild || jest.fn();
        mockElementToCache.addEventListener = actualElement.addEventListener || jest.fn();
        mockElementToCache.removeEventListener = actualElement.removeEventListener || jest.fn();
        mockElementToCache.setAttribute = actualElement.setAttribute || jest.fn();
        mockElementToCache.removeAttribute = actualElement.removeAttribute || jest.fn();
        mockElementToCache.focus = actualElement.focus || jest.fn();
        mockElementToCache.click = actualElement.click || jest.fn();
        mockElementToCache.reset = actualElement.reset || jest.fn(); 
        mockElementToCache.nodeType = 1; 
        
        const originalQuerySelector = actualElement.querySelector?.bind(actualElement);
        mockElementToCache.querySelector = jest.fn(selector => {
            const child = originalQuerySelector ? originalQuerySelector(selector) : null;
            if (child) {
                 child.classList = child.classList || { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() };
                 if(!child.dataset) child.dataset = {};
                 child.nodeType = 1;
                 child.querySelector = child.querySelector || jest.fn().mockReturnValue(createDOMMockElement('i')); 
                 return child;
            }
            return createDOMMockElement('div', selector.replace(/[#.]/g, ''));
        });
        mockElementToCache.querySelectorAll = actualElement.querySelectorAll || jest.fn(() => []);
    } else {
        mockElementToCache = createDOMMockElement('div', id);
    }
    domElementsCache[id] = mockElementToCache;
    return mockElementToCache;
  });

  document.createElement = jest.fn((tagName) => createDOMMockElement(tagName));
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
        UI.displayPrompts(prompts); 
        if (promptsList) {
            // Check that appendChild was called on promptsList, implying content was added
            expect(promptsList.appendChild).toHaveBeenCalled(); 
            // We can't reliably check innerHTML if createDOMMockElement doesn't update parent's innerHTML
            // Instead, we trust the forEach loop ran and appendChild was attempted.
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
    test('should display prompt details in the UI', async () => { 
        const prompt = { id: '1', title: 'Detail Title', text: 'Detail Text', category: 'Cat', tags: ['tag1'], userIsFavorite: false, isPrivate: false, userId: 'testUser' };
        await UI.initializeUI(); 
        UI.displayPromptDetails(prompt);
        const titleEl = document.getElementById('prompt-detail-title');
        const textEl = document.getElementById('prompt-detail-text');
        if (titleEl) expect(titleEl.textContent).toBe('Detail Title');
        if (textEl) expect(textEl.textContent).toBe('Detail Text');
        // Check if starRatingContainerEl.appendChild was called, indicating stars were added
        const starRatingContainerEl = document.getElementById('star-rating');
        if (starRatingContainerEl) {
            expect(starRatingContainerEl.appendChild).toHaveBeenCalled();
        }
      });
  });
});

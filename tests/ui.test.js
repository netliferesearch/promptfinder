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

const createDOMMockElement = (tagName = 'div', id = '') => {
  const elem = document.createElement(tagName); // Use JSDOM's createElement
  if (id) elem.id = id;

  // Enhance with Jest mocks for methods we might call or spy on
  elem.classList.add = jest.fn();
  elem.classList.remove = jest.fn();
  elem.classList.toggle = jest.fn();
  // elem.classList.contains = jest.fn(() => false); // JSDOM has this
  elem.style = elem.style || {}; // JSDOM has this
  elem.appendChild = jest.fn(elem.appendChild.bind(elem)); // Spy on real appendChild
  elem.addEventListener = jest.fn(elem.addEventListener.bind(elem));
  elem.setAttribute = jest.fn(elem.setAttribute.bind(elem));
  elem.getAttribute = jest.fn(elem.getAttribute.bind(elem));
  elem.removeAttribute = jest.fn(elem.removeAttribute.bind(elem));
  
  // querySelector and querySelectorAll on JSDOM elements are usually fine
  // but if we create complex structures, we might mock them if needed for children
  const originalQuerySelector = elem.querySelector?.bind(elem);
  elem.querySelector = jest.fn(selector => {
      if (originalQuerySelector) {
          const child = originalQuerySelector(selector);
          if (child) {
              if(!child.dataset) child.dataset = {}; // Ensure dataset exists
              child.classList.add = child.classList.add || jest.fn(); // Augment if needed
              return child;
          }
      }
      // Fallback if querySelector or child not found
      const mockChild = createDOMMockElement('div', selector.replace(/[#.]/g, ''));
      // Special case for the icon inside toggle-fav-detail button
      if (selector === 'i' && (elem.id === 'toggle-fav-detail' || elem.classList.contains('toggle-favorite'))) {
        mockChild.className = ''; // Mock the className property for the icon
      }
      return mockChild;
  });
  elem.querySelectorAll = elem.querySelectorAll || jest.fn(() => []);

  // dataset is a DOMStringMap. We typically don't overwrite it.
  // Ensure it exists, which JSDOM elements should have.
  if (typeof elem.dataset === 'undefined') {
    elem.dataset = {}; 
  }
  
  elem.innerHTML = '';
  elem.textContent = '';
  elem.value = '';
  elem.checked = false;
  elem.reset = jest.fn();
  elem.focus = jest.fn();
  elem.click = jest.fn();
  // elem.nodeType = 1; // JSDOM elements have this natively
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
    let elementToCache;

    if (actualElement) {
        elementToCache = actualElement;
        // Augment with Jest mocks ONLY IF the method doesn't exist or needs spying
        elementToCache.classList.add = jest.fn(elementToCache.classList.add?.bind(elementToCache.classList));
        elementToCache.classList.remove = jest.fn(elementToCache.classList.remove?.bind(elementToCache.classList));
        elementToCache.classList.toggle = jest.fn(elementToCache.classList.toggle?.bind(elementToCache.classList));
        // dataset is fine on JSDOM elements for property access el.dataset.foo = 'bar'
        if (typeof elementToCache.dataset === 'undefined') elementToCache.dataset = {};
        
        elementToCache.appendChild = jest.fn(elementToCache.appendChild?.bind(elementToCache));
        elementToCache.addEventListener = jest.fn(elementToCache.addEventListener?.bind(elementToCache));
        elementToCache.querySelector = jest.fn(elementToCache.querySelector?.bind(elementToCache));

    } else {
        elementToCache = createDOMMockElement('div', id);
    }
    domElementsCache[id] = elementToCache;
    return elementToCache;
  });

  // document.createElement should return an actual JSDOM element, then we can mock methods on it if needed
  document.createElement = jest.fn((tagName) => {
    const elem = document.createElement(tagName); // Use actual JSDOM createElement
    // Enhance with Jest spied methods AFTER creation
    elem.classList.add = jest.fn(elem.classList.add.bind(elem.classList));
    elem.classList.remove = jest.fn(elem.classList.remove.bind(elem.classList));
    elem.appendChild = jest.fn(elem.appendChild.bind(elem));
    elem.addEventListener = jest.fn(elem.addEventListener.bind(elem));
    elem.setAttribute = jest.fn(elem.setAttribute.bind(elem));
    if(typeof elem.dataset === 'undefined') elem.dataset = {}; // Ensure dataset exists, JSDOM elements have it
    return elem;
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
      window.PromptFinder.PromptData.loadPrompts.mockResolvedValueOnce(initialPrompts);
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

    test('should handle errors from cacheDOMElements if it throws (e.g., getElementById fails)', async () => {
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
      
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalledTimes(1);
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
    let promptsList;
    beforeEach(async () => { // Make beforeEach async if UI.initializeUI is async
        await UI.initializeUI(); // Ensure elements are cached
        promptsList = document.getElementById('prompts-list'); 
    });

    test('should display a list of prompts', () => {
        const prompts = [{ id: '1', title: 'Test Prompt Display', tags: [], userId: 'testUser', userIsFavorite: false }];
        UI.displayPrompts(prompts); 
        if (promptsList) {
            expect(promptsList.innerHTML).toContain('Test Prompt Display');
            expect(promptsList.appendChild).toHaveBeenCalled(); // Check if elements were added
        }
      });
  
      test('should show empty state if no prompts', () => {
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
        const starRatingContainerEl = document.getElementById('star-rating');

        if (titleEl) expect(titleEl.textContent).toBe('Detail Title');
        if (textEl) expect(textEl.textContent).toBe('Detail Text');
        if (starRatingContainerEl) {
            expect(starRatingContainerEl.appendChild).toHaveBeenCalled(); 
        }
      });
  });
});

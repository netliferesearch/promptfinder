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
  // Use JSDOM's createElement to get a more realistic Node
  const elem = document.createElement(tagName);
  if (id) elem.id = id;

  // Augment with Jest spies for methods we want to track or control
  // We need to be careful not to overwrite native getters/setters like dataset if JSDOM provides them well.
  elem.classList.add = jest.fn(elem.classList.add.bind(elem.classList));
  elem.classList.remove = jest.fn(elem.classList.remove.bind(elem.classList));
  elem.classList.toggle = jest.fn(elem.classList.toggle.bind(elem.classList));
  // elem.classList.contains = jest.fn(elem.classList.contains.bind(elem.classList)); // JSDOM provides this
  
  elem.style = elem.style || {}; // JSDOM provides this
  
  // Spy on appendChild by wrapping the original
  const originalAppendChild = elem.appendChild.bind(elem);
  elem.appendChild = jest.fn(originalAppendChild);

  elem.addEventListener = jest.fn(elem.addEventListener.bind(elem));
  elem.setAttribute = jest.fn(elem.setAttribute.bind(elem));
  elem.getAttribute = jest.fn(elem.getAttribute.bind(elem));
  elem.removeAttribute = jest.fn(elem.removeAttribute.bind(elem));
  
  const originalQuerySelector = elem.querySelector?.bind(elem);
  elem.querySelector = jest.fn(selector => {
      if (originalQuerySelector) {
          const child = originalQuerySelector(selector);
          if (child) {
              // Enhance child only if necessary (e.g., if it's a plain JSDOM node without Jest spies)
              if (!child.dataset) child.dataset = {}; // Ensure dataset for all children found
              child.classList.add = child.classList.add || jest.fn();
              child.querySelector = child.querySelector || jest.fn().mockReturnValue(createDOMMockElement('i'));
              return child;
          }
      }
      return createDOMMockElement('div', selector.replace(/[#.]/g, '')); // Fallback
  });
  elem.querySelectorAll = elem.querySelectorAll || jest.fn(() => []);

  // JSDOM elements have `dataset` as a DOMStringMap. It's writable for properties.
  // If `elem` is a JSDOM element, `elem.dataset` is already a DOMStringMap.
  // If we are creating a pure mock, initialize it.
  if (typeof elem.dataset === 'undefined') elem.dataset = {}; 
  
  // elem.innerHTML = ''; // JSDOM elements have this
  // elem.textContent = ''; // JSDOM elements have this
  elem.value = elem.value || ''; // JSDOM input elements have this
  elem.checked = elem.checked || false;
  elem.reset = elem.reset || jest.fn();
  elem.focus = elem.focus || jest.fn();
  elem.click = elem.click || jest.fn();
  // nodeType is a read-only property of actual DOM nodes. Do not set it here.
  // JSDOM elements will have their correct nodeType.
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
  
  // Store original createElement before mocking it
  const originalDocumentCreateElement = document.createElement;

  document.getElementById = jest.fn(id => {
    if (domElementsCache[id]) return domElementsCache[id];
    
    let elementToCache = document.body.querySelector(`#${id}`);

    if (elementToCache) {
        // Augment the JSDOM element with Jest spies for methods IF they exist
        // This ensures we are spying on actual JSDOM methods where possible
        elementToCache.classList.add = jest.fn(elementToCache.classList.add.bind(elementToCache.classList));
        elementToCache.classList.remove = jest.fn(elementToCache.classList.remove.bind(elementToCache.classList));
        elementToCache.classList.toggle = jest.fn(elementToCache.classList.toggle.bind(elementToCache.classList));
        // Do not overwrite dataset or nodeType on actual JSDOM elements.
        // Ensure dataset exists (it should on HTMLElement)
        if(typeof elementToCache.dataset === 'undefined') elementToCache.dataset = {};
        
        elementToCache.appendChild = jest.fn(elementToCache.appendChild.bind(elementToCache));
        elementToCache.addEventListener = jest.fn(elementToCache.addEventListener.bind(elementToCache));
        
        const originalQuerySelector = elementToCache.querySelector?.bind(elementToCache);
        elementToCache.querySelector = jest.fn(selector => {
            const child = originalQuerySelector ? originalQuerySelector(selector) : null;
            if (child) {
                 child.classList = child.classList || { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() };
                 if(!child.dataset) child.dataset = {};
                 child.querySelector = child.querySelector || jest.fn().mockReturnValue(createDOMMockElement('i')); 
                 return child;
            }
            return createDOMMockElement('div', selector.replace(/[#.]/g, ''));
        });
    } else {
        elementToCache = createDOMMockElement('div', id);
    }
    domElementsCache[id] = elementToCache;
    return elementToCache;
  });

  // Mock document.createElement to return JSDOM elements enhanced with spies
  document.createElement = jest.fn((tagName) => {
    const elem = originalDocumentCreateElement.call(document, tagName); // Use actual JSDOM createElement
    // Enhance with Jest spied methods AFTER creation
    elem.classList.add = jest.fn(elem.classList.add.bind(elem.classList));
    elem.classList.remove = jest.fn(elem.classList.remove.bind(elem.classList));
    elem.appendChild = jest.fn(elem.appendChild.bind(elem));
    elem.addEventListener = jest.fn(elem.addEventListener.bind(elem));
    elem.setAttribute = jest.fn(elem.setAttribute.bind(elem));
    if(typeof elem.dataset === 'undefined') elem.dataset = {}; 
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
    beforeEach(async () => { 
        await UI.initializeUI(); 
        promptsList = document.getElementById('prompts-list'); 
    });

    test('should display a list of prompts', () => {
        const prompts = [{ id: '1', title: 'Test Prompt Display', tags: [], userId: 'testUser', userIsFavorite: false }];
        UI.displayPrompts(prompts); 
        if (promptsList) {
            expect(promptsList.innerHTML).toContain('Test Prompt Display');
            expect(promptsList.appendChild).toHaveBeenCalled(); 
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

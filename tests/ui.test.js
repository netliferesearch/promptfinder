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

// Store original document methods before mocking them
const originalDocumentCreateElement = document.createElement;
const originalDocumentGetElementById = document.getElementById;
const originalDocumentQuerySelector = document.querySelector;

const createDOMMockElement = (tagName = 'div', id = '') => {
  const elem = originalDocumentCreateElement.call(document, tagName); // Use JSDOM's createElement
  if (id) elem.id = id;

  // Ensure dataset is a plain object for easier mocking if JSDOM's is problematic for assignment
  if (typeof elem.dataset === 'undefined') { 
    elem.dataset = {}; 
  }

  // Augment with Jest spies or ensure methods exist
  elem.classList.add = jest.fn(elem.classList.add?.bind(elem.classList));
  elem.classList.remove = jest.fn(elem.classList.remove?.bind(elem.classList));
  elem.classList.toggle = jest.fn(elem.classList.toggle?.bind(elem.classList));
  if(!elem.classList.contains) elem.classList.contains = jest.fn(()=>false);
  
  elem.style = elem.style || {}; 
  
  const originalElemAppendChild = elem.appendChild?.bind(elem);
  elem.appendChild = jest.fn(originalElemAppendChild || (() => {}));

  elem.addEventListener = jest.fn(elem.addEventListener?.bind(elem));
  elem.setAttribute = jest.fn(elem.setAttribute?.bind(elem));
  elem.getAttribute = jest.fn(elem.getAttribute?.bind(elem));
  elem.removeAttribute = jest.fn(elem.removeAttribute?.bind(elem));
  
  const originalElemQuerySelector = elem.querySelector?.bind(elem);
  elem.querySelector = jest.fn(selector => {
      if (originalElemQuerySelector) {
          const child = originalElemQuerySelector(selector);
          if (child) {
              if(!child.dataset) child.dataset = {}; 
              child.classList.add = child.classList.add || jest.fn();
              child.querySelector = child.querySelector || jest.fn().mockReturnValue(createDOMMockElement('i'));
              return child;
          }
      }
      return createDOMMockElement('div', selector.replace(/[#.]/g, ''));
  });
  elem.querySelectorAll = elem.querySelectorAll || jest.fn(() => []);
  
  elem.innerHTML = elem.innerHTML || '';
  elem.textContent = elem.textContent || '';
  elem.value = elem.value || '';
  elem.checked = elem.checked || false;
  elem.reset = elem.reset || jest.fn();
  elem.focus = elem.focus || jest.fn();
  elem.click = elem.click || jest.fn();
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
    let elementToCache = originalDocumentGetElementById.call(document, id); // Use original

    if (elementToCache) {
        // Augment the JSDOM element with Jest spies
        elementToCache.classList.add = jest.fn(elementToCache.classList.add.bind(elementToCache.classList));
        elementToCache.classList.remove = jest.fn(elementToCache.classList.remove.bind(elementToCache.classList));
        elementToCache.classList.toggle = jest.fn(elementToCache.classList.toggle.bind(elementToCache.classList));
        if (typeof elementToCache.dataset === 'undefined') elementToCache.dataset = {};
        
        const originalElemAppendChild = elementToCache.appendChild.bind(elementToCache);
        elementToCache.appendChild = jest.fn(originalElemAppendChild);
        elementToCache.addEventListener = jest.fn(elementToCache.addEventListener.bind(elementToCache));
        
        const originalElemQuerySelector = elementToCache.querySelector?.bind(elementToCache);
        elementToCache.querySelector = jest.fn(selector => {
            const child = originalElemQuerySelector ? originalElemQuerySelector(selector) : null;
            if (child) {
                 if(typeof child.dataset === 'undefined') child.dataset = {};
                 child.classList.add = child.classList.add || jest.fn(); 
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

  document.createElement = jest.fn((tagName) => createDOMMockElement(tagName));
  document.querySelector = jest.fn((selector) => {
    const el = originalDocumentQuerySelector.call(document, selector);
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
        // Restore original getElementById for this test, then mock it to throw
        const realGetElementById = originalDocumentGetElementById; 
        document.getElementById = jest.fn().mockImplementationOnce(() => { 
            document.getElementById = realGetElementById; // Restore after first call
            throw cacheError; 
        });
        await UI.initializeUI();
        expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
            'Error initializing UI', 
            expect.objectContaining({ originalError: cacheError, userVisible: true })
        );
        document.getElementById = realGetElementById; // Ensure it's restored
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
        const promptsListLocal = document.getElementById('prompts-list'); 
        UI.displayPrompts(prompts); 
        if (promptsListLocal) {
            expect(promptsListLocal.innerHTML).toContain('Test Prompt Display');
            expect(promptsListLocal.appendChild).toHaveBeenCalled(); 
        }
      });
  
      test('should show empty state if no prompts', () => {
        const promptsListLocal = document.getElementById('prompts-list');
        UI.displayPrompts([]);
        if (promptsListLocal) {
            expect(promptsListLocal.innerHTML).toContain('No prompts found');
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

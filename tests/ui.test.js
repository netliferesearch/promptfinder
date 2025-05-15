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

// Store original document methods at the very top, before any test code might run or re-mock them.
const _trulyOriginalDocumentCreateElement = document.createElement;
const _trulyOriginalDocumentGetElementById = document.getElementById;
const _trulyOriginalDocumentQuerySelector = document.querySelector;

// This function definition should use the _trulyOriginalDocumentCreateElement
const createDOMMockElement = (tagName = 'div', id = '') => {
  const elem = _trulyOriginalDocumentCreateElement.call(document, tagName); 
  if (id) elem.id = id;
  if (typeof elem.dataset === 'undefined') elem.dataset = {}; 

  elem.classList.add = jest.fn(elem.classList.add?.bind(elem.classList));
  elem.classList.remove = jest.fn(elem.classList.remove?.bind(elem.classList));
  elem.classList.toggle = jest.fn(elem.classList.toggle?.bind(elem.classList));
  if(!elem.classList.contains && typeof elem.classList.contains !== 'function') elem.classList.contains = jest.fn(()=>false);
  
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
              if(typeof child.dataset === 'undefined') child.dataset = {}; 
              child.classList.add = child.classList.add || jest.fn();
              // When mocking children, ensure they also use the safe createDOMMockElement if they need further mocking
              child.querySelector = child.querySelector || jest.fn().mockReturnValue(createDOMMockElement('i'));
              return child;
          }
      }
      // If original querySelector fails or doesn't exist, create a full mock for the child
      const mockChild = createDOMMockElement('div', selector.replace(/[#.]/g, ''));
      if (selector === 'i' && (elem.id === 'toggle-fav-detail' || elem.classList.contains('toggle-favorite'))) {
        mockChild.className = ''; 
      }
      return mockChild;
  });
  elem.querySelectorAll = elem.querySelectorAll || jest.fn(() => []);
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
    let elementToCache = _trulyOriginalDocumentGetElementById.call(document, id); 
    if (elementToCache) {
        elementToCache.classList.add = jest.fn(elementToCache.classList.add?.bind(elementToCache.classList));
        elementToCache.classList.remove = jest.fn(elementToCache.classList.remove?.bind(elementToCache.classList));
        elementToCache.classList.toggle = jest.fn(elementToCache.classList.toggle?.bind(elementToCache.classList));
        if (typeof elementToCache.dataset === 'undefined') elementToCache.dataset = {};
        const originalElemAppendChild = elementToCache.appendChild?.bind(elementToCache);
        elementToCache.appendChild = jest.fn(originalElemAppendChild || (()=> {}));
        elementToCache.addEventListener = jest.fn(elementToCache.addEventListener?.bind(elementToCache));
        const originalElemQuerySelectorFn = elementToCache.querySelector?.bind(elementToCache);
        elementToCache.querySelector = jest.fn(selector => {
            const child = originalElemQuerySelectorFn ? originalElemQuerySelectorFn(selector) : null;
            if (child) {
                 if(typeof child.dataset === 'undefined') child.dataset = {};
                 child.classList.add = child.classList.add || jest.fn(); 
                 child.querySelector = child.querySelector || jest.fn().mockReturnValue(createDOMMockElement('i')); 
                 return child;
            }
            return createDOMMockElement('div', selector.replace(/[#.]/g, ''));
        });
    } else {
        elementToCache = createDOMMockElement('div', id); // Uses the globally defined createDOMMockElement
    }
    domElementsCache[id] = elementToCache;
    return elementToCache;
  });

  // Crucially, document.createElement is mocked AFTER createDOMMockElement is defined and uses the original.
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
        // Temporarily break getElementById for this test
        document.getElementById = jest.fn().mockImplementationOnce(() => { 
            throw cacheError; 
        });
        await UI.initializeUI();
        expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
            'Error initializing UI', 
            expect.objectContaining({ originalError: cacheError, userVisible: true })
        );
        // No need to restore document.getElementById here, beforeEach will reset it with setupMockDOM()
    });
  });

  describe('loadAndDisplayData', () => {
    test('should load prompts and call displayPrompts (via showTab)', async () => {
      const mockPrompts = [{id: '1', title: 'Test'}];
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockResolvedValueOnce(mockPrompts);
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
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockRejectedValueOnce(loadError);
      // Call initializeUI to ensure promptsListEl is cached inside UI module
      await UI.initializeUI();
      // Now that promptsListEl is cached, we expect its innerHTML to be updated
      const promptsList = document.getElementById('prompts-list'); // Get the (mocked) element
      
      // We need to call loadAndDisplayData again *after* initializeUI has cached the element
      // and with the specific mock for this test.
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockRejectedValueOnce(loadError);
      await UI.loadAndDisplayData();

      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
        'Error loading and displaying prompt data', 
        expect.objectContaining({ originalError: loadError, userVisible: true })
      );
      if (promptsList && typeof promptsList.innerHTML === 'string') { 
        expect(promptsList.innerHTML).toContain('Could not load prompts.');
      }
    });
  });

  describe('displayPrompts', () => {
    let promptsListElFromUIModule; // To hold the reference cached by UI.js
    beforeEach(async () => { 
        window.PromptFinder.PromptData.loadPrompts.mockReset().mockResolvedValueOnce([]); // Ensure initializeUI runs cleanly
        await UI.initializeUI(); // This will call cacheDOMElements
        // Access the element ui.js actually uses (if it were exposed, or test side effects)
        // For now, we assume getElementById in the test gets the same enhanced JSDOM mock
        promptsListElFromUIModule = document.getElementById('prompts-list'); 
    });

    test('should display a list of prompts', () => {
        const prompts = [{ id: '1', title: 'Test Prompt Display', tags: [], userId: 'testUser', userIsFavorite: false }];
        UI.displayPrompts(prompts); 
        if (promptsListElFromUIModule) {
            expect(promptsListElFromUIModule.innerHTML).toContain('Test Prompt Display');
            expect(promptsListElFromUIModule.appendChild).toHaveBeenCalled(); 
        }
      });
  
      test('should show empty state if no prompts', () => {
        UI.displayPrompts([]);
        if (promptsListElFromUIModule) {
            expect(promptsListElFromUIModule.innerHTML).toContain('No prompts found');
        }
      });
  });

  describe('displayPromptDetails', () => {
    beforeEach(async () => {
        window.PromptFinder.PromptData.loadPrompts.mockReset().mockResolvedValueOnce([]); 
        await UI.initializeUI(); // Ensure elements are cached via cacheDOMElements
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

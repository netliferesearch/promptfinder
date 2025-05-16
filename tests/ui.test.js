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

// Store original document methods AT THE VERY TOP of the test file
const _originalCreateElement = document.createElement;
const _originalGetElementById = document.getElementById;
const _originalQuerySelector = document.querySelector;

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

  // Mock getElementById to return JSDOM elements and spy on their methods
  document.getElementById = jest.fn(id => {
    const elem = _originalGetElementById.call(document, id);
    if (elem) {
      // Spy on methods we care about, only if not already a mock
      if (elem.classList) {
        if (!jest.isMockFunction(elem.classList.add)) {
            elem.classList.add = jest.fn(elem.classList.add?.bind(elem.classList));
        }
        if (!jest.isMockFunction(elem.classList.remove)) {
            elem.classList.remove = jest.fn(elem.classList.remove?.bind(elem.classList));
        }
        if (!jest.isMockFunction(elem.classList.toggle)) {
            elem.classList.toggle = jest.fn(elem.classList.toggle?.bind(elem.classList));
        }
      }
      if (elem.appendChild && typeof elem.appendChild === 'function' && !jest.isMockFunction(elem.appendChild)) {
        elem.appendChild = jest.fn(elem.appendChild.bind(elem));
      }
      if (elem.addEventListener && typeof elem.addEventListener === 'function' && !jest.isMockFunction(elem.addEventListener)) {
        elem.addEventListener = jest.fn(elem.addEventListener.bind(elem));
      }
      if (typeof elem.dataset === 'undefined') elem.dataset = {};
    }
    return elem; 
  });

  // Mock createElement to return JSDOM elements and spy on their methods
  document.createElement = jest.fn(tagName => {
    const elem = _originalCreateElement.call(document, tagName);
      if (elem.classList) {
        if (!jest.isMockFunction(elem.classList.add)) {
            elem.classList.add = jest.fn(elem.classList.add?.bind(elem.classList));
        }
      }
    if (elem.appendChild && typeof elem.appendChild === 'function' && !jest.isMockFunction(elem.appendChild)) {
        elem.appendChild = jest.fn(elem.appendChild.bind(elem));
    }
    if (elem.addEventListener && typeof elem.addEventListener === 'function' && !jest.isMockFunction(elem.addEventListener)) {
        elem.addEventListener = jest.fn(elem.addEventListener.bind(elem));
    }
    if (elem.setAttribute && typeof elem.setAttribute === 'function' && !jest.isMockFunction(elem.setAttribute)) {
        elem.setAttribute = jest.fn(elem.setAttribute.bind(elem));
    }
    if (typeof elem.dataset === 'undefined') elem.dataset = {};
    return elem;
  });
  
  document.querySelector = jest.fn(selector => {
      const elem = _originalQuerySelector.call(document, selector);
      // Similar logic for querySelector if deep spying is needed, but often not for querySelector itself.
      // For now, assume direct methods on the returned element are handled by getElementById or createElement if it was created by them.
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
        // Override the mock for this specific test case
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
      UI.cacheDOMElements(); 
      const mockPrompts = [{id: '1', title: 'Test Prompt Alpha'}]; 
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockResolvedValueOnce(mockPrompts);
      window.PromptFinder.PromptData.filterPrompts.mockImplementation(inputPrompts => inputPrompts); 
      
      const promptsList = document.getElementById('prompts-list');
      if (promptsList) promptsList.innerHTML = ''; 

      await UI.loadAndDisplayData(); 
      
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalledTimes(1);
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(mockPrompts, expect.objectContaining({ tab: 'all' })); 
      if (promptsList) {
        expect(promptsList.innerHTML).toContain('Test Prompt Alpha'); 
      }
    });

    test('should handle errors from loadPrompts and update UI to show error', async () => {
      const loadError = new Error('Failed to load');
      window.PromptFinder.PromptData.loadPrompts.mockReset().mockRejectedValueOnce(loadError);
      
      UI.cacheDOMElements(); 
      const promptsList = document.getElementById('prompts-list');
      if (promptsList) promptsList.innerHTML = '';

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
    let promptsListElForTest; 
    beforeEach(() => { 
        UI.cacheDOMElements(); 
        promptsListElForTest = document.getElementById('prompts-list'); 
        if (promptsListElForTest) promptsListElForTest.innerHTML = ''; 
    });

    test('should display a list of prompts', () => {
        const prompts = [{ id: '1', title: 'Test Prompt Beta', tags: [], userId: 'testUser', userIsFavorite: false }];
        UI.displayPrompts(prompts); 
        if (promptsListElForTest) {
            expect(promptsListElForTest.innerHTML).toContain('Test Prompt Beta');
            expect(promptsListElForTest.appendChild).toHaveBeenCalled(); 
        }
      });
  
      test('should show empty state if no prompts', () => {
        UI.displayPrompts([]);
        if (promptsListElForTest) {
            expect(promptsListElForTest.innerHTML).toContain('No prompts found');
        }
      });
  });

  describe('displayPromptDetails', () => {
    beforeEach(() => {
        UI.cacheDOMElements(); 
    });

    test('should display prompt details in the UI', async () => { 
        const prompt = { id: '1', title: 'Detail Title', text: 'Detail Text', category: 'Cat', tags: ['tag1'], userIsFavorite: false, isPrivate: false, userId: 'testUser' };
        UI.displayPromptDetails(prompt);
        
        // Crucially, get the element *after* UI.displayPromptDetails has potentially modified/interacted with it,
        // and rely on the fact that cacheDOMElements (called in beforeEach) has already spied on it.
        const starRatingContainerEl = UI.getStarRatingContainerElementForTest(); // We'll need to expose this from UI.js

        const titleEl = document.getElementById('prompt-detail-title');
        const textEl = document.getElementById('prompt-detail-text');

        if (titleEl) expect(titleEl.textContent).toBe('Detail Title');
        if (textEl) expect(textEl.textContent).toBe('Detail Text');
        if (starRatingContainerEl) {
            // Remove the debug logs for now, or keep them if you want to verify further
            // console.log('[TEST_DEBUG] starRatingContainerEl:', starRatingContainerEl);
            // console.log('[TEST_DEBUG] starRatingContainerEl.appendChild is mock:', jest.isMockFunction(starRatingContainerEl.appendChild));
            // console.log('[TEST_DEBUG] starRatingContainerEl.appendChild calls:', starRatingContainerEl.appendChild.mock.calls.length);
            expect(starRatingContainerEl.appendChild).toHaveBeenCalled(); 
        }
      });
  });
});

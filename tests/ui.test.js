/**
 * Tests for the ui.js module (ESM/v9 compatible)
 */
import { jest } from '@jest/globals';
import * as UI from '../js/ui.js';

// Mock dependencies of ui.js
jest.mock('../js/promptData.js', () => ({
  loadPrompts: jest.fn().mockResolvedValue([]),
  filterPrompts: jest.fn((prompts, _filters) => prompts), 
  findPromptById: jest.fn().mockResolvedValue(null),
  toggleFavorite: jest.fn().mockResolvedValue(null),
  ratePrompt: jest.fn().mockResolvedValue(null),
  copyPromptToClipboard: jest.fn().mockResolvedValue(true),
  deletePrompt: jest.fn().mockResolvedValue(true),
}));

jest.mock('../js/utils.js', () => ({
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
  escapeHTML: jest.fn(str => (typeof str === 'string' ? str.replace(/[&<>"'/]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;'
  }[s])) : str)),
  highlightStars: jest.fn(), 
}));

let mockAuthCurrentUser = null;
jest.mock('../js/firebase-init.js', () => ({
  auth: {
    get currentUser() { return mockAuthCurrentUser; }, 
  },
  db: {}, 
}));

import * as PromptData from '../js/promptData.js';
import * as Utils from '../js/utils.js';

const _originalCreateElement = document.createElement;
const _originalGetElementById = document.getElementById;
const _originalQuerySelector = document.querySelector;

const setupMockDOM = () => {
  document.body.innerHTML = `
    <div id="prompts-list"></div>
    <section id="prompt-details-section" class="hidden">
        <div class="detail-header-icons">
            <button id="back-to-list-button"></button>
            <button id="copy-prompt-button"></button>
        </div>
        <div class="detail-title-container">
            <h2 id="prompt-detail-title-heading"><span id="prompt-detail-title"></span></h2>
            <button id="toggle-fav-detail"><i></i></button>
        </div>
        <p><strong>Description:</strong> <span id="prompt-detail-description"></span></p>
        <div class="prompt-text-container">
            <p><strong>Prompt:</strong></p>
            <div id="prompt-text-wrapper" class="code-block-wrapper">
                <pre><code id="prompt-detail-text" class="language-markdown"></code></pre>
            </div>
            <button id="prompt-text-view-more"></button>
        </div>
        <p><strong>Category:</strong> <span id="prompt-detail-category"></span></p>
        <p><strong>Tags:</strong> <span id="prompt-detail-tags"></span></p>
        <p><strong>Target AI Tools:</strong> <span id="prompt-detail-tools"></span></p>
        <div class="ratings-section">
            <div class="user-rating-section">
                <strong id="user-rating-message"></strong> 
                <div id="user-star-rating"></div>
            </div>
            <div id="community-rating-section" class="community-rating-section hidden">
                <strong id="community-rating-label"></strong> 
                <div id="community-star-display"></div>
                <span id="community-average-rating-value"></span>
                <span id="community-rating-count"></span>
            </div>
        </div>
        <div class="prompt-meta">
            <p><strong>Author:</strong> <span id="prompt-detail-author"></span></p>
            <p><strong>Usage Count:</strong> <span id="prompt-detail-usage">0</span></p>
            <p><strong>Favorites:</strong> <span id="prompt-detail-favorites">0</span></p>
            <p><strong>Created:</strong> <span id="prompt-detail-created"></span></p>
            <p><strong>Last Updated:</strong> <span id="prompt-detail-updated"></span></p>
        </div>
        <div class="prompt-owner-actions" style="display: none;">
            <button id="edit-prompt-button" class="button button-secondary"><i class="fas fa-edit"></i> Edit Prompt</button>
            <button id="delete-prompt-detail-trigger-button" class="button button-danger"><i class="fas fa-trash"></i> Delete Prompt</button>
        </div>
        <div id="delete-confirmation" class="hidden">
            <button id="cancel-delete-button"></button>
            <button id="confirm-delete-button"></button>
        </div>
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

  const mockElementMethods = (elem) => {
    if (!elem) return null;
    if (elem.classList && !jest.isMockFunction(elem.classList.add)) {
      elem.classList.add = jest.fn(elem.classList.add?.bind(elem.classList));
      elem.classList.remove = jest.fn(elem.classList.remove?.bind(elem.classList));
      elem.classList.toggle = jest.fn(elem.classList.toggle?.bind(elem.classList));
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
    // Ensure querySelector on mocked elements is also a mock that returns mockable elements
    if (elem.querySelector && typeof elem.querySelector === 'function' && !jest.isMockFunction(elem.querySelector)){
        const originalQS = elem.querySelector.bind(elem);
        elem.querySelector = jest.fn(sel => mockElementMethods(originalQS(sel))); 
    }
    if (typeof elem.dataset === 'undefined') elem.dataset = {};
    if (typeof elem.style === 'undefined') elem.style = {}; 
    if (typeof elem.disabled === 'undefined') elem.disabled = false;
    return elem;
  };

  document.getElementById = jest.fn(id => mockElementMethods(_originalGetElementById.call(document, id)));
  document.createElement = jest.fn(tagName => mockElementMethods(_originalCreateElement.call(document, tagName)));
  document.querySelector = jest.fn(selector => mockElementMethods(_originalQuerySelector.call(document, selector)));
  
  window.Prism = { highlightElement: jest.fn() };
};
 

describe('UI Module', () => {
  beforeEach(() => {
    setupMockDOM();
    jest.clearAllMocks(); 
    PromptData.loadPrompts.mockClear().mockResolvedValue([]);
    PromptData.filterPrompts.mockClear().mockImplementation((prompts, _filters) => prompts);
    PromptData.findPromptById.mockClear().mockResolvedValue(null);
    Utils.handleError.mockClear();
    Utils.showConfirmationMessage.mockClear();
    mockAuthCurrentUser = null; 
    if(window.Prism) window.Prism.highlightElement.mockClear();
  });

  describe('initializeUI', () => {
    test('should cache DOM elements, setup event listeners, and load data', async () => {
      const initialPrompts = [{id: 'initLoad', title: 'Initial'}];
      PromptData.loadPrompts.mockResolvedValueOnce(initialPrompts);
      await UI.initializeUI();
      expect(document.getElementById).toHaveBeenCalledWith('tab-all'); 
      expect(PromptData.loadPrompts).toHaveBeenCalledTimes(1);
    });

    test('should handle errors during initialization when loadPrompts fails', async () => {
      const loadError = new Error('Load error');
      PromptData.loadPrompts.mockRejectedValueOnce(loadError);
      await UI.initializeUI();
      expect(Utils.handleError).toHaveBeenCalledWith(
        'Error loading and displaying prompt data', 
        expect.objectContaining({ originalError: loadError, userVisible: true })
      );
    });
  });

  describe('loadAndDisplayData', () => {
    test('should load prompts and call displayPrompts (via showTab)', async () => {
      UI.cacheDOMElements(); 
      const mockPrompts = [{id: '1', title: 'Test Prompt Alpha', currentUserIsFavorite: false}]; 
      PromptData.loadPrompts.mockResolvedValueOnce(mockPrompts);
      
      const promptsList = document.getElementById('prompts-list');
      if (promptsList) promptsList.innerHTML = ''; 

      await UI.loadAndDisplayData(); 
      
      expect(PromptData.loadPrompts).toHaveBeenCalledTimes(1);
      expect(PromptData.filterPrompts).toHaveBeenCalledWith(mockPrompts, expect.objectContaining({ tab: 'all' })); 
      if (promptsList) {
        expect(promptsList.innerHTML).toContain('Test Prompt Alpha'); 
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
        const prompts = [{ id: '1', title: 'Test Prompt Beta', tags: [], userId: 'testUser', currentUserIsFavorite: false }];
        UI.displayPrompts(prompts); 
        if (promptsListElForTest) {
            expect(promptsListElForTest.innerHTML).toContain('Test Prompt Beta');
        }
      });
  });

  describe('displayPromptDetails', () => {
    beforeEach(() => {
        UI.cacheDOMElements(); 
        mockAuthCurrentUser = { uid: 'testUser', email: 'test@example.com' }; 
    });

    test('should display prompt details and handle owner buttons', async () => { 
        const prompt = { id: '1', title: 'Detail Title', text: 'Detail Text', category: 'Cat', tags: ['tag1'], userId: 'testUser', currentUserIsFavorite: false, currentUserRating: 3, averageRating: 4.5, totalRatingsCount: 10, isPrivate: false };
        UI.displayPromptDetails(prompt);
        
        const titleEl = document.getElementById('prompt-detail-title');
        expect(titleEl.textContent).toBe('Detail Title');
        
        const ownerActionsContainer = document.querySelector('.prompt-owner-actions');
        const editButton = document.getElementById('edit-prompt-button');

        // Check the container's display for owner
        expect(ownerActionsContainer.style.display).toBe('flex'); 
        expect(editButton.disabled).toBe(false); 

        // Test for non-owner
        mockAuthCurrentUser = { uid: 'anotherTestUser', email: 'another@example.com' }; 
        // UI.displayPromptDetails(prompt); // Prompt owner is still 'testUser' from the prompt object
        // No, we need to simulate a prompt that testUser doesn't own, or just change current user.
        // The prompt's userId remains 'testUser'. currentUser is now 'anotherTestUser'.
        UI.displayPromptDetails(prompt); 

        expect(ownerActionsContainer.style.display).toBe('none'); 
        expect(editButton.disabled).toBe(true);
    });
  });
});

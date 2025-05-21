/**
 * Tests for the ui.js module (ESM/v9 compatible)
 */
import { jest } from '@jest/globals';
import * as UI from '../js/ui.js';

// Mock dependencies of ui.js
const mockPromptForFavoriteTests = {
  id: 'prompt123',
  title: 'Favorite Test',
  text: 'Some text',
  tags: [],
  userId: 'ownerUserId',
  category: 'Test',
  description: 'Test desc',
  currentUserIsFavorite: false, // Initial state
  favoritesCount: 0,
  // Add all fields expected by displayPromptDetails
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  authorDisplayName: 'Author Name',
  averageRating: 0,
  totalRatingsCount: 0,
  usageCount: 0,
  isPrivate: false,
  currentUserRating: 0,
};

jest.mock('../js/promptData.js', () => ({
  loadPrompts: jest.fn().mockResolvedValue([]),
  filterPrompts: jest.fn((prompts, _filters) => prompts),
  findPromptById: jest.fn().mockResolvedValue(null),
  toggleFavorite: jest.fn().mockImplementation(promptId =>
    Promise.resolve({
      ...mockPromptForFavoriteTests,
      id: promptId,
      currentUserIsFavorite: !mockPromptForFavoriteTests.currentUserIsFavorite,
      favoritesCount: mockPromptForFavoriteTests.currentUserIsFavorite ? 0 : 1,
    })
  ),
  ratePrompt: jest.fn().mockResolvedValue(null),
  copyPromptToClipboard: jest.fn().mockImplementation(promptId =>
    Promise.resolve({
      success: true,
      prompt: {
        ...mockPromptForFavoriteTests,
        id: promptId,
        usageCount: 1, // Simulate incremented usage count
      },
    })
  ),
  deletePrompt: jest.fn().mockResolvedValue(true),
}));

jest.mock('../js/utils.js', () => ({
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
  escapeHTML: jest.fn(str =>
    typeof str === 'string'
      ? str.replace(
          /[&<>"'/]/g,
          s =>
            ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#39;',
              '/': '&#x2F;',
            })[s]
        )
      : str
  ),
  highlightStars: jest.fn(),
}));

let mockAuthCurrentUser = null;
jest.mock('../js/firebase-init.js', () => ({
  auth: {
    get currentUser() {
      return mockAuthCurrentUser;
    },
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

  const mockElementMethods = elem => {
    if (!elem) return null;
    if (elem.classList && !jest.isMockFunction(elem.classList.add)) {
      elem.classList.add = jest.fn(elem.classList.add?.bind(elem.classList));
      elem.classList.remove = jest.fn(elem.classList.remove?.bind(elem.classList));
      elem.classList.toggle = jest.fn(elem.classList.toggle?.bind(elem.classList));
    }
    if (
      elem.appendChild &&
      typeof elem.appendChild === 'function' &&
      !jest.isMockFunction(elem.appendChild)
    ) {
      elem.appendChild = jest.fn(elem.appendChild.bind(elem));
    }
    if (
      elem.addEventListener &&
      typeof elem.addEventListener === 'function' &&
      !jest.isMockFunction(elem.addEventListener)
    ) {
      elem.addEventListener = jest.fn(elem.addEventListener.bind(elem));
    }
    if (
      elem.setAttribute &&
      typeof elem.setAttribute === 'function' &&
      !jest.isMockFunction(elem.setAttribute)
    ) {
      elem.setAttribute = jest.fn(elem.setAttribute.bind(elem));
    }
    if (
      elem.querySelector &&
      typeof elem.querySelector === 'function' &&
      !jest.isMockFunction(elem.querySelector)
    ) {
      const originalQS = elem.querySelector.bind(elem);
      elem.querySelector = jest.fn(sel => mockElementMethods(originalQS(sel)));
    }
    if (typeof elem.dataset === 'undefined') elem.dataset = {};
    if (typeof elem.style === 'undefined') elem.style = {};
    if (typeof elem.disabled === 'undefined') elem.disabled = false;
    return elem;
  };

  document.getElementById = jest.fn(id =>
    mockElementMethods(_originalGetElementById.call(document, id))
  );
  document.createElement = jest.fn(tagName =>
    mockElementMethods(_originalCreateElement.call(document, tagName))
  );
  document.querySelector = jest.fn(selector =>
    mockElementMethods(_originalQuerySelector.call(document, selector))
  );

  window.Prism = { highlightElement: jest.fn() };
  window.handleAuthRequiredAction = jest.fn();
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('UI Module', () => {
  beforeEach(() => {
    setupMockDOM();
    jest.clearAllMocks();
    PromptData.loadPrompts.mockClear().mockResolvedValue([]);
    PromptData.filterPrompts.mockClear().mockImplementation((prompts, _filters) => prompts);
    PromptData.findPromptById
      .mockClear()
      .mockResolvedValue({ ...mockPromptForFavoriteTests, id: 'anyPromptId' });
    PromptData.toggleFavorite.mockClear().mockImplementation(promptId =>
      Promise.resolve({
        ...mockPromptForFavoriteTests,
        id: promptId,
        currentUserIsFavorite: true,
        favoritesCount: 1,
      })
    );
    PromptData.copyPromptToClipboard.mockClear().mockResolvedValue(true);
    Utils.handleError.mockClear();
    Utils.showConfirmationMessage.mockClear();
    mockAuthCurrentUser = null;
    if (window.Prism) window.Prism.highlightElement.mockClear();
    if (window.handleAuthRequiredAction) window.handleAuthRequiredAction.mockClear();
  });

  describe('initializeUI', () => {
    test('should cache DOM elements, setup event listeners, and load data', async () => {
      const initialPrompts = [{ ...mockPromptForFavoriteTests, id: 'initLoad', title: 'Initial' }];
      PromptData.loadPrompts.mockResolvedValueOnce(initialPrompts);
      await UI.initializeUI();
      expect(document.getElementById).toHaveBeenCalledWith('tab-all');
      expect(PromptData.loadPrompts).toHaveBeenCalledTimes(1);
      const promptsListEl = document.getElementById('prompts-list');
      expect(promptsListEl.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
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
      const mockPrompts = [{ ...mockPromptForFavoriteTests, id: '1', title: 'Test Prompt Alpha' }];
      PromptData.loadPrompts.mockResolvedValueOnce(mockPrompts);

      const promptsList = document.getElementById('prompts-list');
      if (promptsList) promptsList.innerHTML = '';

      await UI.loadAndDisplayData();

      expect(PromptData.loadPrompts).toHaveBeenCalledTimes(1);
      expect(PromptData.filterPrompts).toHaveBeenCalledWith(
        mockPrompts,
        expect.objectContaining({ tab: 'all' })
      );
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
      const prompts = [{ ...mockPromptForFavoriteTests, id: '1', title: 'Test Prompt Beta' }];
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
      const prompt = {
        ...mockPromptForFavoriteTests,
        id: '1',
        title: 'Detail Title',
        userId: 'testUser',
        currentUserIsFavorite: false,
        currentUserRating: 3,
      };
      UI.displayPromptDetails(prompt);

      const titleEl = document.getElementById('prompt-detail-title');
      expect(titleEl.textContent).toBe('Detail Title');

      const ownerActionsContainer = document.querySelector('.prompt-owner-actions');
      const editButton = document.getElementById('edit-prompt-button');

      expect(ownerActionsContainer.style.display).toBe('flex');
      expect(editButton.disabled).toBe(false);

      mockAuthCurrentUser = { uid: 'anotherTestUser', email: 'another@example.com' };
      UI.displayPromptDetails(prompt);

      expect(ownerActionsContainer.style.display).toBe('none');
      expect(editButton.disabled).toBe(true);
    });
  });

  describe('handlePromptListClick interactions', () => {
    const mockPromptId = 'prompt123';
    const currentMockPromptInitial = {
      ...mockPromptForFavoriteTests,
      id: mockPromptId,
      currentUserIsFavorite: false,
      favoritesCount: 0,
    };
    // Removed unused displayDetailsSpy declaration

    beforeEach(async () => {
      mockAuthCurrentUser = { uid: 'currentUserTestUid', email: 'current@test.com' };
      PromptData.loadPrompts.mockResolvedValueOnce([currentMockPromptInitial]);
      await UI.initializeUI();
    });

    // No afterEach needed if spy is created and restored within the test itself
    // or if we are not using the spy for this specific test anymore.

    test('should call toggleFavorite and update UI when favorite button is clicked', async () => {
      PromptData.toggleFavorite.mockResolvedValueOnce({
        ...currentMockPromptInitial,
        currentUserIsFavorite: true,
        favoritesCount: 1,
      });

      const promptsListEl = document.getElementById('prompts-list');
      const favoriteButton = promptsListEl.querySelector(
        `.toggle-favorite[data-id="${mockPromptId}"]`
      );
      expect(favoriteButton).not.toBeNull();
      expect(favoriteButton.querySelector('i').classList.contains('far')).toBe(true);

      favoriteButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();
      await flushPromises();

      expect(PromptData.toggleFavorite).toHaveBeenCalledWith(mockPromptId);
      expect(Utils.showConfirmationMessage).toHaveBeenCalledWith('Favorite status updated!');
      const updatedFavoriteButton = promptsListEl.querySelector(
        `.toggle-favorite[data-id="${mockPromptId}"]`
      );
      expect(updatedFavoriteButton.querySelector('i').classList.contains('fas')).toBe(true);
    });

    test('should call viewPromptDetails and display details when the prompt card is clicked', async () => {
      PromptData.findPromptById.mockResolvedValueOnce(currentMockPromptInitial);

      const promptsListEl = document.getElementById('prompts-list');
      const promptCard = promptsListEl.querySelector(`.prompt-card-btn[data-id="${mockPromptId}"]`);
      expect(promptCard).not.toBeNull();

      const detailsSection = document.getElementById('prompt-details-section');
      expect(detailsSection.classList.contains('hidden')).toBe(true); // Verify it's hidden initially

      promptCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await flushPromises();
      await flushPromises();

      expect(PromptData.findPromptById).toHaveBeenCalledWith(mockPromptId);
      // Check side-effects of displayPromptDetails
      expect(detailsSection.classList.contains('hidden')).toBe(false);
      expect(detailsSection.dataset.currentPromptId).toBe(mockPromptId);
      const titleEl = document.getElementById('prompt-detail-title');
      expect(titleEl.textContent).toBe(currentMockPromptInitial.title);
    });

    test('should call copyPromptToClipboard when copy button is clicked', async () => {
      PromptData.copyPromptToClipboard.mockResolvedValueOnce({
        success: true,
        prompt: {
          ...currentMockPromptInitial,
          usageCount: (currentMockPromptInitial.usageCount || 0) + 1,
        },
      });
      PromptData.findPromptById.mockResolvedValueOnce(currentMockPromptInitial);

      const promptsListEl = document.getElementById('prompts-list');
      const copyButton = promptsListEl.querySelector(`.copy-prompt[data-id="${mockPromptId}"]`);
      expect(copyButton).not.toBeNull();

      copyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();

      expect(PromptData.copyPromptToClipboard).toHaveBeenCalledWith(mockPromptId);
      expect(Utils.showConfirmationMessage).toHaveBeenCalledWith('Prompt copied to clipboard!');
    });

    test('should call findPromptById when prompt card is clicked', async () => {
      const promptsListEl = document.getElementById('prompts-list');
      const promptCard = promptsListEl.querySelector('.prompt-card-btn');
      expect(promptCard).not.toBeNull();

      promptCard.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();

      // Now we expect findPromptById to be called because we made the whole card clickable
      expect(PromptData.findPromptById).toHaveBeenCalled();
    });

    test('should call window.handleAuthRequiredAction if favorite is clicked when logged out', async () => {
      mockAuthCurrentUser = null;

      const promptsListEl = document.getElementById('prompts-list');
      const favoriteButton = promptsListEl.querySelector(
        `.toggle-favorite[data-id="${mockPromptId}"]`
      );
      expect(favoriteButton).not.toBeNull();

      favoriteButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();

      expect(window.handleAuthRequiredAction).toHaveBeenCalledWith('favorite a prompt');
      expect(PromptData.toggleFavorite).not.toHaveBeenCalled();
    });

    test('should allow logged-out users to copy prompts without error', async () => {
      mockAuthCurrentUser = null; // Ensure user is logged out

      // Mock the copy function to succeed but return a prompt without incrementing usageCount
      PromptData.copyPromptToClipboard.mockImplementationOnce(async () => {
        // For logged-out users, the function returns success with the original prompt
        return {
          success: true,
          prompt: {
            ...mockPromptForFavoriteTests,
            id: mockPromptId,
            usageCount: 0, // Not incremented for logged-out users
          },
        };
      });

      const promptsListEl = document.getElementById('prompts-list');
      const copyButton = promptsListEl.querySelector(`.copy-prompt[data-id="${mockPromptId}"]`);
      expect(copyButton).not.toBeNull();

      copyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flushPromises();

      expect(PromptData.copyPromptToClipboard).toHaveBeenCalledWith(mockPromptId);

      // Confirm that we still show the success message
      expect(Utils.showConfirmationMessage).toHaveBeenCalledWith('Prompt copied to clipboard!');

      // Importantly, we should NOT show an error message for auth issues
      const errorCalls = Utils.handleError.mock.calls.filter(call =>
        call[0].includes('Failed to process copy action')
      );
      expect(errorCalls.length).toBe(0);
    });
  });
});

/**
 * Tests for the ui.js module
 */

// Mock dependent modules before requiring ui.js
window.PromptFinder = window.PromptFinder || {};
window.PromptFinder.PromptData = {
  loadPrompts: jest.fn(),
  filterPrompts: jest.fn(),
  findPromptById: jest.fn(),
  toggleFavorite: jest.fn(),
  updatePromptRating: jest.fn(),
  copyPromptToClipboard: jest.fn(),
  deletePrompt: jest.fn(),
  addPrompt: jest.fn(), // Added missing mock
};
window.PromptFinder.Utils = {
  handleError: jest.fn(),
  showConfirmationMessage: jest.fn(),
  highlightStars: jest.fn(),
  escapeHTML: jest.fn(str => str), // Simple mock for escapeHTML
};

// Require ui.js after mocks are set up
require('../js/ui'); 
const UI = window.PromptFinder.UI; 

describe('UI Module', () => {
  const samplePrompts = [
    { id: '1', title: 'Test Prompt 1', text: 'Text 1', category: 'Cat 1', tags: ['t1'], isPrivate: false, rating: 4, ratingCount: 1, favorites: 0 },
    { id: '2', title: 'Test Prompt 2', text: 'Text 2', category: 'Cat 2', tags: ['t2'], isPrivate: true, rating: 3, ratingCount: 1, favorites: 1 },
  ];

  // Define references for mock elements that will be created once
  let mockTabAll, mockTabFavs, mockTabPrivate;
  let mockSearchInput, mockFilterButton, mockRatingFilterPanel, mockMinRatingSelect;
  let mockAddPromptButton, mockAddPromptFormEl, mockCancelAddPromptButtonEl;
  let mockPromptsList, mockPromptDetailsSection, mockAddPromptSection;
  let mockControls, mockTabsContainer, mockBottomBar, mockAddPromptBar;
  
  // For prompt details section
  let mockBackToListButton, mockCopyPromptDetailButton, mockEditPromptButton, mockDeletePromptIcon;
  let mockDeleteConfirmation, mockCancelDeleteButton, mockConfirmDeleteButton;
  let mockPromptDetailTitle, mockPromptDetailText, mockPromptDetailCategory, mockPromptDetailTags;
  let mockToggleFavDetail, mockFavIconInDetail;
  let mockAverageRatingValue, mockRatingCount, mockStarRatingContainer;

  // For add/edit form inputs (shared by ID in the actual HTMLs)
  let mockFormPromptTitle, mockFormPromptText, mockFormPromptCategory, mockFormPromptTags, mockFormPromptPrivate;


  const setupMockElement = (id, querySelectorMap = {}) => {
    const element = {
      id: id,
      classList: { 
        toggle: jest.fn(), 
        add: jest.fn(), 
        remove: jest.fn(), 
        contains: jest.fn().mockReturnValue(false) 
      },
      addEventListener: jest.fn(),
      querySelector: jest.fn(selector => querySelectorMap[selector] || null),
      querySelectorAll: jest.fn().mockReturnValue([]),
      innerHTML: '',
      textContent: '',
      value: id === 'search-input' ? '' : (id === 'min-rating' ? '0' : ''), // Default values
      checked: false,
      appendChild: jest.fn(),
      reset: jest.fn(), // For forms
      dataset: {},
      style: {},
      setAttribute: jest.fn(),
      focus: jest.fn(),
      click: jest.fn(),
    };
    return element;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create persistent mock elements
    mockTabAll = setupMockElement('tab-all');
    mockTabFavs = setupMockElement('tab-favs');
    mockTabPrivate = setupMockElement('tab-private');
    mockSearchInput = setupMockElement('search-input');
    mockFilterButton = setupMockElement('filter-button');
    mockRatingFilterPanel = setupMockElement('rating-filter');
    mockMinRatingSelect = setupMockElement('min-rating');
    mockAddPromptButton = setupMockElement('add-prompt-button');
    mockAddPromptFormEl = setupMockElement('add-prompt-form');
    mockCancelAddPromptButtonEl = setupMockElement('cancel-add-prompt'); // Though this might be form specific
    mockPromptsList = setupMockElement('prompts-list');

    // Detail section elements
    mockBackToListButton = setupMockElement('back-to-list-button');
    mockCopyPromptDetailButton = setupMockElement('copy-prompt-button');
    mockEditPromptButton = setupMockElement('edit-prompt-button');
    mockDeletePromptIcon = setupMockElement('delete-prompt-icon');
    mockDeleteConfirmation = setupMockElement('delete-confirmation');
    mockCancelDeleteButton = setupMockElement('cancel-delete-button');
    mockConfirmDeleteButton = setupMockElement('confirm-delete-button');
    mockPromptDetailTitle = setupMockElement('prompt-detail-title');
    mockPromptDetailText = setupMockElement('prompt-detail-text');
    mockPromptDetailCategory = setupMockElement('prompt-detail-category');
    mockPromptDetailTags = setupMockElement('prompt-detail-tags');
    mockFavIconInDetail = setupMockElement('i-in-toggle-fav-detail'); // Mock for icon inside fav button
    mockToggleFavDetail = setupMockElement('toggle-fav-detail', { 'i': mockFavIconInDetail });
    mockAverageRatingValue = setupMockElement('average-rating-value');
    mockRatingCount = setupMockElement('rating-count');
    mockStarRatingContainer = setupMockElement('star-rating');

    mockPromptDetailsSection = setupMockElement('prompt-details-section', {
      '#back-to-list-button': mockBackToListButton,
      '#copy-prompt-button': mockCopyPromptDetailButton,
      '#edit-prompt-button': mockEditPromptButton,
      '#delete-prompt-icon': mockDeletePromptIcon,
      '#delete-confirmation': mockDeleteConfirmation,
      '#cancel-delete-button': mockCancelDeleteButton,
      '#confirm-delete-button': mockConfirmDeleteButton,
      '#prompt-detail-title': mockPromptDetailTitle,
      '#prompt-detail-text': mockPromptDetailText,
      '#prompt-detail-category': mockPromptDetailCategory,
      '#prompt-detail-tags': mockPromptDetailTags,
      '#toggle-fav-detail': mockToggleFavDetail,
      '#average-rating-value': mockAverageRatingValue,
      '#rating-count': mockRatingCount,
      '#star-rating': mockStarRatingContainer,
    });

    mockAddPromptSection = setupMockElement('add-prompt-section');
    
    // Form inputs (can be shared if IDs are consistent across add/edit forms in popup)
    mockFormPromptTitle = setupMockElement('prompt-title');
    mockFormPromptText = setupMockElement('prompt-text');
    mockFormPromptCategory = setupMockElement('prompt-category');
    mockFormPromptTags = setupMockElement('prompt-tags');
    mockFormPromptPrivate = setupMockElement('prompt-private');

    // Mocks for querySelector calls
    mockControls = setupMockElement('.controls');
    mockTabsContainer = setupMockElement('.tabs');
    mockBottomBar = setupMockElement('.bottom-bar');
    mockAddPromptBar = setupMockElement('.add-prompt-bar');

    document.getElementById = jest.fn(id => {
      const elements = {
        'tab-all': mockTabAll,
        'tab-favs': mockTabFavs,
        'tab-private': mockTabPrivate,
        'search-input': mockSearchInput,
        'filter-button': mockFilterButton,
        'rating-filter': mockRatingFilterPanel,
        'min-rating': mockMinRatingSelect,
        'add-prompt-button': mockAddPromptButton,
        'add-prompt-form': mockAddPromptFormEl,
        'cancel-add-prompt': mockCancelAddPromptButtonEl,
        'prompts-list': mockPromptsList,
        'prompt-details-section': mockPromptDetailsSection,
        'add-prompt-section': mockAddPromptSection,
        // Form fields (assuming they are directly accessed by ID in some cases in ui.js)
        'prompt-title': mockFormPromptTitle,
        'prompt-text': mockFormPromptText,
        'prompt-category': mockFormPromptCategory,
        'prompt-tags': mockFormPromptTags,
        'prompt-private': mockFormPromptPrivate,
      };
      return elements[id] || null;
    });

    document.querySelector = jest.fn(selector => {
      const elements = {
        '.controls': mockControls,
        '.tabs': mockTabsContainer,
        '.bottom-bar': mockBottomBar,
        '.add-prompt-bar': mockAddPromptBar,
        // Add specific querySelector mocks if ui.js uses them beyond getElementById
        // For instance, if promptDetailsSection.querySelector is used, it's handled by the mockPromptDetailsSection setup
      };
      return elements[selector] || null;
    });

    document.createElement = jest.fn(tag => {
      const element = setupMockElement(`created-${tag}`);
      return element;
    });

    // Mock global dependencies
    window.PromptFinder.PromptData.loadPrompts.mockResolvedValue([...samplePrompts]);
    window.PromptFinder.PromptData.filterPrompts.mockReturnValue([...samplePrompts]);
    window.PromptFinder.PromptData.findPromptById.mockImplementation(id => 
      Promise.resolve(samplePrompts.find(p => p.id === id) || null)
    );
    window.PromptFinder.PromptData.toggleFavorite.mockImplementation(id => {
      const prompt = samplePrompts.find(p => p.id === id);
      if (prompt) prompt.favorites = prompt.favorites === 1 ? 0 : 1;
      return Promise.resolve(prompt);
    });
    window.PromptFinder.PromptData.updatePromptRating.mockImplementation((id, rating) => {
        const prompt = samplePrompts.find(p => p.id === id);
        if (prompt) { 
            prompt.rating = rating; 
            prompt.ratingCount = (prompt.ratingCount || 0) + 1;
        }
        return Promise.resolve(prompt);
    });
    window.PromptFinder.PromptData.addPrompt.mockImplementation(promptData => {
        const newPrompt = {...promptData, id: Date.now().toString() };
        samplePrompts.push(newPrompt);
        return Promise.resolve(newPrompt);
    });
    window.PromptFinder.PromptData.deletePrompt.mockImplementation(id => {
        const index = samplePrompts.findIndex(p => p.id === id);
        if (index > -1) samplePrompts.splice(index, 1);
        return Promise.resolve(true);
    });
    window.PromptFinder.PromptData.copyPromptToClipboard.mockResolvedValue(true);

    // Call initializeUI to cache the (now persistent) mock elements
    // This also implicitly tests cacheDOMElements and setupEventListeners to some extent
    UI.initializeUI(); 
  });

  describe('initializeUI', () => {
    test('should load prompts and set up UI correctly', async () => {
      // initializeUI is called in beforeEach, so we check its effects here
      expect(window.PromptFinder.PromptData.loadPrompts).toHaveBeenCalled();
      expect(mockTabAll.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockFilterButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function)); // Check if filter button exists now
    });

    test('should handle errors during initialization', async () => {
      window.PromptFinder.PromptData.loadPrompts.mockRejectedValueOnce(new Error('Load error'));
      await UI.initializeUI(); // Call again to test error path
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
        'Error initializing UI', 
        expect.objectContaining({ originalError: new Error('Load error') })
      );
    });
  });

  describe('showTab', () => {
    test('should show the prompt list and filter prompts', () => {
      UI.showTab('all');
      expect(mockPromptsList.classList.remove).toHaveBeenCalledWith('hidden');
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalled();
    });

    test('should update tab state in UI', () => {
      UI.showTab('favs');
      expect(mockTabAll.classList.toggle).toHaveBeenCalledWith('active', false);
      expect(mockTabFavs.classList.toggle).toHaveBeenCalledWith('active', true);
      expect(mockTabPrivate.classList.toggle).toHaveBeenCalledWith('active', false);
    });
    
    test('should apply search filters when showing tab', () => {
      mockSearchInput.value = 'search term';
      UI.showTab('all');
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(
        expect.anything(), // allPrompts array
        expect.objectContaining({ tab: 'all', searchTerm: 'search term', minRating: 0 })
      );
    });

    test('should apply rating filters when showing tab', () => {
      mockMinRatingSelect.value = '3';
      UI.showTab('all');
      expect(window.PromptFinder.PromptData.filterPrompts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tab: 'all', searchTerm: '', minRating: 3 })
      );
    });
  });

  describe('displayPrompts', () => {
    test('should display a list of prompts', () => {
        UI.displayPrompts(samplePrompts);
        // expect(mockPromptsList.innerHTML).not.toBe(''); // This assertion is problematic
        expect(mockPromptsList.appendChild).toHaveBeenCalledTimes(samplePrompts.length);
    });

    test('should show empty state if no prompts', () => {
        UI.displayPrompts([]);
        expect(mockPromptsList.appendChild).toHaveBeenCalled();
        const emptyStateDiv = mockPromptsList.appendChild.mock.calls[0][0];
        expect(emptyStateDiv.classList.add).toHaveBeenCalledWith('empty-state');
    });
  });

  describe('displayPromptDetails', () => {
    test('should display prompt details in the UI', () => {
      const prompt = samplePrompts[0];
      UI.displayPromptDetails(prompt);
      expect(mockPromptDetailsSection.classList.remove).toHaveBeenCalledWith('hidden');
      expect(mockPromptDetailTitle.textContent).toBe(prompt.title);
      expect(mockPromptDetailText.textContent).toBe(prompt.text);
    });

    test('should handle null prompt gracefully', () => {
      UI.displayPromptDetails(null);
      // Check that it doesn't try to show the section or set text content
      expect(mockPromptDetailsSection.classList.remove).not.toHaveBeenCalledWith('hidden');
    });

    test('should update star rating display', () => {
      const prompt = samplePrompts[0];
      UI.displayPromptDetails(prompt);
      expect(mockStarRatingContainer.appendChild).toHaveBeenCalled(); // Checks if stars were added
      expect(mockAverageRatingValue.textContent).toBe(`(${prompt.rating.toFixed(1)})`);
    });
  });

  describe('viewPromptDetails', () => {
    test('should find and display prompt details', async () => {
      const prompt = samplePrompts[0];
      window.PromptFinder.PromptData.findPromptById.mockResolvedValueOnce(prompt);
      await UI.viewPromptDetails(prompt.id);
      expect(mockPromptDetailsSection.classList.remove).toHaveBeenCalledWith('hidden');
      expect(mockPromptDetailTitle.textContent).toBe(prompt.title);
    });

    test('should handle errors if prompt not found', async () => {
      window.PromptFinder.PromptData.findPromptById.mockResolvedValueOnce(null);
      await UI.viewPromptDetails('999');
      expect(window.PromptFinder.Utils.handleError).toHaveBeenCalledWith(
          expect.stringContaining('Error viewing prompt details'), 
          expect.anything()
      );
    });
  });

  describe('section visibility', () => {
    test('showPromptList should show the prompt list section', () => {
      UI.showPromptList();
      expect(mockPromptsList.classList.remove).toHaveBeenCalledWith('hidden');
      expect(mockPromptDetailsSection.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('showPromptDetails should show the prompt details section', () => {
      UI.showPromptDetails(); // Using alias from js/ui.js export
      expect(mockPromptsList.classList.add).toHaveBeenCalledWith('hidden');
      expect(mockPromptDetailsSection.classList.remove).toHaveBeenCalledWith('hidden');
    });

    test('showAddPrompt should show the add prompt section', () => {
      UI.showAddPrompt(); // Using alias from js/ui.js export
      expect(mockAddPromptSection.classList.remove).toHaveBeenCalledWith('hidden');
    });
  });

  // TODO: Add tests for event handlers like handleAddPromptSubmit, handleToggleFavorite, handleRatePrompt etc.
  // These will require more complex setup for event objects and form data.
});

/**
 * Tests for the utils.js module (ESM/v9 compatible)
 */
import { jest } from '@jest/globals';
import * as Utils from '../js/utils.js';

describe('Utility Functions (ESM)', () => {
  describe('chromeStorageGet', () => {
    beforeEach(() => {
      if (
        global.chrome &&
        global.chrome.storage &&
        global.chrome.storage.local &&
        global.chrome.storage.local.get.mockReset
      ) {
        global.chrome.storage.local.get.mockReset();
      }
      if (global.chrome && global.chrome.runtime) {
        global.chrome.runtime.lastError = null;
      }
    });

    test('should resolve with stored data via Promise', async () => {
      const mockData = { testKey: 'testValue' };
      global.chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (typeof callback === 'function') callback(mockData);
        return Promise.resolve(mockData);
      });

      const result = await Utils.chromeStorageGet('testKey');
      expect(result).toEqual(mockData);
      expect(global.chrome.storage.local.get).toHaveBeenCalledWith('testKey', expect.any(Function));
    });

    test('should reject if chrome.runtime.lastError is set (Promise)', async () => {
      const error = { message: 'Storage get error' };
      global.chrome.runtime.lastError = error;
      global.chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback();
      });

      await expect(Utils.chromeStorageGet('testKey')).rejects.toEqual(
        global.chrome.runtime.lastError
      );
    });
  });

  describe('chromeStorageSet', () => {
    beforeEach(() => {
      if (global.chrome.storage.local.set.mockReset) {
        global.chrome.storage.local.set.mockReset();
      }
      global.chrome.runtime.lastError = null;
    });

    test('should resolve when data is set successfully (Promise)', async () => {
      const items = { testKey: 'testValue' };
      global.chrome.storage.local.set.mockImplementation((itemsToSet, callback) => {
        if (typeof callback === 'function') callback();
        return Promise.resolve();
      });
      await expect(Utils.chromeStorageSet(items)).resolves.toBeUndefined();
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(items, expect.any(Function));
    });

    test('should reject if chrome.runtime.lastError is set during set (Promise)', async () => {
      global.chrome.runtime.lastError = { message: 'Storage set error' };
      global.chrome.storage.local.set.mockImplementation((items, callback) => {
        callback();
      });
      await expect(Utils.chromeStorageSet({ testKey: 'value' })).rejects.toEqual(
        global.chrome.runtime.lastError
      );
    });
  });

  describe('Error Handling & Confirmation Messages', () => {
    let mockErrorElement;
    let mockConfirmationElement;
    let originalGetElementById;

    beforeEach(() => {
      console.error = jest.fn();
      console.warn = jest.fn();
      console.info = jest.fn();

      mockErrorElement = {
        textContent: '',
        innerHTML: '',
        classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
        style: {},
        dataset: {},
        querySelector: jest.fn(),
      };
      mockConfirmationElement = JSON.parse(JSON.stringify(mockErrorElement));
      mockConfirmationElement.classList = {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
      };
      mockConfirmationElement.querySelector = jest.fn();

      originalGetElementById = document.getElementById;
      document.getElementById = jest.fn(id => {
        if (id === 'error-message') return mockErrorElement;
        if (id === 'confirmation-message') return mockConfirmationElement;
        return {
          classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
          style: {},
          textContent: '',
          innerHTML: '',
          dataset: {},
          querySelector: jest.fn(),
        };
      });
      jest.useFakeTimers();
    });

    afterEach(() => {
      document.getElementById = originalGetElementById;
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    describe('handleError', () => {
      test('should log to console with correct type', () => {
        Utils.handleError('Test error', { userVisible: false, type: 'error' });
        expect(console.error).toHaveBeenCalledWith('Test error');
        Utils.handleError('Warning test', { type: 'warning', userVisible: false });
        expect(console.warn).toHaveBeenCalledWith('Warning test');
        Utils.handleError('Info test', { type: 'info', userVisible: false });
        expect(console.info).toHaveBeenCalledWith('Info test');
      });

      test('should update DOM and set timeout if userVisible and element exists', () => {
        Utils.handleError('Visible error', {
          userVisible: true,
          specificErrorElement: mockErrorElement,
        });
        expect(mockErrorElement.textContent).toBe('Visible error');
        expect(mockErrorElement.classList.remove).toHaveBeenCalledWith('hidden');
        jest.runAllTimers();
        expect(mockErrorElement.classList.add).toHaveBeenCalledWith('hidden');
      });

      test('should handle HTML message and link click', () => {
        const mockAction = jest.fn();
        const linkId = 'test-link';
        const messageHtml = `Click <a href="#" id="${linkId}">here</a>`;
        const mockLinkElement = { addEventListener: jest.fn() };
        mockErrorElement.querySelector = jest.fn(selector =>
          selector === `#${linkId}` ? mockLinkElement : null
        );

        Utils.handleError(messageHtml, {
          userVisible: true,
          specificErrorElement: mockErrorElement,
          isHtml: true,
          linkId: linkId,
          onClickAction: mockAction,
          timeout: 0,
        });

        expect(mockErrorElement.innerHTML).toBe(messageHtml);
        expect(mockErrorElement.querySelector).toHaveBeenCalledWith(`#${linkId}`);
        expect(mockLinkElement.addEventListener).toHaveBeenCalledWith(
          'click',
          expect.any(Function)
        );

        const clickListener = mockLinkElement.addEventListener.mock.calls[0][1];
        const mockEvent = { preventDefault: jest.fn() };
        clickListener(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockAction).toHaveBeenCalled();
        expect(mockErrorElement.classList.add).toHaveBeenCalledWith('hidden');
      });
    });

    describe('showConfirmationMessage', () => {
      test('should display confirmation using handleError logic and hide after timeout', () => {
        Utils.showConfirmationMessage('Confirmed!', {
          specificErrorElement: mockConfirmationElement,
          timeout: 2000,
        });
        expect(mockConfirmationElement.textContent).toBe('Confirmed!');
        expect(mockConfirmationElement.classList.remove).toHaveBeenCalledWith('hidden');
        expect(mockConfirmationElement.style.backgroundColor).toBe('#d4edda');

        jest.runAllTimers();
        expect(mockConfirmationElement.classList.add).toHaveBeenCalledWith('hidden');
      });
    });
  });

  describe('highlightStars', () => {
    test('should add filled class to correct number of stars', () => {
      const mockStarElements = Array(5)
        .fill(null)
        .map(() => ({
          classList: { add: jest.fn(), remove: jest.fn() },
          querySelector: jest.fn(() => ({ className: '' })),
          setAttribute: jest.fn(),
        }));

      const starContainer = {
        querySelectorAll: jest.fn(() => mockStarElements),
      };

      Utils.highlightStars(3, starContainer);

      expect(mockStarElements[0].classList.add).toHaveBeenCalledWith('filled');
      expect(mockStarElements[1].classList.add).toHaveBeenCalledWith('filled');
      expect(mockStarElements[2].classList.add).toHaveBeenCalledWith('filled');
      expect(mockStarElements[3].classList.remove).toHaveBeenCalledWith('filled');
      expect(mockStarElements[4].classList.remove).toHaveBeenCalledWith('filled');
      mockStarElements.forEach(star => expect(star.querySelector).toHaveBeenCalledWith('i'));
    });
  });

  describe('escapeHTML', () => {
    test('should escape special HTML characters', () => {
      expect(Utils.escapeHTML('<div class="test">&</div>')).toBe(
        '&lt;div class=&quot;test&quot;&gt;&amp;&lt;&#x2F;div&gt;'
      );
    });
    test('should return empty string for non-string input', () => {
      expect(Utils.escapeHTML(null)).toBe('');
      expect(Utils.escapeHTML(undefined)).toBe('');
      expect(Utils.escapeHTML(123)).toBe('');
    });
  });
});

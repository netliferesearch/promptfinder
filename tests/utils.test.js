/**
 * Tests for the utils.js module
 */

window.PromptFinder = window.PromptFinder || {};
window.PromptFinder.Utils = {}; // Initialize before require

require('../js/utils');
const Utils = window.PromptFinder.Utils;

describe('Utility Functions', () => {
  describe('chromeStorageGet', () => {
    beforeEach(() => {
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        global.chrome.storage.local.get.mockReset();
      }
      if (global.chrome && global.chrome.runtime) {
        global.chrome.runtime.lastError = null;
      }
    });

    test('should resolve with stored data', async () => {
      const mockData = { testKey: 'testValue' };
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        global.chrome.storage.local.get.mockImplementation((keys, callback) => callback(mockData));
      }
      const result = await Utils.chromeStorageGet('testKey');
      expect(result).toEqual(mockData);
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        expect(global.chrome.storage.local.get).toHaveBeenCalledWith(
          'testKey',
          expect.any(Function)
        );
      }
    });

    test('should reject if chrome.runtime.lastError is set', async () => {
      const error = new Error('Storage get error');
      if (global.chrome && global.chrome.runtime) global.chrome.runtime.lastError = error;
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        global.chrome.storage.local.get.mockImplementation((keys, callback) => callback({}));
      }
      await expect(Utils.chromeStorageGet('testKey')).rejects.toThrow('Storage get error');
    });
  });

  describe('chromeStorageSet', () => {
    beforeEach(() => {
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        global.chrome.storage.local.set.mockReset();
      }
      if (global.chrome && global.chrome.runtime) {
        global.chrome.runtime.lastError = null;
      }
    });

    test('should resolve when data is set successfully', async () => {
      const items = { testKey: 'testValue' };
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        global.chrome.storage.local.set.mockImplementation((itemsToSet, callback) => callback());
      }
      await Utils.chromeStorageSet(items);
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        expect(global.chrome.storage.local.set).toHaveBeenCalledWith(items, expect.any(Function));
      }
    });

    test('should reject if chrome.runtime.lastError is set during set', async () => {
      const error = new Error('Storage set error');
      if (global.chrome && global.chrome.runtime) global.chrome.runtime.lastError = error;
      if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
        global.chrome.storage.local.set.mockImplementation((items, callback) => callback());
      }
      await expect(Utils.chromeStorageSet({ testKey: 'value' })).rejects.toThrow(
        'Storage set error'
      );
    });
  });

  describe('Error Handling', () => {
    let mockErrorElement;
    let mockConfirmationElement;

    beforeEach(() => {
      console.error = jest.fn();
      console.warn = jest.fn();
      console.info = jest.fn();

      mockErrorElement = {
        textContent: '',
        classList: { add: jest.fn(), remove: jest.fn() },
        style: {},
        innerHTML: '',
      };
      mockConfirmationElement = { ...mockErrorElement };

      document.getElementById = jest.fn(id => {
        if (id === 'error-message') return mockErrorElement;
        if (id === 'confirmation-message') return mockConfirmationElement;
        return {
          classList: { add: jest.fn(), remove: jest.fn() },
          style: {},
          textContent: '',
          dataset: {},
        };
      });
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    describe('handleError', () => {
      test('should log to console', () => {
        Utils.handleError('Test error', { userVisible: false });
        expect(console.error).toHaveBeenCalledWith('Test error');
      });
      test('should log with correct level', () => {
        Utils.handleError('Warning test', { type: 'warning', userVisible: false });
        expect(console.warn).toHaveBeenCalledWith('Warning test');
        Utils.handleError('Info test', { type: 'info', userVisible: false });
        expect(console.info).toHaveBeenCalledWith('Info test');
      });
      test('should log original error if provided', () => {
        const originalErr = new Error('Original');
        Utils.handleError('Test error with original', {
          originalError: originalErr,
          userVisible: false,
        });
        expect(console.error).toHaveBeenCalledWith('Test error with original', originalErr);
      });
      test('should update DOM if userVisible is true and element exists', () => {
        Utils.handleError('Visible error', { userVisible: true });
        expect(mockErrorElement.textContent).toBe('Visible error');
        expect(mockErrorElement.classList.remove).toHaveBeenCalledWith('hidden');
        jest.runAllTimers();
        expect(mockErrorElement.classList.add).toHaveBeenCalledWith('hidden');
      });
      test('should apply correct styling based on error type', () => {
        Utils.handleError('Styled error', { userVisible: true, type: 'error' });
        expect(mockErrorElement.style.backgroundColor).toBe('#f8d7da');
        Utils.handleError('Styled warning', { userVisible: true, type: 'warning' });
        expect(mockErrorElement.style.backgroundColor).toBe('#fff3cd');
      });
    });

    describe('displayAuthError', () => {
      test('should display message in provided element', () => {
        const specificErrorEl = {
          textContent: '',
          classList: { remove: jest.fn(), add: jest.fn() },
        };
        Utils.displayAuthError('Auth fail', specificErrorEl);
        expect(specificErrorEl.textContent).toBe('Auth fail');
        expect(specificErrorEl.classList.remove).toHaveBeenCalledWith('hidden');
      });
      test('should fallback to handleError if element not provided', () => {
        Utils.displayAuthError('Auth fail no element', null);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Auth fail no element'));
      });
    });

    describe('showConfirmationMessage', () => {
      test('should display confirmation and hide after timeout', () => {
        Utils.showConfirmationMessage('Confirmed!');
        expect(mockConfirmationElement.textContent).toBe('Confirmed!');
        expect(mockConfirmationElement.classList.remove).toHaveBeenCalledWith('hidden');
        jest.runAllTimers();
        expect(mockConfirmationElement.classList.add).toHaveBeenCalledWith('hidden');
      });
    });
  });

  describe('highlightStars', () => {
    test('should add filled class to correct number of stars', () => {
      const mockIcon = () => ({ className: '' });
      const mockStarElement = () => ({
        classList: { add: jest.fn(), remove: jest.fn() },
        querySelector: jest.fn().mockImplementation(selector => {
          if (selector === 'i') return mockIcon();
          return null;
        }),
        setAttribute: jest.fn(),
      });

      const starsArray = [
        mockStarElement(),
        mockStarElement(),
        mockStarElement(),
        mockStarElement(),
        mockStarElement(),
      ];
      const starContainer = {
        querySelectorAll: jest.fn(selector => {
          if (selector === '.star') return starsArray;
          return [];
        }),
      };

      Utils.highlightStars(3, starContainer);

      expect(starsArray[0].classList.add).toHaveBeenCalledWith('filled');
      expect(starsArray[1].classList.add).toHaveBeenCalledWith('filled');
      expect(starsArray[2].classList.add).toHaveBeenCalledWith('filled');
      expect(starsArray[3].classList.remove).toHaveBeenCalledWith('filled');
      expect(starsArray[4].classList.remove).toHaveBeenCalledWith('filled');
      // Also check if querySelector was called on each star
      starsArray.forEach(star => expect(star.querySelector).toHaveBeenCalledWith('i'));
    });
  });
});

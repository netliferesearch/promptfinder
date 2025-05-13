/**
 * Tests for the utils.js module
 */

window.PromptFinder = window.PromptFinder || {};

window.PromptFinder.Utils = {};

require('../js/utils');

const Utils = window.PromptFinder.Utils;

describe('Chrome Storage Helpers', () => {
  beforeEach(() => {
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.runtime.lastError = null;
  });

  test('chromeStorageGet should return data on success', async () => {
    const mockData = { prompts: [{ id: '1', title: 'Test' }] };
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(mockData);
    });

    const result = await Utils.chromeStorageGet('prompts');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('prompts', expect.any(Function));
    expect(result).toEqual(mockData);
  });

  test('chromeStorageGet should reject on error', async () => {
    chrome.runtime.lastError = { message: 'Test error' };
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    await expect(Utils.chromeStorageGet('prompts')).rejects.toEqual({ message: 'Test error' });
  });

  test('chromeStorageSet should resolve on success', async () => {
    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback();
    });

    await expect(Utils.chromeStorageSet({ prompts: [] })).resolves.toBeUndefined();
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ prompts: [] }, expect.any(Function));
  });

  test('chromeStorageSet should reject on error', async () => {
    chrome.runtime.lastError = { message: 'Test error' };
    chrome.storage.local.set.mockImplementation((data, callback) => {
      callback();
    });

    await expect(Utils.chromeStorageSet({ prompts: [] })).rejects.toEqual({
      message: 'Test error',
    });
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();

    document.getElementById.mockImplementation(id => {
      if (id === 'error-message') {
        return {
          textContent: '',
          classList: { add: jest.fn(), remove: jest.fn() },
          style: {},
        };
      }
      return null;
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('handleError should log to console', () => {
    Utils.handleError('Test error');
    expect(console.error).toHaveBeenCalledWith('Test error');
  });

  test('handleError should log with correct level', () => {
    Utils.handleError('Test warning', { type: 'warning' });
    expect(console.warn).toHaveBeenCalledWith('Test warning');

    Utils.handleError('Test info', { type: 'info' });
    expect(console.info).toHaveBeenCalledWith('Test info');
  });

  test('handleError should log original error if provided', () => {
    const originalError = new Error('Original');
    Utils.handleError('Test with original', { originalError });
    expect(console.error).toHaveBeenCalledWith('Test with original', originalError);
  });

  test('handleError should update DOM if userVisible is true', () => {
    const mockErrorElement = {
      textContent: '',
      classList: { add: jest.fn(), remove: jest.fn() },
      style: {},
    };

    Utils.handleError('Visible error', {
      userVisible: true,
      errorElement: mockErrorElement,
    });

    expect(mockErrorElement.textContent).toBe('Visible error');
    expect(mockErrorElement.classList.remove).toHaveBeenCalledWith('hidden');

    jest.advanceTimersByTime(5000);
    expect(mockErrorElement.classList.add).toHaveBeenCalledWith('hidden');
  });

  test('handleError should apply correct styling based on error type', () => {
    const mockErrorElement = {
      textContent: '',
      classList: { add: jest.fn(), remove: jest.fn() },
      style: {},
    };

    Utils.handleError('Warning message', {
      userVisible: true,
      type: 'warning',
      errorElement: mockErrorElement,
    });

    expect(mockErrorElement.style.backgroundColor).toBe('#fff3cd');
    expect(mockErrorElement.style.color).toBe('#856404');
  });
});

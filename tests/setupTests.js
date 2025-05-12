/**
 * Jest setup file for PromptFinder extension tests
 */

// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};

// Set up fetch API mock
global.fetch = jest.fn();

// Mock clipboard API
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: jest.fn().mockImplementation(() => Promise.resolve())
    }
  });
}

// Mock DOM methods frequently used
document.getElementById = jest.fn();
document.querySelector = jest.fn();
document.querySelectorAll = jest.fn().mockReturnValue([]);
document.createElement = jest.fn().mockImplementation(tag => {
  const element = {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn()
    },
    style: {},
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    removeAttribute: jest.fn()
  };
  
  if (tag.toLowerCase() === 'div') {
    element.innerHTML = '';
  }
  
  return element;
});

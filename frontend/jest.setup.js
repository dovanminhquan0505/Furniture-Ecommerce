// Mock fetch globally
global.fetch = jest.fn();

// Polyfill for tests
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Increase default timeout for all tests
jest.setTimeout(30000);

// Mock browser APIs that aren't available in Jest
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Suppress specific React warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (
      args[0].includes('Warning: ReactDOM') ||
      args[0].includes('Warning: An update') ||
      args[0].includes('Warning: Failed prop type') ||
      args[0].includes('Warning: React.createElement')
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};
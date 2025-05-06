// Increase timeout for Firestore operations
jest.setTimeout(30000);

// Suppress specific console messages during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Ignore Firebase emulator warning messages
  if (
    typeof args[0] === 'string' && 
    (
      args[0].includes('FIREBASE') || 
      args[0].includes('emulator') ||
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Ignore certain warning messages
  if (
    typeof args[0] === 'string' && 
    (
      args[0].includes('Warning: React') || 
      args[0].includes('FIRESTORE')
    )
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Add global cleanup
afterAll(async () => {
  // Make sure we give time for any hanging connections to close
  await new Promise(resolve => setTimeout(resolve, 500));
});
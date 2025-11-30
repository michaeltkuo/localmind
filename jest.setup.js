// Mock window.electron
Object.defineProperty(window, 'electron', {
  value: {
    store: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

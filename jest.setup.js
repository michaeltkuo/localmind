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
const localStorageData = {};
const localStorageMock = {
  getItem: jest.fn((key) => (key in localStorageData ? localStorageData[key] : null)),
  setItem: jest.fn((key, value) => {
    localStorageData[key] = String(value);
  }),
  removeItem: jest.fn((key) => {
    delete localStorageData[key];
  }),
  clear: jest.fn(() => {
    Object.keys(localStorageData).forEach((key) => {
      delete localStorageData[key];
    });
  }),
};
global.localStorage = localStorageMock;

// Polyfill TextEncoder/TextDecoder for react-dom/server in Jest
const { TextEncoder, TextDecoder } = require('util');

Object.defineProperty(global, 'TextEncoder', {
  value: TextEncoder,
  writable: true,
});

Object.defineProperty(global, 'TextDecoder', {
  value: TextDecoder,
  writable: true,
});

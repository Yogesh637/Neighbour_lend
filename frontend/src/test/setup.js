import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Mock matchMedia or other window utilities if needed
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock google accounts API
window.google = {
  accounts: {
    id: {
      initialize: vi.fn(),
      renderButton: vi.fn(),
    }
  }
};

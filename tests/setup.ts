/**
 * Jest setup file
 * Configures test environment for browser extension testing
 */

// Mock browser APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    lastError: null,
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

// Mock Safari APIs
global.safari = {
  application: {
    activeBrowserWindow: {
      activeTab: {
        page: {
          dispatchMessage: jest.fn(),
        },
      },
    },
    addEventListener: jest.fn(),
  },
  extension: {
    settings: {
      getItem: jest.fn(),
      setItem: jest.fn(),
    },
  },
  self: {
    tab: {
      dispatchMessage: jest.fn(),
    },
    addEventListener: jest.fn(),
  },
};

// Mock browser APIs for Firefox
global.browser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    lastError: null,
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
};

// Mock DOM APIs
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com',
    hostname: 'example.com',
  },
  writable: true,
});

Object.defineProperty(document, 'title', {
  value: 'Test Page',
  writable: true,
});

Object.defineProperty(document, 'readyState', {
  value: 'complete',
  writable: true,
});

// Mock URL constructor
global.URL = class URL {
  constructor(url) {
    this.href = url;
    this.hostname = new URL(url).hostname;
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

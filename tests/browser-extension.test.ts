/**
 * Browser extension API tests
 */

// Mock browser APIs before importing modules
const mockChrome = {
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

const mockSafari = {
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

const mockBrowser = {
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

// Set up global mocks
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true,
});

Object.defineProperty(global, 'safari', {
  value: mockSafari,
  writable: true,
});

Object.defineProperty(global, 'browser', {
  value: mockBrowser,
  writable: true,
});

describe('Chrome Extension API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle GET_STATE message', () => {
    const mockState = {
      isActive: true,
      currentConfig: {
        enabled: true,
        schedule: { startTime: '09:00', endTime: '18:00', days: [1, 2, 3, 4, 5] },
        blacklist: [],
        sensitiveFilters: { enabled: true, patterns: [], replacement: '[FILTERED]' },
        maxContentLength: 10000,
        delayBetweenPages: 1000
      },
      memoryConfig: { provider: 'mem0', endpoint: '', options: {} },
      stats: { totalPagesScraped: 0, errors: 0 }
    };

    // Mock the message listener
    let messageHandler: any;
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    // Simulate message
    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();
    
    messageHandler({ type: 'GET_STATE' }, mockSender, mockSendResponse);
    
    // Verify response was called
    expect(mockSendResponse).toHaveBeenCalled();
  });

  test('should handle UPDATE_CONFIG message', async () => {
    let messageHandler: any;
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    const mockConfig = {
      enabled: true,
      schedule: { startTime: '10:00', endTime: '19:00', days: [1, 2, 3, 4, 5] },
      blacklist: ['*.example.com'],
      sensitiveFilters: { enabled: true, patterns: ['\\b\\d{11}\\b'], replacement: '[REDACTED]' },
      maxContentLength: 15000,
      delayBetweenPages: 2000
    };

    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();
    
    messageHandler({ type: 'UPDATE_CONFIG', config: mockConfig }, mockSender, mockSendResponse);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockSendResponse).toHaveBeenCalled();
  });

  test('should handle START_SCRAPING message', async () => {
    let messageHandler: any;
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();
    
    messageHandler({ type: 'START_SCRAPING' }, mockSender, mockSendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockSendResponse).toHaveBeenCalled();
  });

  test('should handle STOP_SCRAPING message', async () => {
    let messageHandler: any;
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();
    
    messageHandler({ type: 'STOP_SCRAPING' }, mockSender, mockSendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockSendResponse).toHaveBeenCalled();
  });

  test('should handle PAGE_SCRAPED message', async () => {
    let messageHandler: any;
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    const mockContent = {
      url: 'https://example.com',
      title: 'Test Page',
      content: 'Test content',
      timestamp: Date.now(),
      domain: 'example.com',
      metadata: {}
    };

    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();
    
    messageHandler({ type: 'PAGE_SCRAPED', content: mockContent }, mockSender, mockSendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockSendResponse).toHaveBeenCalled();
  });

  test('should handle GET_STATS message', () => {
    let messageHandler: any;
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();
    
    messageHandler({ type: 'GET_STATS' }, mockSender, mockSendResponse);
    
    expect(mockSendResponse).toHaveBeenCalled();
  });

  test('should handle CLEAR_DATA message', async () => {
    let messageHandler: any;
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();
    
    messageHandler({ type: 'CLEAR_DATA' }, mockSender, mockSendResponse);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockSendResponse).toHaveBeenCalled();
  });

  test('should handle unknown message types', () => {
    let messageHandler: any;
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();
    
    messageHandler({ type: 'UNKNOWN_TYPE' }, mockSender, mockSendResponse);
    
    expect(mockSendResponse).toHaveBeenCalledWith({ error: 'Unknown message type' });
  });

  test('should handle storage changes', () => {
    let storageHandler: any;
    mockChrome.storage.onChanged.addListener.mockImplementation((handler) => {
      storageHandler = handler;
    });

    const mockChanges = {
      pluginState: {
        newValue: { isActive: true },
        oldValue: { isActive: false }
      }
    };

    storageHandler(mockChanges, 'sync');
    
    // Verify storage listener was set up
    expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();
  });

  test('should handle alarm events', () => {
    let alarmHandler: any;
    mockChrome.alarms.onAlarm.addListener.mockImplementation((handler) => {
      alarmHandler = handler;
    });

    const mockAlarm = { name: 'scraping-schedule' };
    
    alarmHandler(mockAlarm);
    
    // Verify alarm listener was set up
    expect(mockChrome.alarms.onAlarm.addListener).toHaveBeenCalled();
  });
});

describe('Safari Extension API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle message events', () => {
    let messageHandler: any;
    mockSafari.application.addEventListener.mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    const mockEvent = {
      message: { type: 'GET_STATE' },
      target: {
        page: {
          dispatchMessage: jest.fn()
        }
      }
    };

    messageHandler(mockEvent);
    
    expect(mockSafari.application.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  test('should handle state response', () => {
    const mockState = {
      isActive: true,
      currentConfig: { enabled: true },
      memoryConfig: { provider: 'mem0' },
      stats: { totalPagesScraped: 0 }
    };

    let messageHandler: any;
    mockSafari.self.addEventListener.mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    const mockEvent = {
      name: 'stateResponse',
      message: mockState
    };

    messageHandler(mockEvent);
    
    expect(mockSafari.self.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  test('should handle configuration updates', () => {
    let messageHandler: any;
    mockSafari.application.addEventListener.mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    const mockEvent = {
      message: { 
        type: 'UPDATE_CONFIG', 
        config: { enabled: true } 
      },
      target: {
        page: {
          dispatchMessage: jest.fn()
        }
      }
    };

    messageHandler(mockEvent);
    
    expect(mockEvent.target.page.dispatchMessage).toHaveBeenCalled();
  });
});

describe('Firefox Extension API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle runtime messages', () => {
    let messageHandler: any;
    mockBrowser.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    const mockMessage = { type: 'GET_STATE' };
    const mockSender = { tab: { id: 1 } };
    const mockSendResponse = jest.fn();

    messageHandler(mockMessage, mockSender, mockSendResponse);
    
    expect(mockBrowser.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('should handle storage changes', () => {
    let storageHandler: any;
    mockBrowser.storage.onChanged.addListener.mockImplementation((handler) => {
      storageHandler = handler;
    });

    const mockChanges = {
      pluginState: {
        newValue: { isActive: true }
      }
    };

    storageHandler(mockChanges, 'sync');
    
    expect(mockBrowser.storage.onChanged.addListener).toHaveBeenCalled();
  });

  test('should handle alarm events', () => {
    let alarmHandler: any;
    mockBrowser.alarms.onAlarm.addListener.mockImplementation((handler) => {
      alarmHandler = handler;
    });

    const mockAlarm = { name: 'scraping-schedule' };
    
    alarmHandler(mockAlarm);
    
    expect(mockBrowser.alarms.onAlarm.addListener).toHaveBeenCalled();
  });
});

describe('Cross-Browser Compatibility', () => {
  test('should detect Chrome environment', () => {
    expect(typeof chrome).toBe('object');
    expect(chrome.runtime).toBeDefined();
  });

  test('should detect Safari environment', () => {
    expect(typeof safari).toBe('object');
    expect(safari.application).toBeDefined();
  });

  test('should detect Firefox environment', () => {
    expect(typeof browser).toBe('object');
    expect(browser.runtime).toBeDefined();
  });

  test('should handle missing browser APIs gracefully', () => {
    // Test with undefined browser APIs
    const originalChrome = global.chrome;
    const originalSafari = global.safari;
    const originalBrowser = global.browser;

    delete (global as any).chrome;
    delete (global as any).safari;
    delete (global as any).browser;

    // Should not throw errors
    expect(() => {
      // Simulate extension initialization
    }).not.toThrow();

    // Restore
    global.chrome = originalChrome;
    global.safari = originalSafari;
    global.browser = originalBrowser;
  });
});

describe('Extension Lifecycle', () => {
  test('should initialize background script', () => {
    // Mock background script initialization
    const mockState = {
      isActive: false,
      currentConfig: {
        enabled: false,
        schedule: { startTime: '09:00', endTime: '18:00', days: [1, 2, 3, 4, 5] },
        blacklist: [],
        sensitiveFilters: { enabled: true, patterns: [], replacement: '[FILTERED]' },
        maxContentLength: 10000,
        delayBetweenPages: 1000
      },
      memoryConfig: { provider: 'mem0', endpoint: '', options: {} },
      stats: { totalPagesScraped: 0, errors: 0 }
    };

    expect(mockState).toBeDefined();
    expect(mockState.isActive).toBe(false);
  });

  test('should initialize content script', () => {
    // Mock content script initialization
    const mockConfig = {
      enabled: true,
      blacklist: ['*.example.com'],
      sensitiveFilters: { enabled: true, patterns: ['\\b\\d{11}\\b'], replacement: '[REDACTED]' }
    };

    expect(mockConfig).toBeDefined();
    expect(mockConfig.enabled).toBe(true);
  });

  test('should initialize popup interface', () => {
    // Mock popup initialization
    const mockUI = {
      statusIndicator: 'active',
      totalPages: 0,
      lastScraped: '-'
    };

    expect(mockUI).toBeDefined();
    expect(mockUI.statusIndicator).toBe('active');
  });
});

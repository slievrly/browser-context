# Development Guide

This guide provides comprehensive information for developers who want to extend, modify, or contribute to the Browser Context Plugin.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Architecture](#project-architecture)
3. [Building and Testing](#building-and-testing)
4. [Adding New Features](#adding-new-features)
5. [Browser Extension Development](#browser-extension-development)
6. [Memory Storage Adapters](#memory-storage-adapters)
7. [Testing Strategies](#testing-strategies)
8. [Debugging](#debugging)
9. [Performance Optimization](#performance-optimization)
10. [Deployment](#deployment)

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher (comes with Node.js)
- **Git**: For version control
- **Code Editor**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Jest

### Initial Setup

1. **Clone the repository**:
```bash
git clone https://github.com/your-username/browser-context.git
cd browser-context
```

2. **Install dependencies**:
```bash
npm install
```

3. **Install development dependencies**:
```bash
npm install --save-dev
```

4. **Verify installation**:
```bash
npm test
npm run lint
npm run build
```

### Development Scripts

```bash
# Development with watch mode
npm run dev

# Build all extensions
npm run build

# Build specific extension
npm run build:chrome
npm run build:edge
npm run build:safari
npm run build:firefox

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting and formatting
npm run lint
npm run format

# Clean build artifacts
npm run clean
```

## Project Architecture

### Directory Structure

```
browser-context/
├── chrome/                    # Chrome extension
│   ├── manifest.json         # Extension manifest
│   ├── background.ts         # Service worker
│   ├── content-script.ts     # Content script
│   ├── popup.html           # Popup interface
│   ├── popup.ts             # Popup logic
│   └── icons/               # Extension icons
├── edge/                     # Edge extension (similar to Chrome)
├── safari/                   # Safari extension
│   └── Browser-Context-Plugin.safariextension/
│       ├── Info.plist       # Safari extension manifest
│       ├── background.js    # Background script
│       ├── content-script.js # Content script
│       ├── popup.html       # Popup interface
│       └── popup.js         # Popup logic
├── firefox/                  # Firefox extension
│   ├── manifest.json        # WebExtensions manifest
│   └── [similar structure to Chrome]
├── shared/                   # Shared code
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility classes
│   └── memory-adapters/     # Storage adapters
├── tests/                    # Test files
├── docs/                     # Documentation
├── scripts/                  # Build scripts
└── webpack.*.config.js      # Webpack configurations
```

### Core Components

#### 1. Content Scraper (`shared/utils/content-scraper.ts`)
- Extracts content from web pages
- Handles different content selectors
- Manages metadata extraction
- Provides HTML parsing utilities

#### 2. URL Matcher (`shared/utils/url-matcher.ts`)
- Implements blacklist filtering
- Supports various URL patterns
- Handles wildcard matching
- Validates pattern formats

#### 3. Sensitive Filter (`shared/utils/sensitive-filter.ts`)
- Filters sensitive information
- Supports regex patterns
- Provides built-in patterns
- Handles replacement logic

#### 4. Scheduler (`shared/utils/scheduler.ts`)
- Manages time-based scheduling
- Handles cross-day ranges
- Provides status information
- Supports multiple day patterns

#### 5. Memory Adapters (`shared/memory-adapters/`)
- Abstract storage interface
- Provider-specific implementations
- Factory pattern for creation
- Error handling and validation

### Browser-Specific Implementation

#### Chrome/Edge Extensions
- **Manifest V3** compliance
- **Service Workers** for background processing
- **Content Scripts** for page interaction
- **Chrome Extension API** for communication

#### Safari Extensions
- **Safari Extension API** for communication
- **Info.plist** configuration
- **JavaScript** implementation
- **Safari-specific** limitations

#### Firefox Extensions
- **WebExtensions API** compatibility
- **Manifest V2** format
- **Background scripts** for processing
- **Firefox-specific** features

## Building and Testing

### Build Process

1. **TypeScript Compilation**: All `.ts` files are compiled to JavaScript
2. **Webpack Bundling**: Code is bundled for each browser
3. **Asset Copying**: Static files are copied to dist folders
4. **Optimization**: Code is minified for production

### Build Configuration

Each browser has its own Webpack configuration:

```javascript
// webpack.chrome.config.js
module.exports = {
  entry: {
    'background': './chrome/background.ts',
    'content-script': './chrome/content-script.ts',
    'popup': './chrome/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/chrome'),
    filename: '[name].js'
  },
  // ... other configuration
};
```

### Testing Framework

- **Jest**: Test runner and assertion library
- **jsdom**: DOM simulation for browser APIs
- **Mocks**: Comprehensive mocking for browser APIs
- **Coverage**: Code coverage reporting

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/content-scraper.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="URL Matcher"
```

## Adding New Features

### 1. Planning

Before adding a new feature:

1. **Define the requirements** clearly
2. **Consider cross-browser compatibility**
3. **Plan the API design**
4. **Identify shared vs browser-specific code**
5. **Design test cases**

### 2. Implementation Steps

#### Step 1: Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

#### Step 2: Implement Core Logic
- Add shared utilities in `shared/utils/`
- Create type definitions in `shared/types/`
- Implement browser-specific code in respective folders

#### Step 3: Add Tests
- Create unit tests for utilities
- Add integration tests for browser APIs
- Include edge case testing

#### Step 4: Update Documentation
- Update API documentation
- Add usage examples
- Update user guide if needed

#### Step 5: Test in All Browsers
- Build and test in Chrome
- Build and test in Edge
- Build and test in Safari
- Build and test in Firefox

### 3. Example: Adding a New Content Selector

```typescript
// shared/utils/content-scraper.ts
export class ContentScraper {
  private extractMainContent(): string {
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '#content',
      '.container',
      '.your-new-selector' // Add new selector
    ];
    
    // ... existing implementation
  }
}
```

### 4. Example: Adding a New Memory Adapter

```typescript
// shared/memory-adapters/new-adapter.ts
export class NewAdapter extends BaseMemoryAdapter {
  constructor(config: NewAdapterConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // Implementation
  }

  async save(content: WebPageContent): Promise<void> {
    // Implementation
  }

  // ... other methods
}

// shared/memory-adapters/adapter-factory.ts
export class MemoryAdapterFactory {
  static createAdapter(config: MemoryConfig): BaseMemoryAdapter {
    switch (config.provider) {
      // ... existing cases
      case 'new_provider':
        return new NewAdapter(config);
      // ...
    }
  }
}
```

## Browser Extension Development

### Chrome Extension Development

#### Manifest Configuration
```json
{
  "manifest_version": 3,
  "name": "Browser Context Plugin",
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "scripting",
    "alarms",
    "background"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js"
  }
}
```

#### Service Worker (Background Script)
```typescript
// chrome/background.ts
class ChromeBackgroundScript {
  private async init(): Promise<void> {
    // Initialize background script
    await this.loadState();
    this.setupMessageListener();
    this.setupStorageListener();
    this.setupAlarmListener();
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Handle messages from content scripts and popup
    });
  }
}
```

#### Content Script
```typescript
// chrome/content-script.ts
class ChromeContentScript {
  private async init(): Promise<void> {
    await this.loadConfig();
    this.setupGlobalAPI();
    this.setupMessageListener();
    this.setupPageChangeListener();
  }

  private async scrapePage(): Promise<WebPageContent | null> {
    // Scrape current page content
  }
}
```

### Safari Extension Development

#### Info.plist Configuration
```xml
<key>CFBundleDisplayName</key>
<string>Browser Context Plugin</string>
<key>WebKit</key>
<dict>
    <key>Content</key>
    <dict>
        <key>Scripts</key>
        <array>
            <string>content-script.js</string>
        </array>
    </dict>
</dict>
```

#### Safari API Usage
```javascript
// safari/Browser-Context-Plugin.safariextension/background.js
class SafariBackgroundScript {
  setupMessageListener() {
    safari.application.addEventListener('message', (event) => {
      const message = event.message;
      // Handle message
    });
  }
}
```

### Firefox Extension Development

#### Manifest Configuration
```json
{
  "manifest_version": 2,
  "name": "Browser Context Plugin",
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "alarms",
    "background",
    "<all_urls>"
  ],
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  }
}
```

#### WebExtensions API Usage
```javascript
// firefox/background.js
class FirefoxBackgroundScript {
  setupMessageListener() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Handle message
    });
  }
}
```

## Memory Storage Adapters

### Creating a New Adapter

1. **Extend BaseMemoryAdapter**:
```typescript
export class CustomAdapter extends BaseMemoryAdapter {
  constructor(config: CustomAdapterConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // Initialize connection
  }

  async save(content: WebPageContent): Promise<void> {
    // Save content
  }

  async search(query: string, limit?: number): Promise<WebPageContent[]> {
    // Search content
  }

  // ... implement other abstract methods
}
```

2. **Add to Factory**:
```typescript
export class MemoryAdapterFactory {
  static createAdapter(config: MemoryConfig): BaseMemoryAdapter {
    switch (config.provider) {
      case 'custom':
        return new CustomAdapter(config);
      // ... other cases
    }
  }
}
```

3. **Add Configuration Type**:
```typescript
export interface CustomAdapterConfig {
  endpoint: string;
  apiKey?: string;
  customOption?: string;
}
```

### Testing Adapters

```typescript
describe('CustomAdapter', () => {
  let adapter: CustomAdapter;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    };
    
    adapter = new CustomAdapter({
      endpoint: 'https://api.custom.com',
      apiKey: 'test-key'
    });
  });

  test('should save content', async () => {
    mockClient.post.mockResolvedValue({ status: 200 });
    
    const content: WebPageContent = {
      url: 'https://example.com',
      title: 'Test',
      content: 'Test content',
      timestamp: Date.now(),
      domain: 'example.com',
      metadata: {}
    };

    await adapter.save(content);
    expect(mockClient.post).toHaveBeenCalled();
  });
});
```

## Testing Strategies

### Unit Testing

Test individual components in isolation:

```typescript
describe('ContentScraper', () => {
  let scraper: ContentScraper;

  beforeEach(() => {
    scraper = new ContentScraper();
  });

  test('should extract content from page', () => {
    // Mock DOM
    document.body.innerHTML = '<div class="content">Test content</div>';
    
    const content = scraper.extractMainContent();
    expect(content).toContain('Test content');
  });
});
```

### Integration Testing

Test component interactions:

```typescript
describe('Scraping Workflow', () => {
  test('should complete full workflow', async () => {
    const scraper = new ContentScraper();
    const urlMatcher = new URLMatcher(['*.admin.*']);
    const sensitiveFilter = new SensitiveFilter(['\\b\\d{11}\\b']);
    
    // Test workflow
    const isBlacklisted = urlMatcher.isBlacklisted('https://example.com');
    expect(isBlacklisted).toBe(false);
    
    const content = await scraper.scrapeCurrentPage();
    const filtered = sensitiveFilter.filter(content?.content || '');
    
    expect(filtered).toBeDefined();
  });
});
```

### Browser API Testing

Mock browser APIs for testing:

```typescript
describe('Chrome Extension API', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: { addListener: jest.fn() }
      },
      storage: {
        sync: { get: jest.fn(), set: jest.fn() }
      }
    };
  });

  test('should handle messages', () => {
    // Test message handling
  });
});
```

### End-to-End Testing

Test complete user workflows:

```typescript
describe('E2E Workflow', () => {
  test('should scrape and save content', async () => {
    // Setup
    const config = { /* test config */ };
    
    // Execute
    const result = await executeScrapingWorkflow(config);
    
    // Verify
    expect(result.success).toBe(true);
    expect(result.content).toBeDefined();
  });
});
```

## Debugging

### Browser Developer Tools

1. **Chrome/Edge**: F12 → Console tab
2. **Safari**: Develop → Show Web Inspector
3. **Firefox**: F12 → Console tab

### Extension Debugging

1. **Background Script**: Check service worker console
2. **Content Script**: Check page console
3. **Popup**: Right-click popup → Inspect

### Logging

Use consistent logging throughout:

```typescript
console.log('Browser Context Plugin: Info message');
console.warn('Browser Context Plugin: Warning message');
console.error('Browser Context Plugin: Error message');
```

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Debug: Detailed information');
}
```

## Performance Optimization

### Content Scraping Optimization

1. **Limit content length**:
```typescript
const content = this.extractMainContent();
return content.substring(0, this.maxContentLength);
```

2. **Use efficient selectors**:
```typescript
const contentSelectors = [
  'main',           // Most specific first
  'article',
  '[role="main"]',
  '.content'
];
```

3. **Debounce page changes**:
```typescript
private debounceTimer: number | null = null;

private onPageChange(): void {
  if (this.debounceTimer) {
    clearTimeout(this.debounceTimer);
  }
  
  this.debounceTimer = window.setTimeout(() => {
    this.autoScrape();
  }, 2000);
}
```

### Memory Management

1. **Clean up event listeners**:
```typescript
destroy(): void {
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
  
  if (this.observer) {
    this.observer.disconnect();
  }
}
```

2. **Limit stored data**:
```typescript
const content: WebPageContent = {
  // ... other properties
  content: content.substring(0, this.maxContentLength),
  timestamp: Date.now()
};
```

### Network Optimization

1. **Batch API calls**:
```typescript
private batchQueue: WebPageContent[] = [];

private async processBatch(): Promise<void> {
  if (this.batchQueue.length === 0) return;
  
  const batch = this.batchQueue.splice(0, 10);
  await this.memoryAdapter.saveBatch(batch);
}
```

2. **Implement retry logic**:
```typescript
private async saveWithRetry(content: WebPageContent, retries = 3): Promise<void> {
  try {
    await this.memoryAdapter.save(content);
  } catch (error) {
    if (retries > 0) {
      await this.saveWithRetry(content, retries - 1);
    } else {
      throw error;
    }
  }
}
```

## Deployment

### Building for Production

```bash
# Build all extensions
npm run build

# Verify build output
ls -la dist/
```

### Browser Store Deployment

#### Chrome Web Store
1. Create developer account
2. Package extension as ZIP
3. Upload to Chrome Web Store
4. Submit for review

#### Firefox Add-ons
1. Create developer account
2. Package as XPI file
3. Upload to Firefox Add-ons
4. Submit for review

#### Safari App Store
1. Create developer account
2. Package as Safari extension
3. Upload to App Store
4. Submit for review

### Continuous Integration

Set up CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run build
```

### Version Management

1. **Update version** in package.json
2. **Update CHANGELOG.md**
3. **Create git tag**:
```bash
git tag v1.0.0
git push origin v1.0.0
```

4. **Create GitHub release**

## Best Practices

### Code Quality

1. **Use TypeScript** for type safety
2. **Follow ESLint rules**
3. **Write comprehensive tests**
4. **Document public APIs**
5. **Use meaningful variable names**

### Security

1. **Validate all inputs**
2. **Sanitize content** before processing
3. **Use secure storage** for sensitive data
4. **Implement proper error handling**
5. **Regular security audits**

### Performance

1. **Profile regularly**
2. **Optimize critical paths**
3. **Use efficient algorithms**
4. **Minimize memory usage**
5. **Test on various devices**

### Maintainability

1. **Keep functions small**
2. **Use consistent patterns**
3. **Write self-documenting code**
4. **Regular refactoring**
5. **Comprehensive documentation**

This development guide should help you effectively contribute to and extend the Browser Context Plugin. For more specific questions, refer to the API documentation or create an issue on GitHub.

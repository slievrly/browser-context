# API Documentation

## Overview

The Browser Context Plugin provides a comprehensive API for web content scraping and memory storage integration.

## Core Types

### WebPageContent

```typescript
interface WebPageContent {
  url: string;
  title: string;
  content: string;
  timestamp: number;
  domain: string;
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    publishedDate?: string;
    language?: string;
  };
}
```

### ScrapingConfig

```typescript
interface ScrapingConfig {
  enabled: boolean;
  schedule: {
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    days: number[];    // 0-6 (Sunday-Saturday)
  };
  blacklist: string[]; // Blacklist URL patterns
  sensitiveFilters: {
    enabled: boolean;
    patterns: string[]; // Regex patterns
    replacement: string; // Replacement text
  };
  maxContentLength: number;
  delayBetweenPages: number; // ms
}
```

### MemoryConfig

```typescript
interface MemoryConfig {
  provider: 'mem0' | 'zep' | 'letta' | 'vector_db';
  endpoint: string;
  apiKey?: string;
  options: {
    collection?: string;
    namespace?: string;
    [key: string]: any;
  };
}
```

## Content Scraper API

### ContentScraper

Main class for scraping web page content.

```typescript
class ContentScraper {
  constructor(maxContentLength?: number, delayBetweenPages?: number);
  
  // Scrape current page
  async scrapeCurrentPage(): Promise<WebPageContent | null>;
  
  // Set maximum content length
  setMaxContentLength(length: number): void;
  
  // Set delay between pages
  setDelayBetweenPages(delay: number): void;
  
  // Get current configuration
  getConfig(): { maxContentLength: number; delayBetweenPages: number };
}
```

### Static Methods

```typescript
// Parse HTML content with Cheerio
static parseWithCheerio(html: string): cheerio.CheerioAPI;

// Extract content from HTML string
static extractFromHTML(html: string, url: string): WebPageContent | null;
```

## URL Matcher API

### URLMatcher

Class for matching URLs against blacklist patterns.

```typescript
class URLMatcher {
  constructor(patterns?: string[]);
  
  // Update blacklist patterns
  updatePatterns(patterns: string[]): void;
  
  // Check if URL is blacklisted
  isBlacklisted(url: string): boolean;
  
  // Get matching pattern
  getMatchingPattern(url: string): string | null;
  
  // Validate pattern format
  static validatePattern(pattern: string): boolean;
}
```

### Supported Pattern Types

- **Exact URL**: `https://example.com`
- **Wildcard**: `*.example.com`, `*.test.*`
- **Domain**: `.example.com` (matches subdomains)
- **Path**: `/admin/*`, `/api/*`
- **Partial**: `login`, `admin` (matches anywhere in URL)

## Sensitive Filter API

### SensitiveFilter

Class for filtering sensitive information from content.

```typescript
class SensitiveFilter {
  constructor(patterns?: string[], replacement?: string);
  
  // Update filter patterns
  updatePatterns(patterns: string[]): void;
  
  // Set replacement text
  setReplacement(replacement: string): void;
  
  // Filter sensitive information
  filter(content: string): string;
  
  // Check if content has sensitive info
  hasSensitiveInfo(content: string): boolean;
  
  // Get matching sensitive patterns
  getSensitiveMatches(content: string): string[];
  
  // Get default patterns
  static getDefaultPatterns(): string[];
}
```

### Default Patterns

The filter includes built-in patterns for:
- Email addresses
- Phone numbers (Chinese format)
- Credit card numbers
- API keys and passwords
- IP addresses
- Social security numbers
- License plates

## Scheduler API

### Scheduler

Class for managing scraping time schedules.

```typescript
class Scheduler {
  constructor(config: ScheduleConfig);
  
  // Update schedule configuration
  updateConfig(config: ScheduleConfig): void;
  
  // Start scheduler
  start(): void;
  
  // Stop scheduler
  stop(): void;
  
  // Check if currently in schedule
  isInSchedule(): boolean;
  
  // Get next schedule time
  getNextScheduleTime(): dayjs.Dayjs | null;
  
  // Get current status
  getStatus(): { isActive: boolean; isInSchedule: boolean; nextSchedule?: string };
}
```

## Memory Adapters API

### BaseMemoryAdapter

Base class for all memory storage adapters.

```typescript
abstract class BaseMemoryAdapter implements MemoryAdapter {
  constructor(config: any);
  
  // Initialize connection
  abstract connect(): Promise<void>;
  
  // Disconnect
  abstract disconnect(): Promise<void>;
  
  // Save content
  abstract save(content: WebPageContent): Promise<void>;
  
  // Search content
  abstract search(query: string, limit?: number): Promise<WebPageContent[]>;
  
  // Delete content
  abstract delete(url: string): Promise<void>;
  
  // Clear all data
  abstract clear(): Promise<void>;
  
  // Get statistics
  abstract getStats(): Promise<{ total: number; lastUpdated: number }>;
  
  // Check connection status
  isConnectedToStorage(): boolean;
  
  // Get configuration
  getConfig(): any;
  
  // Update configuration
  updateConfig(config: any): void;
  
  // Validate configuration
  abstract validateConfig(): boolean;
  
  // Test connection
  abstract testConnection(): Promise<boolean>;
}
```

### Mem0Adapter

Adapter for Mem0AI memory storage.

```typescript
class Mem0Adapter extends BaseMemoryAdapter {
  constructor(config: Mem0Config);
}

interface Mem0Config {
  endpoint: string;
  apiKey?: string;
  collection?: string;
  namespace?: string;
}
```

### ZepAdapter

Adapter for Zep memory storage.

```typescript
class ZepAdapter extends BaseMemoryAdapter {
  constructor(config: ZepConfig);
}

interface ZepConfig {
  endpoint: string;
  apiKey?: string;
  collection?: string;
  namespace?: string;
}
```

### LettaAdapter

Adapter for Letta memory storage.

```typescript
class LettaAdapter extends BaseMemoryAdapter {
  constructor(config: LettaConfig);
}

interface LettaConfig {
  endpoint: string;
  apiKey?: string;
  collection?: string;
  namespace?: string;
}
```

### VectorDBAdapter

Adapter for vector database storage.

```typescript
class VectorDBAdapter extends BaseMemoryAdapter {
  constructor(config: VectorDBConfig);
}

interface VectorDBConfig {
  provider: 'pinecone' | 'weaviate' | 'qdrant' | 'chroma' | 'milvus';
  endpoint: string;
  apiKey?: string;
  collection?: string;
  namespace?: string;
  dimension?: number;
  distanceMetric?: 'cosine' | 'euclidean' | 'dotproduct';
}
```

### MemoryAdapterFactory

Factory for creating memory adapters.

```typescript
class MemoryAdapterFactory {
  // Create adapter from config
  static createAdapter(config: MemoryConfig): BaseMemoryAdapter;
  
  // Get supported providers
  static getSupportedProviders(): string[];
  
  // Validate configuration
  static validateConfig(config: MemoryConfig): { valid: boolean; errors: string[] };
  
  // Get default configuration
  static getDefaultConfig(provider: string): Partial<MemoryConfig>;
}
```

## Browser Extension APIs

### Chrome Extension

The Chrome extension uses the standard Chrome Extension API with the following message types:

- `GET_STATE`: Get current plugin state
- `UPDATE_CONFIG`: Update scraping configuration
- `UPDATE_MEMORY_CONFIG`: Update memory storage configuration
- `START_SCRAPING`: Start scraping process
- `STOP_SCRAPING`: Stop scraping process
- `PAGE_SCRAPED`: Handle scraped page content
- `GET_STATS`: Get scraping statistics
- `CLEAR_DATA`: Clear all stored data

### Safari Extension

The Safari extension uses the Safari Extension API with similar message types and the `safari.self.tab.dispatchMessage()` method for communication.

### Firefox Extension

The Firefox extension uses the WebExtensions API with similar message types and the `browser.runtime.sendMessage()` method for communication.

## Global API

The plugin exposes a global API on the `window` object:

```typescript
window.browserContextPlugin = {
  // Scrape current page
  scrapePage(): Promise<WebPageContent>;
  
  // Check if URL is blacklisted
  isBlacklisted(url: string): boolean;
  
  // Filter sensitive information
  filterSensitiveInfo(content: string): string;
}
```

## Error Handling

All APIs include comprehensive error handling:

- Invalid configurations throw descriptive errors
- Network failures are caught and logged
- Invalid URLs are handled gracefully
- Regex pattern errors are caught and logged

## Examples

### Basic Usage

```typescript
// Create content scraper
const scraper = new ContentScraper(10000, 1000);

// Scrape current page
const content = await scraper.scrapeCurrentPage();

// Create URL matcher
const matcher = new URLMatcher(['*.example.com', '/admin/*']);

// Check if URL is blacklisted
const isBlacklisted = matcher.isBlacklisted('https://sub.example.com');

// Create sensitive filter
const filter = new SensitiveFilter(['\\b\\d{11}\\b'], '[REDACTED]');

// Filter sensitive information
const filtered = filter.filter('Phone: 13812345678');
```

### Memory Storage

```typescript
// Create memory adapter
const adapter = MemoryAdapterFactory.createAdapter({
  provider: 'mem0',
  endpoint: 'https://api.mem0.ai',
  apiKey: 'your-api-key',
  options: {
    collection: 'browser-context'
  }
});

// Connect and save content
await adapter.connect();
await adapter.save(content);

// Search content
const results = await adapter.search('search query', 10);
```

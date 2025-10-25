/**
 * Memory adapters integration tests
 */

import { MemoryAdapterFactory } from '../shared/memory-adapters/adapter-factory';
import { Mem0Adapter } from '../shared/memory-adapters/mem0-adapter';
import { ZepAdapter } from '../shared/memory-adapters/zep-adapter';
import { LettaAdapter } from '../shared/memory-adapters/letta-adapter';
import { VectorDBAdapter } from '../shared/memory-adapters/vector-db-adapter';
import { WebPageContent, MemoryConfig } from '../shared/types';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = require('axios');

describe('Memory Adapter Factory', () => {
  test('should create Mem0Adapter', () => {
    const config: MemoryConfig = {
      provider: 'mem0',
      endpoint: 'https://api.mem0.ai',
      apiKey: 'test-key',
      options: { collection: 'test' }
    };

    const adapter = MemoryAdapterFactory.createAdapter(config);
    expect(adapter).toBeInstanceOf(Mem0Adapter);
  });

  test('should create ZepAdapter', () => {
    const config: MemoryConfig = {
      provider: 'zep',
      endpoint: 'https://api.zep.ai',
      apiKey: 'test-key',
      options: { collection: 'test' }
    };

    const adapter = MemoryAdapterFactory.createAdapter(config);
    expect(adapter).toBeInstanceOf(ZepAdapter);
  });

  test('should create LettaAdapter', () => {
    const config: MemoryConfig = {
      provider: 'letta',
      endpoint: 'https://api.letta.ai',
      apiKey: 'test-key',
      options: { collection: 'test' }
    };

    const adapter = MemoryAdapterFactory.createAdapter(config);
    expect(adapter).toBeInstanceOf(LettaAdapter);
  });

  test('should create VectorDBAdapter', () => {
    const config: MemoryConfig = {
      provider: 'vector_db',
      endpoint: 'https://api.pinecone.io',
      apiKey: 'test-key',
      options: { 
        provider: 'pinecone',
        collection: 'test',
        dimension: 1536
      }
    };

    const adapter = MemoryAdapterFactory.createAdapter(config);
    expect(adapter).toBeInstanceOf(VectorDBAdapter);
  });

  test('should throw error for unsupported provider', () => {
    const config: MemoryConfig = {
      provider: 'unsupported' as any,
      endpoint: 'https://api.example.com',
      options: {}
    };

    expect(() => MemoryAdapterFactory.createAdapter(config)).toThrow();
  });

  test('should get supported providers', () => {
    const providers = MemoryAdapterFactory.getSupportedProviders();
    expect(providers).toContain('mem0');
    expect(providers).toContain('zep');
    expect(providers).toContain('letta');
    expect(providers).toContain('vector_db');
  });

  test('should validate configuration', () => {
    const validConfig: MemoryConfig = {
      provider: 'mem0',
      endpoint: 'https://api.mem0.ai',
      options: { collection: 'test' }
    };

    const validation = MemoryAdapterFactory.validateConfig(validConfig);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should validate configuration with errors', () => {
    const invalidConfig: MemoryConfig = {
      provider: 'mem0' as any,
      endpoint: '',
      options: {}
    };

    const validation = MemoryAdapterFactory.validateConfig(invalidConfig);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should get default configuration', () => {
    const defaultConfig = MemoryAdapterFactory.getDefaultConfig('mem0');
    expect(defaultConfig.provider).toBe('mem0');
    expect(defaultConfig.endpoint).toBe('');
    expect(defaultConfig.options?.collection).toBe('browser-context');
  });
});

describe('Mem0Adapter', () => {
  let adapter: Mem0Adapter;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    adapter = new Mem0Adapter({
      endpoint: 'https://api.mem0.ai',
      apiKey: 'test-key',
      collection: 'test'
    });
  });

  test('should initialize with correct configuration', () => {
    expect(adapter).toBeDefined();
    expect(adapter.getConfig().endpoint).toBe('https://api.mem0.ai');
  });

  test('should validate configuration', () => {
    expect(adapter.validateConfig()).toBe(true);
  });

  test('should test connection successfully', async () => {
    mockAxiosInstance.get.mockResolvedValue({ status: 200 });
    
    const result = await adapter.testConnection();
    expect(result).toBe(true);
  });

  test('should test connection with fallback', async () => {
    mockAxiosInstance.get
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce({ status: 200 });
    
    const result = await adapter.testConnection();
    expect(result).toBe(true);
  });

  test('should connect successfully', async () => {
    mockAxiosInstance.get.mockResolvedValue({ status: 200 });
    
    await adapter.connect();
    expect(adapter.isConnectedToStorage()).toBe(true);
  });

  test('should handle connection failure', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));
    
    await expect(adapter.connect()).rejects.toThrow();
  });

  test('should save content successfully', async () => {
    mockAxiosInstance.post.mockResolvedValue({ status: 200 });
    
    const content: WebPageContent = {
      url: 'https://example.com',
      title: 'Test Page',
      content: 'Test content',
      timestamp: Date.now(),
      domain: 'example.com',
      metadata: {}
    };

    await adapter.save(content);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/memories', expect.any(Object));
  });

  test('should search content successfully', async () => {
    const mockResponse = {
      data: {
        memories: [{
          content: 'Test content',
          metadata: {
            url: 'https://example.com',
            title: 'Test Page'
          }
        }]
      }
    };
    
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    const results = await adapter.search('test query', 10);
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://example.com');
  });

  test('should delete content successfully', async () => {
    mockAxiosInstance.delete.mockResolvedValue({ status: 200 });
    
    await adapter.delete('https://example.com');
    expect(mockAxiosInstance.delete).toHaveBeenCalled();
  });

  test('should clear all data successfully', async () => {
    mockAxiosInstance.delete.mockResolvedValue({ status: 200 });
    
    await adapter.clear();
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/memories', expect.any(Object));
  });

  test('should get stats successfully', async () => {
    const mockResponse = {
      data: {
        total: 100,
        lastUpdated: Date.now()
      }
    };
    
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    const stats = await adapter.getStats();
    expect(stats.total).toBe(100);
    expect(stats.lastUpdated).toBeGreaterThan(0);
  });

  test('should handle stats endpoint not found', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Not found'));
    
    const stats = await adapter.getStats();
    expect(stats.total).toBe(0);
    expect(stats.lastUpdated).toBe(0);
  });

  test('should disconnect successfully', async () => {
    await adapter.disconnect();
    expect(adapter.isConnectedToStorage()).toBe(false);
  });

  test('should update configuration', () => {
    const newConfig = { endpoint: 'https://new-api.mem0.ai' };
    adapter.updateConfig(newConfig);
    
    expect(adapter.getConfig().endpoint).toBe('https://new-api.mem0.ai');
  });
});

describe('ZepAdapter', () => {
  let adapter: ZepAdapter;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    adapter = new ZepAdapter({
      endpoint: 'https://api.zep.ai',
      apiKey: 'test-key',
      collection: 'test'
    });
  });

  test('should create session for domain', async () => {
    mockAxiosInstance.get.mockRejectedValue({ response: { status: 404 } });
    mockAxiosInstance.post.mockResolvedValue({ status: 200 });
    
    const content: WebPageContent = {
      url: 'https://example.com',
      title: 'Test Page',
      content: 'Test content',
      timestamp: Date.now(),
      domain: 'example.com',
      metadata: {}
    };

    await adapter.save(content);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/sessions', expect.any(Object));
  });

  test('should use existing session', async () => {
    mockAxiosInstance.get.mockResolvedValue({ status: 200 });
    mockAxiosInstance.post.mockResolvedValue({ status: 200 });
    
    const content: WebPageContent = {
      url: 'https://example.com',
      title: 'Test Page',
      content: 'Test content',
      timestamp: Date.now(),
      domain: 'example.com',
      metadata: {}
    };

    await adapter.save(content);
    expect(mockAxiosInstance.get).toHaveBeenCalled();
  });
});

describe('LettaAdapter', () => {
  let adapter: LettaAdapter;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    adapter = new LettaAdapter({
      endpoint: 'https://api.letta.ai',
      apiKey: 'test-key',
      collection: 'test'
    });
  });

  test('should save document successfully', async () => {
    mockAxiosInstance.post.mockResolvedValue({ status: 200 });
    
    const content: WebPageContent = {
      url: 'https://example.com',
      title: 'Test Page',
      content: 'Test content',
      timestamp: Date.now(),
      domain: 'example.com',
      metadata: {}
    };

    await adapter.save(content);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/documents', expect.any(Object));
  });

  test('should search documents successfully', async () => {
    const mockResponse = {
      data: {
        documents: [{
          content: 'Test content',
          metadata: {
            url: 'https://example.com',
            title: 'Test Page'
          }
        }]
      }
    };
    
    mockAxiosInstance.post.mockResolvedValue(mockResponse);
    
    const results = await adapter.search('test query', 10);
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://example.com');
  });
});

describe('VectorDBAdapter', () => {
  let adapter: VectorDBAdapter;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    adapter = new VectorDBAdapter({
      provider: 'pinecone',
      endpoint: 'https://api.pinecone.io',
      apiKey: 'test-key',
      collection: 'test',
      dimension: 1536
    });
  });

  test('should create collection if not exists', async () => {
    mockAxiosInstance.get.mockRejectedValue({ response: { status: 404 } });
    mockAxiosInstance.post.mockResolvedValue({ status: 200 });
    
    await adapter.connect();
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/collections', expect.any(Object));
  });

  test('should save vector successfully', async () => {
    mockAxiosInstance.get.mockResolvedValue({ status: 200 });
    mockAxiosInstance.post.mockResolvedValue({ status: 200 });
    
    const content: WebPageContent = {
      url: 'https://example.com',
      title: 'Test Page',
      content: 'Test content',
      timestamp: Date.now(),
      domain: 'example.com',
      metadata: {}
    };

    await adapter.save(content);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/collections/test/vectors', expect.any(Object));
  });

  test('should search vectors successfully', async () => {
    const mockResponse = {
      data: {
        results: [{
          metadata: {
            url: 'https://example.com',
            title: 'Test Page',
            content: 'Test content'
          }
        }]
      }
    };
    
    mockAxiosInstance.post.mockResolvedValue(mockResponse);
    
    const results = await adapter.search('test query', 10);
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://example.com');
  });
});

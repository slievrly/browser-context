/**
 * Memory适配器工厂
 * 根据配置创建相应的存储适配器
 */

import { BaseMemoryAdapter } from './base-adapter';
import { Mem0Adapter, Mem0Config } from './mem0-adapter';
import { ZepAdapter, ZepConfig } from './zep-adapter';
import { LettaAdapter, LettaConfig } from './letta-adapter';
import { VectorDBAdapter, VectorDBConfig } from './vector-db-adapter';
import { MemoryConfig } from '../../types';

export class MemoryAdapterFactory {
  /**
   * 创建Memory适配器
   */
  static createAdapter(config: MemoryConfig): BaseMemoryAdapter {
    // 验证配置
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    switch (config.provider) {
      case 'mem0':
        return new Mem0Adapter({
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          collection: config.options.collection,
          namespace: config.options.namespace
        });

      case 'zep':
        return new ZepAdapter({
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          collection: config.options.collection,
          namespace: config.options.namespace
        });

      case 'letta':
        return new LettaAdapter({
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          collection: config.options.collection,
          namespace: config.options.namespace
        });

      case 'vector_db':
        return new VectorDBAdapter({
          provider: config.options.provider || 'pinecone',
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          collection: config.options.collection,
          namespace: config.options.namespace,
          dimension: config.options.dimension,
          distanceMetric: config.options.distanceMetric
        });

      default:
        throw new Error(`Unsupported memory provider: ${config.provider}`);
    }
  }

  /**
   * 获取支持的提供商列表
   */
  static getSupportedProviders(): string[] {
    return ['mem0', 'zep', 'letta', 'vector_db'];
  }

  /**
   * 验证配置
   */
  static validateConfig(config: MemoryConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('Provider is required');
    } else if (!this.getSupportedProviders().includes(config.provider)) {
      errors.push(`Unsupported provider: ${config.provider}`);
    }

    if (!config.endpoint) {
      errors.push('Endpoint is required');
    }

    if (config.provider === 'vector_db') {
      if (!config.options.provider) {
        errors.push('Vector database provider is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取提供商默认配置
   */
  static getDefaultConfig(provider: string): Partial<MemoryConfig> {
    const baseConfig = {
      endpoint: '',
      apiKey: '',
      options: {
        collection: 'browser-context',
        namespace: 'default'
      }
    };

    switch (provider) {
      case 'mem0':
        return {
          ...baseConfig,
          provider: 'mem0' as const
        };

      case 'zep':
        return {
          ...baseConfig,
          provider: 'zep' as const
        };

      case 'letta':
        return {
          ...baseConfig,
          provider: 'letta' as const
        };

      case 'vector_db':
        return {
          ...baseConfig,
          provider: 'vector_db' as const,
          options: {
            ...baseConfig.options,
            provider: 'pinecone',
            dimension: 1536,
            distanceMetric: 'cosine'
          }
        };

      default:
        return baseConfig;
    }
  }
}

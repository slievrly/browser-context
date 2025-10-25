/**
 * Mem0AI存储适配器
 * 实现与Mem0AI的集成
 */

import axios, { AxiosInstance } from 'axios';
import { BaseMemoryAdapter } from './base-adapter';
import { WebPageContent } from '../../types';

export interface Mem0Config {
  endpoint: string;
  apiKey?: string;
  collection?: string;
  namespace?: string;
}

export class Mem0Adapter extends BaseMemoryAdapter {
  private client: AxiosInstance;
  private collection: string;

  constructor(config: Mem0Config) {
    super(config);
    this.collection = config.collection || 'browser-context';
    
    this.client = axios.create({
      baseURL: config.endpoint,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      },
      timeout: 30000
    });
  }

  /**
   * 初始化连接
   */
  async connect(): Promise<void> {
    try {
      // 测试连接
      await this.testConnection();
      this.isConnected = true;
      console.log('Connected to Mem0AI');
    } catch (error) {
      this.handleApiError(error, 'connect');
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('Disconnected from Mem0AI');
  }

  /**
   * 保存网页内容
   */
  async save(content: WebPageContent): Promise<void> {
    try {
      const memoryData = {
        collection: this.collection,
        namespace: this.config.namespace || 'default',
        memories: [
          {
            id: this.generateId(content.url),
            content: this.formatContent(content),
            metadata: {
              url: content.url,
              title: content.title,
              domain: content.domain,
              timestamp: content.timestamp,
              ...content.metadata
            }
          }
        ]
      };

      await this.client.post('/memories', memoryData);
    } catch (error) {
      this.handleApiError(error, 'save');
    }
  }

  /**
   * 搜索内容
   */
  async search(query: string, limit: number = 10): Promise<WebPageContent[]> {
    try {
      const response = await this.client.get('/search', {
        params: {
          collection: this.collection,
          namespace: this.config.namespace || 'default',
          query,
          limit
        }
      });

      return this.parseSearchResults(response.data);
    } catch (error) {
      this.handleApiError(error, 'search');
    }
  }

  /**
   * 删除指定URL的内容
   */
  async delete(url: string): Promise<void> {
    try {
      const id = this.generateId(url);
      await this.client.delete(`/memories/${id}`, {
        params: {
          collection: this.collection,
          namespace: this.config.namespace || 'default'
        }
      });
    } catch (error) {
      this.handleApiError(error, 'delete');
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    try {
      await this.client.delete('/memories', {
        params: {
          collection: this.collection,
          namespace: this.config.namespace || 'default'
        }
      });
    } catch (error) {
      this.handleApiError(error, 'clear');
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{ total: number; lastUpdated: number }> {
    try {
      const response = await this.client.get('/stats', {
        params: {
          collection: this.collection,
          namespace: this.config.namespace || 'default'
        }
      });

      return {
        total: response.data.total || 0,
        lastUpdated: response.data.lastUpdated || 0
      };
    } catch (error) {
      // 如果stats端点不存在，返回默认值
      return { total: 0, lastUpdated: 0 };
    }
  }

  /**
   * 验证配置
   */
  validateConfig(): boolean {
    return !!(this.config.endpoint && this.config.collection);
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      // 如果health端点不存在，尝试其他端点
      try {
        const response = await this.client.get('/');
        return response.status === 200;
      } catch {
        return false;
      }
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(url: string): string {
    // 使用URL的hash作为ID
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * 格式化内容
   */
  private formatContent(content: WebPageContent): string {
    let formatted = `Title: ${content.title}\n`;
    formatted += `URL: ${content.url}\n`;
    formatted += `Domain: ${content.domain}\n`;
    formatted += `Content: ${content.content}\n`;
    
    if (content.metadata.description) {
      formatted += `Description: ${content.metadata.description}\n`;
    }
    
    if (content.metadata.author) {
      formatted += `Author: ${content.metadata.author}\n`;
    }
    
    if (content.metadata.publishedDate) {
      formatted += `Published: ${content.metadata.publishedDate}\n`;
    }

    return formatted;
  }

  /**
   * 解析搜索结果
   */
  private parseSearchResults(data: any): WebPageContent[] {
    if (!data.memories || !Array.isArray(data.memories)) {
      return [];
    }

    return data.memories.map((memory: any) => {
      const metadata = memory.metadata || {};
      
      return {
        url: metadata.url || '',
        title: metadata.title || '',
        content: memory.content || '',
        timestamp: metadata.timestamp || Date.now(),
        domain: metadata.domain || '',
        metadata: {
          description: metadata.description,
          keywords: metadata.keywords,
          author: metadata.author,
          publishedDate: metadata.publishedDate,
          language: metadata.language
        }
      };
    });
  }
}

/**
 * 向量数据库存储适配器
 * 支持多种向量数据库（Pinecone, Weaviate, Qdrant等）
 */

import axios, { AxiosInstance } from 'axios';
import { BaseMemoryAdapter } from './base-adapter';
import { WebPageContent } from '../../types';

export interface VectorDBConfig {
  provider: 'pinecone' | 'weaviate' | 'qdrant' | 'chroma' | 'milvus';
  endpoint: string;
  apiKey?: string;
  collection?: string;
  namespace?: string;
  dimension?: number;
  distanceMetric?: 'cosine' | 'euclidean' | 'dotproduct';
}

export class VectorDBAdapter extends BaseMemoryAdapter {
  private client: AxiosInstance;
  private collection: string;
  private provider: string;
  private dimension: number;

  constructor(config: VectorDBConfig) {
    super(config);
    this.provider = config.provider;
    this.collection = config.collection || 'browser-context';
    this.dimension = config.dimension || 1536; // 默认OpenAI embedding维度
    
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
      
      // 确保集合存在
      await this.ensureCollection();
      
      this.isConnected = true;
      console.log(`Connected to ${this.provider}`);
    } catch (error) {
      this.handleApiError(error, 'connect');
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log(`Disconnected from ${this.provider}`);
  }

  /**
   * 保存网页内容
   */
  async save(content: WebPageContent): Promise<void> {
    try {
      // 生成向量嵌入（这里使用简单的文本hash作为示例）
      const embedding = await this.generateEmbedding(content);
      
      const vectorData = {
        id: this.generateId(content.url),
        values: embedding,
        metadata: {
          url: content.url,
          title: content.title,
          domain: content.domain,
          timestamp: content.timestamp,
          content: content.content,
          ...content.metadata
        }
      };

      await this.upsertVector(vectorData);
    } catch (error) {
      this.handleApiError(error, 'save');
    }
  }

  /**
   * 搜索内容
   */
  async search(query: string, limit: number = 10): Promise<WebPageContent[]> {
    try {
      // 生成查询向量
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      const searchResults = await this.searchVectors(queryEmbedding, limit);
      return this.parseSearchResults(searchResults);
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
      await this.deleteVector(id);
    } catch (error) {
      this.handleApiError(error, 'delete');
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    try {
      await this.clearCollection();
    } catch (error) {
      this.handleApiError(error, 'clear');
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{ total: number; lastUpdated: number }> {
    try {
      const stats = await this.getCollectionStats();
      return {
        total: stats.total || 0,
        lastUpdated: stats.lastUpdated || 0
      };
    } catch (error) {
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
      try {
        const response = await this.client.get('/');
        return response.status === 200;
      } catch {
        return false;
      }
    }
  }

  /**
   * 确保集合存在
   */
  private async ensureCollection(): Promise<void> {
    try {
      await this.client.get(`/collections/${this.collection}`);
    } catch (error) {
      if (error.response?.status === 404) {
        await this.createCollection();
      } else {
        throw error;
      }
    }
  }

  /**
   * 创建集合
   */
  private async createCollection(): Promise<void> {
    const collectionConfig = {
      name: this.collection,
      dimension: this.dimension,
      distance_metric: this.config.distanceMetric || 'cosine',
      metadata: {
        namespace: this.config.namespace || 'default'
      }
    };

    await this.client.post('/collections', collectionConfig);
  }

  /**
   * 生成向量嵌入
   */
  private async generateEmbedding(content: WebPageContent): Promise<number[]> {
    // 这里应该调用实际的embedding API
    // 为了演示，我们使用简单的文本hash生成伪向量
    const text = `${content.title} ${content.content}`;
    const hash = this.simpleHash(text);
    
    // 生成伪向量
    const vector = [];
    for (let i = 0; i < this.dimension; i++) {
      vector.push(Math.sin(hash + i) * 0.1);
    }
    
    return vector;
  }

  /**
   * 生成查询向量
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // 这里应该调用实际的embedding API
    const hash = this.simpleHash(query);
    
    const vector = [];
    for (let i = 0; i < this.dimension; i++) {
      vector.push(Math.sin(hash + i) * 0.1);
    }
    
    return vector;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 插入或更新向量
   */
  private async upsertVector(vectorData: any): Promise<void> {
    await this.client.post(`/collections/${this.collection}/vectors`, {
      vectors: [vectorData]
    });
  }

  /**
   * 搜索向量
   */
  private async searchVectors(queryVector: number[], limit: number): Promise<any> {
    const response = await this.client.post(`/collections/${this.collection}/query`, {
      vector: queryVector,
      top_k: limit,
      include_metadata: true
    });

    return response.data;
  }

  /**
   * 删除向量
   */
  private async deleteVector(id: string): Promise<void> {
    await this.client.delete(`/collections/${this.collection}/vectors/${id}`);
  }

  /**
   * 清空集合
   */
  private async clearCollection(): Promise<void> {
    await this.client.delete(`/collections/${this.collection}/vectors`);
  }

  /**
   * 获取集合统计
   */
  private async getCollectionStats(): Promise<any> {
    const response = await this.client.get(`/collections/${this.collection}/stats`);
    return response.data;
  }

  /**
   * 生成唯一ID
   */
  private generateId(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * 解析搜索结果
   */
  private parseSearchResults(data: any): WebPageContent[] {
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: any) => {
      const metadata = result.metadata || {};
      
      return {
        url: metadata.url || '',
        title: metadata.title || '',
        content: metadata.content || '',
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

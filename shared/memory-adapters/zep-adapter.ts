/**
 * Zep存储适配器
 * 实现与Zep的集成
 */

import axios, { AxiosInstance } from 'axios';
import { BaseMemoryAdapter } from './base-adapter';
import { WebPageContent } from '../../types';

export interface ZepConfig {
  endpoint: string;
  apiKey?: string;
  collection?: string;
  namespace?: string;
}

export class ZepAdapter extends BaseMemoryAdapter {
  private client: AxiosInstance;
  private collection: string;

  constructor(config: ZepConfig) {
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
      console.log('Connected to Zep');
    } catch (error) {
      this.handleApiError(error, 'connect');
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('Disconnected from Zep');
  }

  /**
   * 保存网页内容
   */
  async save(content: WebPageContent): Promise<void> {
    try {
      const sessionId = this.generateSessionId(content.domain);
      
      // 创建或获取会话
      await this.ensureSession(sessionId);

      // 添加消息到会话
      const message = {
        role: 'user',
        content: this.formatContent(content),
        metadata: {
          url: content.url,
          title: content.title,
          domain: content.domain,
          timestamp: content.timestamp,
          ...content.metadata
        }
      };

      await this.client.post(`/sessions/${sessionId}/messages`, message);
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
      const sessionId = this.generateSessionId(new URL(url).hostname);
      
      // 获取会话消息
      const response = await this.client.get(`/sessions/${sessionId}/messages`);
      const messages = response.data.messages || [];

      // 找到要删除的消息
      const messageToDelete = messages.find((msg: any) => 
        msg.metadata && msg.metadata.url === url
      );

      if (messageToDelete) {
        await this.client.delete(`/sessions/${sessionId}/messages/${messageToDelete.uuid}`);
      }
    } catch (error) {
      this.handleApiError(error, 'delete');
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    try {
      // 获取所有会话
      const response = await this.client.get('/sessions');
      const sessions = response.data.sessions || [];

      // 删除所有会话
      for (const session of sessions) {
        if (session.session_id.startsWith('browser-context-')) {
          await this.client.delete(`/sessions/${session.session_id}`);
        }
      }
    } catch (error) {
      this.handleApiError(error, 'clear');
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{ total: number; lastUpdated: number }> {
    try {
      const response = await this.client.get('/sessions');
      const sessions = response.data.sessions || [];
      
      let totalMessages = 0;
      let lastUpdated = 0;

      for (const session of sessions) {
        if (session.session_id.startsWith('browser-context-')) {
          const sessionResponse = await this.client.get(`/sessions/${session.session_id}/messages`);
          const messages = sessionResponse.data.messages || [];
          totalMessages += messages.length;
          
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const messageTime = new Date(lastMessage.created_at).getTime();
            if (messageTime > lastUpdated) {
              lastUpdated = messageTime;
            }
          }
        }
      }

      return { total: totalMessages, lastUpdated };
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
   * 生成会话ID
   */
  private generateSessionId(domain: string): string {
    const cleanDomain = domain.replace(/[^a-zA-Z0-9]/g, '');
    return `browser-context-${cleanDomain}-${Date.now()}`;
  }

  /**
   * 确保会话存在
   */
  private async ensureSession(sessionId: string): Promise<void> {
    try {
      await this.client.get(`/sessions/${sessionId}`);
    } catch (error) {
      // 如果会话不存在，创建它
      if (error.response?.status === 404) {
        await this.client.post('/sessions', {
          session_id: sessionId,
          metadata: {
            collection: this.collection,
            namespace: this.config.namespace || 'default'
          }
        });
      } else {
        throw error;
      }
    }
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
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: any) => {
      const metadata = result.metadata || {};
      
      return {
        url: metadata.url || '',
        title: metadata.title || '',
        content: result.content || '',
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

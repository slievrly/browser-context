/**
 * Memory存储适配器基类
 * 定义所有存储适配器的通用接口
 */

import { MemoryAdapter, WebPageContent } from '../../types';

export abstract class BaseMemoryAdapter implements MemoryAdapter {
  protected config: any;
  protected isConnected: boolean = false;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * 初始化连接
   */
  abstract connect(): Promise<void>;

  /**
   * 断开连接
   */
  abstract disconnect(): Promise<void>;

  /**
   * 保存网页内容
   */
  abstract save(content: WebPageContent): Promise<void>;

  /**
   * 搜索内容
   */
  abstract search(query: string, limit?: number): Promise<WebPageContent[]>;

  /**
   * 删除指定URL的内容
   */
  abstract delete(url: string): Promise<void>;

  /**
   * 清空所有数据
   */
  abstract clear(): Promise<void>;

  /**
   * 获取统计信息
   */
  abstract getStats(): Promise<{ total: number; lastUpdated: number }>;

  /**
   * 检查连接状态
   */
  isConnectedToStorage(): boolean {
    return this.isConnected;
  }

  /**
   * 获取配置
   */
  getConfig(): any {
    return this.config;
  }

  /**
   * 更新配置
   */
  updateConfig(config: any): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 验证配置
   */
  abstract validateConfig(): boolean;

  /**
   * 测试连接
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * 获取错误信息
   */
  protected getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && error.message) {
      return String(error.message);
    }
    return 'Unknown error occurred';
  }

  /**
   * 处理API错误
   */
  protected handleApiError(error: any, operation: string): never {
    const message = this.getErrorMessage(error);
    console.error(`Memory adapter ${operation} failed:`, message);
    throw new Error(`${operation} failed: ${message}`);
  }
}

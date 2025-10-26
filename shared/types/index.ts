// 基础类型定义
export interface WebPageContent {
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
    [key: string]: any; // 允许额外的元数据字段
  };
}

// 抓取配置
export interface ScrapingConfig {
  enabled: boolean;
  schedule: {
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    days: number[];    // 0-6 (Sunday-Saturday)
  };
  blacklist: string[]; // 黑名单URL模式
  sensitiveFilters: {
    enabled: boolean;
    patterns: string[]; // 敏感信息正则表达式
    replacement: string; // 替换文本
  };
  maxContentLength: number;
  delayBetweenPages: number; // 页面间延迟(ms)
}

// Memory存储配置
export interface MemoryConfig {
  provider: 'mem0' | 'zep' | 'letta' | 'vector_db';
  endpoint: string;
  apiKey?: string;
  timeout?: number; // 请求超时时间（毫秒）
  retryCount?: number; // 重试次数
  options: {
    collection?: string;
    namespace?: string;
    [key: string]: any;
  };
}

// 插件状态
export interface PluginState {
  isActive: boolean;
  currentConfig: ScrapingConfig;
  memoryConfig: MemoryConfig;
  stats: {
    totalPagesScraped: number;
    lastScrapedAt?: number;
    errors: number;
  };
}

// Memory存储接口
export interface MemoryAdapter {
  save(content: WebPageContent): Promise<void>;
  search(query: string, limit?: number): Promise<WebPageContent[]>;
  delete(url: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<{ total: number; lastUpdated: number }>;
}

// 事件类型
export interface ScrapingEvent {
  type: 'start' | 'stop' | 'page_scraped' | 'error';
  data?: any;
  timestamp: number;
}

// 浏览器API类型扩展
declare global {
  interface Window {
    browserContextPlugin?: {
      scrapePage: () => Promise<WebPageContent>;
      isBlacklisted: (url: string) => boolean;
      filterSensitiveInfo: (content: string) => string;
    };
  }
}

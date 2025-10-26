/**
 * Edge扩展后台脚本
 * 管理扩展的核心逻辑和存储
 */

import { Scheduler } from '../shared/utils/scheduler';
import { WebPageContent, ScrapingConfig, MemoryConfig, PluginState, ScrapingEvent } from '../shared/types';

class EdgeBackgroundScript {
  private scheduler: Scheduler | null = null;
  private state: PluginState;
  private memoryAdapter: any = null; // 将在后续实现

  constructor() {
    this.state = this.getDefaultState();
    this.init();
  }

  /**
   * 初始化后台脚本
   */
  private async init(): Promise<void> {
    try {
      // 加载保存的状态
      await this.loadState();
      
      // 设置消息监听器
      this.setupMessageListener();
      
      // 设置存储监听器
      this.setupStorageListener();
      
      // 设置闹钟监听器
      this.setupAlarmListener();
      
      // 启动调度器
      this.startScheduler();
      
      console.log('Browser Context Plugin background script initialized');
    } catch (error) {
      console.error('Failed to initialize background script:', error);
    }
  }

  /**
   * 获取默认状态
   */
  private getDefaultState(): PluginState {
    return {
      isActive: false,
      currentConfig: {
        enabled: false,
        schedule: {
          startTime: '09:00',
          endTime: '18:00',
          days: [1, 2, 3, 4, 5] // 工作日
        },
        blacklist: [],
        sensitiveFilters: {
          enabled: true,
          patterns: [],
          replacement: '[FILTERED]'
        },
        maxContentLength: 10000,
        delayBetweenPages: 1000
      },
      memoryConfig: {
        provider: 'mem0',
        endpoint: '',
        options: {}
      },
      stats: {
        totalPagesScraped: 0,
        errors: 0
      }
    };
  }

  /**
   * 加载保存的状态
   */
  private async loadState(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['pluginState'], (result) => {
        if (result.pluginState) {
          this.state = { ...this.state, ...result.pluginState };
        }
        resolve();
      });
    });
  }

  /**
   * 保存状态
   */
  private async saveState(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ pluginState: this.state }, () => {
        resolve();
      });
    });
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'GET_STATE':
          sendResponse(this.state);
          break;
          
        case 'UPDATE_CONFIG':
          this.handleUpdateConfig(message.config).then(sendResponse);
          break;
          
        case 'UPDATE_MEMORY_CONFIG':
          this.handleUpdateMemoryConfig(message.config).then(sendResponse);
          break;
          
        case 'START_SCRAPING':
          this.handleStartScraping().then(sendResponse);
          break;
          
        case 'STOP_SCRAPING':
          this.handleStopScraping().then(sendResponse);
          break;
          
        case 'PAGE_SCRAPED':
          this.handlePageScraped(message.content).then(sendResponse);
          break;
          
        case 'GET_STATS':
          sendResponse(this.state.stats);
          break;
          
        case 'CLEAR_DATA':
          this.handleClearData().then(sendResponse);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    });
  }

  /**
   * 设置存储监听器
   */
  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.pluginState) {
        this.state = { ...this.state, ...changes.pluginState.newValue };
        this.updateScheduler();
      }
    });
  }

  /**
   * 设置闹钟监听器
   */
  private setupAlarmListener(): void {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'scraping-schedule') {
        this.handleScheduledScraping();
      }
    });
  }

  /**
   * 启动调度器
   */
  private startScheduler(): void {
    if (this.scheduler) {
      this.scheduler.stop();
    }

    this.scheduler = new Scheduler(this.state.currentConfig.schedule);
    this.scheduler.start();
  }

  /**
   * 更新调度器
   */
  private updateScheduler(): void {
    if (this.scheduler) {
      this.scheduler.updateConfig(this.state.currentConfig.schedule);
    }
  }

  /**
   * 处理配置更新
   */
  private async handleUpdateConfig(config: ScrapingConfig): Promise<void> {
    this.state.currentConfig = config;
    await this.saveState();
    this.updateScheduler();
  }

  /**
   * 处理Memory配置更新
   */
  private async handleUpdateMemoryConfig(config: MemoryConfig): Promise<void> {
    this.state.memoryConfig = config;
    await this.saveState();
    // TODO: 重新初始化memory adapter
  }

  /**
   * 处理开始抓取
   */
  private async handleStartScraping(): Promise<void> {
    this.state.isActive = true;
    await this.saveState();
    this.emitEvent({ type: 'start', timestamp: Date.now() });
  }

  /**
   * 处理停止抓取
   */
  private async handleStopScraping(): Promise<void> {
    this.state.isActive = false;
    await this.saveState();
    this.emitEvent({ type: 'stop', timestamp: Date.now() });
  }

  /**
   * 处理页面抓取完成
   */
  private async handlePageScraped(content: WebPageContent): Promise<void> {
    try {
      // 保存到memory存储
      if (this.memoryAdapter) {
        await this.memoryAdapter.save(content);
      }

      // 更新统计
      this.state.stats.totalPagesScraped++;
      this.state.stats.lastScrapedAt = Date.now();
      await this.saveState();

      // 发送事件
      this.emitEvent({
        type: 'page_scraped',
        data: { url: content.url, title: content.title },
        timestamp: Date.now()
      });

      console.log('Page scraped and saved:', content.url);
    } catch (error) {
      console.error('Failed to save scraped content:', error);
      this.state.stats.errors++;
      await this.saveState();
    }
  }

  /**
   * 处理清除数据
   */
  private async handleClearData(): Promise<void> {
    try {
      if (this.memoryAdapter) {
        await this.memoryAdapter.clear();
      }
      
      this.state.stats = {
        totalPagesScraped: 0,
        errors: 0
      };
      
      await this.saveState();
      console.log('Data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  /**
   * 处理定时抓取
   */
  private async handleScheduledScraping(): Promise<void> {
    if (!this.state.isActive || !this.state.currentConfig.enabled) {
      return;
    }

    try {
      // 获取当前活动标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) return;

      const tab = tabs[0];
      if (!tab.id) return;

      // 向内容脚本发送抓取消息
      chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to send message to content script:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.error('Scheduled scraping failed:', error);
    }
  }

  /**
   * 发送事件
   */
  private emitEvent(event: ScrapingEvent): void {
    // 可以在这里添加事件发送逻辑，比如发送到外部API
    console.log('Event emitted:', event);
  }

  /**
   * 获取当前状态
   */
  getState(): PluginState {
    return this.state;
  }
}

// 启动后台脚本
new EdgeBackgroundScript();

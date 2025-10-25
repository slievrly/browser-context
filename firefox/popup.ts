/**
 * Chrome扩展弹出页面脚本
 * 管理用户界面和配置
 */

import { ScrapingConfig, MemoryConfig, PluginState } from '../shared/types';

class PopupController {
  private state: PluginState | null = null;
  private currentTab: string = 'basic';

  constructor() {
    this.init();
  }

  /**
   * 初始化弹出页面
   */
  private async init(): Promise<void> {
    try {
      // 加载状态
      await this.loadState();
      
      // 设置事件监听器
      this.setupEventListeners();
      
      // 初始化UI
      this.initializeUI();
      
      // 隐藏加载状态
      this.hideLoading();
    } catch (error) {
      this.showError('初始化失败: ' + error.message);
    }
  }

  /**
   * 加载状态
   */
  private async loadState(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        this.state = response;
        resolve();
      });
    });
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 控制按钮
    document.getElementById('start-btn')?.addEventListener('click', () => this.startScraping());
    document.getElementById('stop-btn')?.addEventListener('click', () => this.stopScraping());
    document.getElementById('clear-btn')?.addEventListener('click', () => this.clearData());
    document.getElementById('save-btn')?.addEventListener('click', () => this.saveConfig());

    // 标签页切换
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).dataset.tab;
        if (target) {
          this.switchTab(target);
        }
      });
    });

    // 配置变更监听
    this.setupConfigListeners();
  }

  /**
   * 设置配置监听器
   */
  private setupConfigListeners(): void {
    // 基础配置
    document.getElementById('enabled-checkbox')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('max-content-length')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('delay-between-pages')?.addEventListener('change', () => this.updateConfig());

    // 时间调度
    document.getElementById('start-time')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('end-time')?.addEventListener('change', () => this.updateConfig());
    document.querySelectorAll('#schedule-days input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateConfig());
    });

    // 过滤设置
    document.getElementById('blacklist-textarea')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('sensitive-filters-enabled')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('sensitive-replacement')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('sensitive-patterns')?.addEventListener('change', () => this.updateConfig());

    // 存储设置
    document.getElementById('memory-provider')?.addEventListener('change', () => this.updateMemoryConfig());
    document.getElementById('memory-endpoint')?.addEventListener('change', () => this.updateMemoryConfig());
    document.getElementById('memory-api-key')?.addEventListener('change', () => this.updateMemoryConfig());
    document.getElementById('memory-collection')?.addEventListener('change', () => this.updateMemoryConfig());
  }

  /**
   * 初始化UI
   */
  private initializeUI(): void {
    if (!this.state) return;

    // 更新状态显示
    this.updateStatusDisplay();
    
    // 更新配置表单
    this.updateConfigForm();
    
    // 更新存储配置表单
    this.updateMemoryConfigForm();
  }

  /**
   * 更新状态显示
   */
  private updateStatusDisplay(): void {
    if (!this.state) return;

    // 状态指示器
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.className = `status-indicator ${this.state.isActive ? '' : 'inactive'}`;
    }

    // 统计信息
    const totalPages = document.getElementById('total-pages');
    if (totalPages) {
      totalPages.textContent = this.state.stats.totalPagesScraped.toString();
    }

    const lastScraped = document.getElementById('last-scraped');
    if (lastScraped) {
      if (this.state.stats.lastScrapedAt) {
        const date = new Date(this.state.stats.lastScrapedAt);
        lastScraped.textContent = date.toLocaleTimeString();
      } else {
        lastScraped.textContent = '-';
      }
    }
  }

  /**
   * 更新配置表单
   */
  private updateConfigForm(): void {
    if (!this.state) return;

    const config = this.state.currentConfig;

    // 基础配置
    (document.getElementById('enabled-checkbox') as HTMLInputElement).checked = config.enabled;
    (document.getElementById('max-content-length') as HTMLInputElement).value = config.maxContentLength.toString();
    (document.getElementById('delay-between-pages') as HTMLInputElement).value = config.delayBetweenPages.toString();

    // 时间调度
    (document.getElementById('start-time') as HTMLInputElement).value = config.schedule.startTime;
    (document.getElementById('end-time') as HTMLInputElement).value = config.schedule.endTime;
    
    // 日期选择
    document.querySelectorAll('#schedule-days input[type="checkbox"]').forEach((checkbox: HTMLInputElement) => {
      checkbox.checked = config.schedule.days.includes(parseInt(checkbox.value));
    });

    // 黑名单
    (document.getElementById('blacklist-textarea') as HTMLTextAreaElement).value = config.blacklist.join('\n');

    // 敏感信息过滤
    (document.getElementById('sensitive-filters-enabled') as HTMLInputElement).checked = config.sensitiveFilters.enabled;
    (document.getElementById('sensitive-replacement') as HTMLInputElement).value = config.sensitiveFilters.replacement;
    (document.getElementById('sensitive-patterns') as HTMLTextAreaElement).value = config.sensitiveFilters.patterns.join('\n');
  }

  /**
   * 更新存储配置表单
   */
  private updateMemoryConfigForm(): void {
    if (!this.state) return;

    const memoryConfig = this.state.memoryConfig;

    (document.getElementById('memory-provider') as HTMLSelectElement).value = memoryConfig.provider;
    (document.getElementById('memory-endpoint') as HTMLInputElement).value = memoryConfig.endpoint;
    (document.getElementById('memory-api-key') as HTMLInputElement).value = memoryConfig.apiKey || '';
    (document.getElementById('memory-collection') as HTMLInputElement).value = memoryConfig.options.collection || '';
  }

  /**
   * 切换标签页
   */
  private switchTab(tabName: string): void {
    // 更新标签页状态
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`)?.classList.add('active');

    this.currentTab = tabName;
  }

  /**
   * 开始抓取
   */
  private async startScraping(): Promise<void> {
    try {
      await this.sendMessage({ type: 'START_SCRAPING' });
      this.showSuccess('抓取已开始');
      await this.loadState();
      this.updateStatusDisplay();
    } catch (error) {
      this.showError('启动抓取失败: ' + error.message);
    }
  }

  /**
   * 停止抓取
   */
  private async stopScraping(): Promise<void> {
    try {
      await this.sendMessage({ type: 'STOP_SCRAPING' });
      this.showSuccess('抓取已停止');
      await this.loadState();
      this.updateStatusDisplay();
    } catch (error) {
      this.showError('停止抓取失败: ' + error.message);
    }
  }

  /**
   * 清除数据
   */
  private async clearData(): Promise<void> {
    if (!confirm('确定要清除所有数据吗？此操作不可撤销。')) {
      return;
    }

    try {
      await this.sendMessage({ type: 'CLEAR_DATA' });
      this.showSuccess('数据已清除');
      await this.loadState();
      this.updateStatusDisplay();
    } catch (error) {
      this.showError('清除数据失败: ' + error.message);
    }
  }

  /**
   * 更新配置
   */
  private updateConfig(): void {
    if (!this.state) return;

    const config: ScrapingConfig = {
      enabled: (document.getElementById('enabled-checkbox') as HTMLInputElement).checked,
      schedule: {
        startTime: (document.getElementById('start-time') as HTMLInputElement).value,
        endTime: (document.getElementById('end-time') as HTMLInputElement).value,
        days: Array.from(document.querySelectorAll('#schedule-days input[type="checkbox"]:checked'))
          .map(cb => parseInt((cb as HTMLInputElement).value))
      },
      blacklist: (document.getElementById('blacklist-textarea') as HTMLTextAreaElement).value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0),
      sensitiveFilters: {
        enabled: (document.getElementById('sensitive-filters-enabled') as HTMLInputElement).checked,
        patterns: (document.getElementById('sensitive-patterns') as HTMLTextAreaElement).value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0),
        replacement: (document.getElementById('sensitive-replacement') as HTMLInputElement).value
      },
      maxContentLength: parseInt((document.getElementById('max-content-length') as HTMLInputElement).value),
      delayBetweenPages: parseInt((document.getElementById('delay-between-pages') as HTMLInputElement).value)
    };

    this.state.currentConfig = config;
  }

  /**
   * 更新存储配置
   */
  private updateMemoryConfig(): void {
    if (!this.state) return;

    const memoryConfig: MemoryConfig = {
      provider: (document.getElementById('memory-provider') as HTMLSelectElement).value as any,
      endpoint: (document.getElementById('memory-endpoint') as HTMLInputElement).value,
      apiKey: (document.getElementById('memory-api-key') as HTMLInputElement).value,
      options: {
        collection: (document.getElementById('memory-collection') as HTMLInputElement).value
      }
    };

    this.state.memoryConfig = memoryConfig;
  }

  /**
   * 保存配置
   */
  private async saveConfig(): Promise<void> {
    try {
      this.updateConfig();
      this.updateMemoryConfig();

      if (this.state) {
        await this.sendMessage({ type: 'UPDATE_CONFIG', config: this.state.currentConfig });
        await this.sendMessage({ type: 'UPDATE_MEMORY_CONFIG', config: this.state.memoryConfig });
        this.showSuccess('配置已保存');
      }
    } catch (error) {
      this.showError('保存配置失败: ' + error.message);
    }
  }

  /**
   * 发送消息到后台脚本
   */
  private async sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * 隐藏加载状态
   */
  private hideLoading(): void {
    document.getElementById('loading')?.style.setProperty('display', 'none');
    document.getElementById('main-content')?.style.setProperty('display', 'block');
  }

  /**
   * 显示错误信息
   */
  private showError(message: string): void {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * 显示成功信息
   */
  private showSuccess(message: string): void {
    // 简单的成功提示，可以后续优化
    console.log('Success:', message);
  }
}

// 启动弹出页面控制器
new PopupController();

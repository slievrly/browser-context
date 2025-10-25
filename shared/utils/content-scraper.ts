/**
 * 网页内容抓取器
 * 用于抓取和解析网页内容
 */

import * as cheerio from 'cheerio';
import { WebPageContent } from '../types';

export class ContentScraper {
  private maxContentLength: number = 10000;
  private delayBetweenPages: number = 1000;

  constructor(maxContentLength: number = 10000, delayBetweenPages: number = 1000) {
    this.maxContentLength = maxContentLength;
    this.delayBetweenPages = delayBetweenPages;
  }

  /**
   * 抓取当前页面内容
   */
  async scrapeCurrentPage(): Promise<WebPageContent | null> {
    try {
      const url = window.location.href;
      const title = document.title;
      
      // 等待页面完全加载
      await this.waitForPageLoad();
      
      // 抓取主要内容
      const content = this.extractMainContent();
      
      // 提取元数据
      const metadata = this.extractMetadata();
      
      // 获取域名
      const domain = this.extractDomain(url);

      const pageContent: WebPageContent = {
        url,
        title,
        content: content.substring(0, this.maxContentLength),
        timestamp: Date.now(),
        domain,
        metadata
      };

      return pageContent;
    } catch (error) {
      console.error('抓取页面内容失败:', error);
      return null;
    }
  }

  /**
   * 等待页面完全加载
   */
  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }

      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    });
  }

  /**
   * 提取主要内容
   */
  private extractMainContent(): string {
    // 尝试多种选择器来获取主要内容
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '#content',
      '.container'
    ];

    let content = '';
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = this.cleanText(element.textContent || '');
        if (content.length > 100) { // 如果内容足够长，使用它
          break;
        }
      }
    }

    // 如果没有找到合适的内容，使用body
    if (!content || content.length < 100) {
      const body = document.body;
      if (body) {
        // 移除脚本和样式标签
        const clone = body.cloneNode(true) as HTMLElement;
        const scripts = clone.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        
        content = this.cleanText(clone.textContent || '');
      }
    }

    return content;
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/\n\s*\n/g, '\n') // 合并多个换行
      .trim();
  }

  /**
   * 提取元数据
   */
  private extractMetadata(): WebPageContent['metadata'] {
    const metadata: WebPageContent['metadata'] = {};

    // 描述
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (description) {
      metadata.description = description;
    }

    // 关键词
    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    if (keywords) {
      metadata.keywords = keywords.split(',').map(k => k.trim());
    }

    // 作者
    const author = document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                  document.querySelector('[rel="author"]')?.textContent;
    if (author) {
      metadata.author = author;
    }

    // 发布日期
    const publishedDate = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                         document.querySelector('time[datetime]')?.getAttribute('datetime');
    if (publishedDate) {
      metadata.publishedDate = publishedDate;
    }

    // 语言
    const language = document.documentElement.lang || 
                    document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content');
    if (language) {
      metadata.language = language;
    }

    return metadata;
  }

  /**
   * 提取域名
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * 使用Cheerio解析HTML内容
   */
  static parseWithCheerio(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * 从HTML字符串提取内容
   */
  static extractFromHTML(html: string, url: string): WebPageContent | null {
    try {
      const $ = ContentScraper.parseWithCheerio(html);
      
      const title = $('title').text() || '';
      const content = $('body').text().replace(/\s+/g, ' ').trim();
      
      const metadata: WebPageContent['metadata'] = {};
      
      // 提取元数据
      const description = $('meta[name="description"]').attr('content');
      if (description) metadata.description = description;
      
      const keywords = $('meta[name="keywords"]').attr('content');
      if (keywords) metadata.keywords = keywords.split(',').map(k => k.trim());
      
      const author = $('meta[name="author"]').attr('content') || $('[rel="author"]').text();
      if (author) metadata.author = author;
      
      const publishedDate = $('meta[property="article:published_time"]').attr('content') || 
                           $('time[datetime]').attr('datetime');
      if (publishedDate) metadata.publishedDate = publishedDate;
      
      const language = $('html').attr('lang') || 
                      $('meta[http-equiv="content-language"]').attr('content');
      if (language) metadata.language = language;

      return {
        url,
        title,
        content: content.substring(0, 10000),
        timestamp: Date.now(),
        domain: new URL(url).hostname,
        metadata
      };
    } catch (error) {
      console.error('解析HTML失败:', error);
      return null;
    }
  }

  /**
   * 设置最大内容长度
   */
  setMaxContentLength(length: number): void {
    this.maxContentLength = length;
  }

  /**
   * 设置页面间延迟
   */
  setDelayBetweenPages(delay: number): void {
    this.delayBetweenPages = delay;
  }

  /**
   * 获取配置
   */
  getConfig(): { maxContentLength: number; delayBetweenPages: number } {
    return {
      maxContentLength: this.maxContentLength,
      delayBetweenPages: this.delayBetweenPages
    };
  }
}

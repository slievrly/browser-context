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
    this.setMaxContentLength(maxContentLength);
    this.setDelayBetweenPages(delayBetweenPages);
  }
  
  /**
   * 验证最大内容长度
   */
  private validateMaxContentLength(length: number): void {
    if (length < 0) {
      throw new Error('Max content length must be non-negative');
    }
    if (length > 1000000) {
      console.warn('Max content length is very large, this may impact performance');
    }
  }
  
  /**
   * 验证页面间延迟
   */
  private validateDelayBetweenPages(delay: number): void {
    if (delay < 0) {
      throw new Error('Delay between pages must be non-negative');
    }
    if (delay > 60000) {
      console.warn('Delay between pages is very large: ' + delay + 'ms');
    }
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
  private async waitForPageLoad(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          console.warn('Page load timeout after ' + timeout + 'ms');
          resolve(); // 超时后继续执行，不阻断流程
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
    try {
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
        try {
          const element = document.querySelector(selector);
          if (element) {
            content = this.cleanText(element.textContent || '');
            if (content.length > 100) { // 如果内容足够长，使用它
              break;
            }
          }
        } catch (error) {
          console.warn(`Error selecting ${selector}:`, error);
        }
      }

      // 如果没有找到合适的内容，使用body
      if (!content || content.length < 100) {
        const body = document.body;
        if (body) {
          // 移除脚本和样式标签
          const clone = body.cloneNode(true) as HTMLElement;
          const scripts = clone.querySelectorAll('script, style, noscript, iframe, object, embed');
          scripts.forEach(el => el.remove());
          
          content = this.cleanText(clone.textContent || '');
        }
      }

      return content || '';
    } catch (error) {
      console.error('Error extracting main content:', error);
      return '';
    }
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/\n\s*\n/g, '\n') // 合并多个换行
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
      .trim();
  }

  /**
   * 提取元数据
   */
  private extractMetadata(): WebPageContent['metadata'] {
    const metadata: WebPageContent['metadata'] = {};

    try {
      // 描述
      try {
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
        if (description && description.trim()) {
          metadata.description = description.trim();
        }
      } catch (error) {
        console.warn('Error extracting description:', error);
      }

      // 关键词
      try {
        const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
        if (keywords && keywords.trim()) {
          metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        }
      } catch (error) {
        console.warn('Error extracting keywords:', error);
      }

      // 作者
      try {
        const author = document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                      document.querySelector('[rel="author"]')?.textContent;
        if (author && author.trim()) {
          metadata.author = author.trim();
        }
      } catch (error) {
        console.warn('Error extracting author:', error);
      }

      // 发布日期
      try {
        const publishedDate = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                             document.querySelector('meta[property="og:published_time"]')?.getAttribute('content') ||
                             document.querySelector('time[datetime]')?.getAttribute('datetime');
        if (publishedDate && publishedDate.trim()) {
          metadata.publishedDate = publishedDate.trim();
        }
      } catch (error) {
        console.warn('Error extracting published date:', error);
      }

      // 语言
      try {
        const language = document.documentElement?.lang || 
                        document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') ||
                        document.querySelector('html')?.getAttribute('lang');
        if (language && language.trim()) {
          metadata.language = language.trim();
        }
      } catch (error) {
        console.warn('Error extracting language:', error);
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
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
    this.validateMaxContentLength(length);
    this.maxContentLength = length;
  }

  /**
   * 设置页面间延迟
   */
  setDelayBetweenPages(delay: number): void {
    this.validateDelayBetweenPages(delay);
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

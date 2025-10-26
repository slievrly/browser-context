/**
 * URL匹配工具类
 * 用于检查URL是否匹配黑名单模式
 */

export class URLMatcher {
  private patterns: string[] = [];

  constructor(patterns: string[] = []) {
    this.patterns = patterns;
  }

  /**
   * 更新黑名单模式
   */
  updatePatterns(patterns: string[]): void {
    if (!Array.isArray(patterns)) {
      throw new Error('Patterns must be an array');
    }
    
    // 过滤掉无效的模式
    this.patterns = patterns.filter(pattern => {
      if (typeof pattern !== 'string') {
        console.warn(`Invalid pattern type: ${typeof pattern}`);
        return false;
      }
      
      const trimmed = pattern.trim();
      if (trimmed.length === 0) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 检查URL是否匹配黑名单
   */
  isBlacklisted(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    if (this.patterns.length === 0) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const pathname = urlObj.pathname;

      return this.patterns.some(pattern => {
        // 支持通配符匹配
        if (pattern.includes('*')) {
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
          const regex = new RegExp(`^${regexPattern}$`, 'i');
          return regex.test(domain) || regex.test(url);
        }

        // 精确匹配
        if (pattern.startsWith('http')) {
          return url.includes(pattern);
        }

        // 域名匹配
        if (pattern.startsWith('.')) {
          return domain.endsWith(pattern);
        }

        // 路径匹配
        if (pattern.startsWith('/')) {
          return pathname.startsWith(pattern);
        }

        // 包含匹配
        return url.includes(pattern);
      });
    } catch (error) {
      console.error('URL匹配错误:', error);
      return false;
    }
  }

  /**
   * 获取匹配的模式
   */
  getMatchingPattern(url: string): string | null {
    for (const pattern of this.patterns) {
      if (this.isBlacklisted(url)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * 验证模式格式
   */
  static validatePattern(pattern: string): boolean {
    try {
      if (pattern.includes('*')) {
        new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*'));
      }
      return true;
    } catch {
      return false;
    }
  }
}

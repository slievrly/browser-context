/**
 * 敏感信息过滤工具类
 * 用于过滤和替换网页内容中的敏感信息
 */

export class SensitiveFilter {
  private patterns: RegExp[] = [];
  private replacement: string = '[FILTERED]';

  constructor(patterns: string[] = [], replacement: string = '[FILTERED]') {
    this.updatePatterns(patterns);
    this.replacement = replacement;
  }

  /**
   * 更新敏感信息模式
   */
  updatePatterns(patterns: string[]): void {
    this.patterns = patterns.map(pattern => {
      try {
        return new RegExp(pattern, 'gi');
      } catch (error) {
        console.warn(`无效的正则表达式: ${pattern}`, error);
        return null;
      }
    }).filter(Boolean) as RegExp[];
  }

  /**
   * 设置替换文本
   */
  setReplacement(replacement: string): void {
    this.replacement = replacement;
  }

  /**
   * 过滤敏感信息
   */
  filter(content: string): string {
    if (this.patterns.length === 0) {
      return content;
    }

    let filteredContent = content;

    this.patterns.forEach(pattern => {
      filteredContent = filteredContent.replace(pattern, this.replacement);
    });

    return filteredContent;
  }

  /**
   * 检查内容是否包含敏感信息
   */
  hasSensitiveInfo(content: string): boolean {
    return this.patterns.some(pattern => pattern.test(content));
  }

  /**
   * 获取匹配的敏感信息
   */
  getSensitiveMatches(content: string): string[] {
    const matches: string[] = [];
    
    this.patterns.forEach(pattern => {
      const patternMatches = content.match(pattern);
      if (patternMatches) {
        matches.push(...patternMatches);
      }
    });

    return [...new Set(matches)]; // 去重
  }

  /**
   * 预定义的敏感信息模式
   */
  static getDefaultPatterns(): string[] {
    return [
      // 邮箱地址
      '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
      
      // 手机号码 (中国)
      '\\b1[3-9]\\d{9}\\b',
      
      // 身份证号码 (中国)
      '\\b\\d{17}[\\dXx]\\b',
      
      // 银行卡号
      '\\b\\d{16,19}\\b',
      
      // 信用卡号
      '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
      
      // 密码字段
      '(?i)(password|pwd|pass|secret|key)\\s*[:=]\\s*[^\\s]+',
      
      // API密钥
      '(?i)(api[_-]?key|access[_-]?token|secret[_-]?key)\\s*[:=]\\s*[^\\s]+',
      
      // IP地址
      '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b',
      
      // 社会安全号码 (美国)
      '\\b\\d{3}-\\d{2}-\\d{4}\\b',
      
      // 车牌号码 (中国)
      '\\b[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}\\b'
    ];
  }
}

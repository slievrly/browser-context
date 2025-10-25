/**
 * Sensitive filter tests
 */

import { SensitiveFilter } from '../shared/utils/sensitive-filter';

describe('SensitiveFilter', () => {
  let filter: SensitiveFilter;

  beforeEach(() => {
    filter = new SensitiveFilter();
  });

  test('should filter email addresses', () => {
    const patterns = ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'];
    filter.updatePatterns(patterns);
    
    const content = 'Contact us at john@example.com for more information';
    const filtered = filter.filter(content);
    expect(filtered).toBe('Contact us at [FILTERED] for more information');
  });

  test('should filter phone numbers', () => {
    const patterns = ['\\b1[3-9]\\d{9}\\b'];
    filter.updatePatterns(patterns);
    
    const content = 'Call us at 13812345678 for support';
    const filtered = filter.filter(content);
    expect(filtered).toBe('Call us at [FILTERED] for support');
  });

  test('should filter credit card numbers', () => {
    const patterns = ['\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b'];
    filter.updatePatterns(patterns);
    
    const content = 'Card number: 1234-5678-9012-3456';
    const filtered = filter.filter(content);
    expect(filtered).toBe('Card number: [FILTERed]');
  });

  test('should filter multiple patterns', () => {
    const patterns = [
      '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
      '\\b1[3-9]\\d{9}\\b'
    ];
    filter.updatePatterns(patterns);
    
    const content = 'Email: john@example.com, Phone: 13812345678';
    const filtered = filter.filter(content);
    expect(filtered).toBe('Email: [FILTERED], Phone: [FILTERED]');
  });

  test('should use custom replacement text', () => {
    const patterns = ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'];
    filter.updatePatterns(patterns);
    filter.setReplacement('***REDACTED***');
    
    const content = 'Email: john@example.com';
    const filtered = filter.filter(content);
    expect(filtered).toBe('Email: ***REDACTED***');
  });

  test('should handle case insensitive matching', () => {
    const patterns = ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'];
    filter.updatePatterns(patterns);
    
    const content = 'Email: JOHN@EXAMPLE.COM';
    const filtered = filter.filter(content);
    expect(filtered).toBe('Email: [FILTERED]');
  });

  test('should detect sensitive information', () => {
    const patterns = ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'];
    filter.updatePatterns(patterns);
    
    expect(filter.hasSensitiveInfo('Contact john@example.com')).toBe(true);
    expect(filter.hasSensitiveInfo('No sensitive info here')).toBe(false);
  });

  test('should get sensitive matches', () => {
    const patterns = ['\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'];
    filter.updatePatterns(patterns);
    
    const content = 'Email: john@example.com and jane@test.org';
    const matches = filter.getSensitiveMatches(content);
    expect(matches).toContain('john@example.com');
    expect(matches).toContain('jane@test.org');
  });

  test('should handle empty patterns', () => {
    filter.updatePatterns([]);
    
    const content = 'This content should not be filtered';
    const filtered = filter.filter(content);
    expect(filtered).toBe(content);
  });

  test('should handle invalid regex patterns gracefully', () => {
    const patterns = ['valid@email.com', '[invalid[regex'];
    filter.updatePatterns(patterns);
    
    const content = 'Email: valid@email.com';
    const filtered = filter.filter(content);
    expect(filtered).toBe('Email: [FILTERED]');
  });

  test('should get default patterns', () => {
    const defaultPatterns = SensitiveFilter.getDefaultPatterns();
    expect(Array.isArray(defaultPatterns)).toBe(true);
    expect(defaultPatterns.length).toBeGreaterThan(0);
  });
});

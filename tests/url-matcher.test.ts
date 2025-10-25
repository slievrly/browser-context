/**
 * URL matcher tests
 */

import { URLMatcher } from '../shared/utils/url-matcher';

describe('URLMatcher', () => {
  let matcher: URLMatcher;

  beforeEach(() => {
    matcher = new URLMatcher();
  });

  test('should match exact URL patterns', () => {
    matcher.updatePatterns(['https://example.com', 'https://test.com']);
    
    expect(matcher.isBlacklisted('https://example.com')).toBe(true);
    expect(matcher.isBlacklisted('https://test.com')).toBe(true);
    expect(matcher.isBlacklisted('https://other.com')).toBe(false);
  });

  test('should match wildcard patterns', () => {
    matcher.updatePatterns(['*.example.com', '*.test.*']);
    
    expect(matcher.isBlacklisted('https://sub.example.com')).toBe(true);
    expect(matcher.isBlacklisted('https://another.example.com')).toBe(true);
    expect(matcher.isBlacklisted('https://test.org')).toBe(true);
    expect(matcher.isBlacklisted('https://other.com')).toBe(false);
  });

  test('should match domain patterns', () => {
    matcher.updatePatterns(['.example.com', '.test.org']);
    
    expect(matcher.isBlacklisted('https://sub.example.com')).toBe(true);
    expect(matcher.isBlacklisted('https://example.com')).toBe(true);
    expect(matcher.isBlacklisted('https://test.org')).toBe(true);
    expect(matcher.isBlacklisted('https://other.com')).toBe(false);
  });

  test('should match path patterns', () => {
    matcher.updatePatterns(['/admin/*', '/api/*']);
    
    expect(matcher.isBlacklisted('https://example.com/admin/users')).toBe(true);
    expect(matcher.isBlacklisted('https://example.com/api/data')).toBe(true);
    expect(matcher.isBlacklisted('https://example.com/public/page')).toBe(false);
  });

  test('should match partial URL patterns', () => {
    matcher.updatePatterns(['login', 'admin']);
    
    expect(matcher.isBlacklisted('https://example.com/login')).toBe(true);
    expect(matcher.isBlacklisted('https://example.com/admin')).toBe(true);
    expect(matcher.isBlacklisted('https://example.com/dashboard')).toBe(false);
  });

  test('should handle empty patterns', () => {
    matcher.updatePatterns([]);
    
    expect(matcher.isBlacklisted('https://example.com')).toBe(false);
    expect(matcher.isBlacklisted('https://any-url.com')).toBe(false);
  });

  test('should handle invalid URLs gracefully', () => {
    matcher.updatePatterns(['*.example.com']);
    
    expect(matcher.isBlacklisted('invalid-url')).toBe(false);
    expect(matcher.isBlacklisted('')).toBe(false);
  });

  test('should get matching pattern', () => {
    matcher.updatePatterns(['*.example.com', '*.test.com']);
    
    const pattern = matcher.getMatchingPattern('https://sub.example.com');
    expect(pattern).toBe('*.example.com');
  });

  test('should validate pattern format', () => {
    expect(URLMatcher.validatePattern('*.example.com')).toBe(true);
    expect(URLMatcher.validatePattern('https://example.com')).toBe(true);
    expect(URLMatcher.validatePattern('invalid[pattern')).toBe(false);
  });
});

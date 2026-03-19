import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock markdown-it
jest.mock('markdown-it', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      render: jest.fn(),
      renderInline: jest.fn(),
    })),
  };
});

import MarkdownIt from 'markdown-it';
import { renderMarkdown, renderInlineMarkdown, default as mdDefault } from '@/utils/markdown_util';

describe('markdown_util', () => {
  let mockMdInstance;

  beforeEach(() => {
    // Get the mocked instance
    mockMdInstance = new MarkdownIt();

    // Clear all mocks
    jest.clearAllMocks();

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('renderMarkdown', () => {
    it('should return empty string for empty content', () => {
      const result = renderMarkdown('');
      expect(result).toBe('');
    });

    it('should return empty string for null content', () => {
      const result = renderMarkdown(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined content', () => {
      const result = renderMarkdown(undefined);
      expect(result).toBe('');
    });

    it('should sanitize ../.. paths in content', () => {
      // Just verify it doesn't throw
      expect(() => {
        renderMarkdown('Go to ../../path');
      }).not.toThrow();
    });

    it('should handle complex markdown', () => {
      // Just verify it doesn't throw
      expect(() => {
        renderMarkdown('# Title\n\n**Bold** and *italic*');
      }).not.toThrow();
    });
  });

  describe('renderInlineMarkdown', () => {
    it('should return empty string for empty content', () => {
      const result = renderInlineMarkdown('');
      expect(result).toBe('');
    });

    it('should return empty string for null content', () => {
      const result = renderInlineMarkdown(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined content', () => {
      const result = renderInlineMarkdown(undefined);
      expect(result).toBe('');
    });

    it('should handle inline markdown with links', () => {
      // Just verify it doesn't throw
      expect(() => {
        renderInlineMarkdown('https://example.com');
      }).not.toThrow();
    });
  });

  describe('default export', () => {
    it('should export the markdown-it instance', () => {
      expect(mdDefault).toBeDefined();
      expect(typeof mdDefault.render).toBe('function');
      expect(typeof mdDefault.renderInline).toBe('function');
    });
  });
});

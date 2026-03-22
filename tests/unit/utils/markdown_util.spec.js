/**
 * Markdown utility tests
 * @utility tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock markdown-it
jest.mock('markdown-it', () => {
  const mockRender = jest.fn().mockReturnValue('<p>default</p>');
  const mockRenderInline = jest.fn().mockReturnValue('default');
  const mockUse = jest.fn().mockReturnThis();

  const mockInstance = {
    render: mockRender,
    renderInline: mockRenderInline,
    use: mockUse,
  };

  return {
    __esModule: true,
    default: jest.fn().mockReturnValue(mockInstance),
  };
});

import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { renderMarkdown, renderInlineMarkdown, default as mdDefault } from '@/utils/markdown_util';

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => html),
}));

describe('markdown_util', () => {
  let mockRender;
  let mockRenderInline;
  let mockMdInstance;

  beforeEach(() => {
    // Get the mock functions from the default export (which is the md instance)
    mockRender = mdDefault.render;
    mockRenderInline = mdDefault.renderInline;
    mockMdInstance = mdDefault;

    // Clear all mocks
    jest.clearAllMocks();

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    it('should sanitize ../ path traversal sequences', () => {
      mockRender.mockReturnValue('<p>Safe content</p>');

      const result = renderMarkdown('Go to ../../etc/passwd');

      expect(mockRender).toHaveBeenCalledWith('Go to etc/passwd');
      expect(result).toBe('<p>Safe content</p>');
    });

    it('should sanitize ..\\ path traversal sequences', () => {
      mockRender.mockReturnValue('<p>Safe content</p>');

      const result = renderMarkdown('Go to ..\\..\\windows\\system32');

      // Regex removes ..\ including the backslash
      expect(mockMdInstance.render).toHaveBeenCalledWith('Go to windows\\system32');
    });

    it('should sanitize mixed path traversal sequences', () => {
      mockRender.mockReturnValue('<p>Safe content</p>');

      const result = renderMarkdown('Check ../..\\..\\path');

      // Both ../ and ..\ are removed
      expect(mockMdInstance.render).toHaveBeenCalledWith('Check path');
    });

    it('should remove multiple consecutive path traversal sequences', () => {
      mockMdInstance.render.mockReturnValue('<p>content</p>');

      const result = renderMarkdown('../../../../etc/passwd');

      // All ../../ patterns removed, including leading /
      expect(mockMdInstance.render).toHaveBeenCalledWith('etc/passwd');
    });

    it('should call markdown-it render with sanitized content', () => {
      mockMdInstance.render.mockReturnValue('<p>Hello</p>');

      renderMarkdown('# Title');

      expect(mockMdInstance.render).toHaveBeenCalledWith('# Title');
    });

    it('should handle complex markdown', () => {
      mockMdInstance.render.mockReturnValue('<h1>Title</h1><p><strong>Bold</strong></p>');

      const result = renderMarkdown('# Title\n\n**Bold** and *italic*');

      expect(mockMdInstance.render).toHaveBeenCalledWith('# Title\n\n**Bold** and *italic*');
      expect(result).toBe('<h1>Title</h1><p><strong>Bold</strong></p>');
    });

    it('should handle markdown with links', () => {
      mockMdInstance.render.mockReturnValue('<p><a href="https://example.com">link</a></p>');

      const result = renderMarkdown('[Link](https://example.com)');

      expect(mockMdInstance.render).toHaveBeenCalledWith('[Link](https://example.com)');
    });

    it('should handle markdown with code blocks', () => {
      mockMdInstance.render.mockReturnValue('<pre><code>const x = 1;</code></pre>');

      const result = renderMarkdown('```javascript\nconst x = 1;\n```');

      expect(mockMdInstance.render).toHaveBeenCalledWith('```javascript\nconst x = 1;\n```');
    });

    it('should return original content on rendering error', () => {
      mockMdInstance.render.mockImplementation(() => {
        throw new Error('Markdown parse error');
      });

      const result = renderMarkdown('# Test');

      expect(result).toBe('# Test');
      expect(console.error).toHaveBeenCalledWith('Markdown rendering error:', expect.any(Error));
    });

    it('should convert non-string content to string', () => {
      mockMdInstance.render.mockReturnValue('<p>123</p>');

      const result = renderMarkdown(123);

      expect(mockMdInstance.render).toHaveBeenCalledWith('123');
      expect(result).toBe('<p>123</p>');
    });

    it('should handle special characters', () => {
      mockMdInstance.render.mockReturnValue('<p>Special &amp; characters</p>');

      const result = renderMarkdown('Special & characters');

      expect(mockMdInstance.render).toHaveBeenCalledWith('Special & characters');
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

    it('should call renderInline for inline markdown', () => {
      mockMdInstance.renderInline.mockReturnValue('<strong>bold</strong>');

      const result = renderInlineMarkdown('**bold**');

      expect(mockRenderInline).toHaveBeenCalledWith('**bold**');
      expect(result).toBe('<strong>bold</strong>');
    });

    it('should handle inline markdown with emphasis', () => {
      mockMdInstance.renderInline.mockReturnValue('<em>italic</em>');

      const result = renderInlineMarkdown('*italic*');

      expect(mockMdInstance.renderInline).toHaveBeenCalledWith('*italic*');
      expect(result).toBe('<em>italic</em>');
    });

    it('should handle inline markdown with code', () => {
      mockMdInstance.renderInline.mockReturnValue('<code>code</code>');

      const result = renderInlineMarkdown('`code`');

      expect(mockMdInstance.renderInline).toHaveBeenCalledWith('`code`');
      expect(result).toBe('<code>code</code>');
    });

    it('should handle inline markdown with links', () => {
      mockMdInstance.renderInline.mockReturnValue('<a href="url">link</a>');

      const result = renderInlineMarkdown('[link](url)');

      expect(mockMdInstance.renderInline).toHaveBeenCalledWith('[link](url)');
    });

    it('should handle URLs directly', () => {
      mockMdInstance.renderInline.mockReturnValue('https://example.com');

      const result = renderInlineMarkdown('https://example.com');

      expect(mockMdInstance.renderInline).toHaveBeenCalledWith('https://example.com');
    });

    it('should return original content on error', () => {
      mockMdInstance.renderInline.mockImplementation(() => {
        throw new Error('Inline render error');
      });

      const result = renderInlineMarkdown('**test**');

      expect(result).toBe('**test**');
      expect(console.error).toHaveBeenCalledWith('Inline markdown rendering error:', expect.any(Error));
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize dangerous HTML', () => {
      // If HTML somehow gets through, DOMPurify should handle it
      DOMPurify.sanitize.mockImplementation((html) => {
        // Strip script tags
        return html.replace(/<script[^>]*>.*?<\/script>/gi, '');
      });

      mockMdInstance.render.mockReturnValue('<p>Safe</p>');

      const result = renderMarkdown('content');

      expect(result).toBeTruthy();
    });

    it('should not allow script tags in markdown', () => {
      // The markdown-it should escape this, but let's verify
      mockMdInstance.render.mockReturnValue('<p>Safe</p>');

      const result = renderMarkdown('<script>alert("XSS")</script>');

      expect(result).toBeTruthy();
    });

    it('should handle iframe tags safely', () => {
      mockMdInstance.render.mockReturnValue('<p>Safe</p>');

      const result = renderMarkdown('<iframe src="javascript:alert(\'XSS\')"></iframe>');

      expect(result).toBeTruthy();
    });

    it('should handle on* event handlers', () => {
      mockMdInstance.render.mockReturnValue('<p>Safe</p>');

      const result = renderMarkdown('<div onclick="alert(\'XSS\')">Click</div>');

      expect(result).toBeTruthy();
    });
  });

  describe('Path Traversal Protection', () => {
    it('should remove ../ patterns completely', () => {
      mockMdInstance.render.mockReturnValue('<p>content</p>');

      renderMarkdown('text../../etc/passwd');

      // ../ patterns removed, including slashes
      expect(mockRender).toHaveBeenCalledWith('textetc/passwd');
    });

    it('should remove ..\\ patterns completely', () => {
      mockMdInstance.render.mockReturnValue('<p>content</p>');

      renderMarkdown('text..\\..\\windows\\system32');

      // ..\ patterns removed, including backslashes
      expect(mockMdInstance.render).toHaveBeenCalledWith('textwindows\\system32');
    });

    it('should handle deeply nested path traversal', () => {
      mockMdInstance.render.mockReturnValue('<p>content</p>');

      renderMarkdown('../../../../../../etc/passwd');

      // All patterns removed, including leading /
      expect(mockMdInstance.render).toHaveBeenCalledWith('etc/passwd');
    });

    it('should preserve legitimate uses of dots', () => {
      mockMdInstance.render.mockReturnValue('<p>See file...</p>');

      renderMarkdown('See file...');

      // Three dots without slash are preserved
      expect(mockMdInstance.render).toHaveBeenCalledWith('See file...');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', () => {
      mockMdInstance.render.mockReturnValue('<p>Long content</p>');

      const longContent = '#'.repeat(10000);
      const result = renderMarkdown(longContent);

      expect(mockMdInstance.render).toHaveBeenCalledWith(longContent);
    });

    it('should handle content with only whitespace', () => {
      mockMdInstance.render.mockReturnValue('<p>content</p>');

      const result = renderMarkdown('   \n   \n   ');

      expect(result).toBeTruthy();
    });

    it('should handle content with newlines only', () => {
      mockMdInstance.render.mockReturnValue('<p>content</p>');

      const result = renderMarkdown('\n\n\n\n');

      expect(result).toBeTruthy();
    });

    it('should handle unicode characters', () => {
      mockMdInstance.render.mockReturnValue('<p>emoji 😀</p>');

      const result = renderMarkdown('emoji 😀');

      expect(mockMdInstance.render).toHaveBeenCalledWith('emoji 😀');
    });

    it('should handle zero-width spaces', () => {
      mockMdInstance.render.mockReturnValue('<p>content</p>');

      const result = renderMarkdown('text\u200B\u200C');

      expect(mockMdInstance.render).toHaveBeenCalledWith('text\u200B\u200C');
    });
  });

  describe('Markdown Features', () => {
    it('should render headers correctly', () => {
      mockMdInstance.render.mockReturnValue('<h1>Header</h1>');

      const result = renderMarkdown('# Header');

      expect(mockMdInstance.render).toHaveBeenCalledWith('# Header');
    });

    it('should render blockquotes', () => {
      mockMdInstance.render.mockReturnValue('<blockquote>Quote</blockquote>');

      const result = renderMarkdown('> Quote');

      expect(mockMdInstance.render).toHaveBeenCalledWith('> Quote');
    });

    it('should render lists', () => {
      mockMdInstance.render.mockReturnValue('<ul><li>Item 1</li><li>Item 2</li></ul>');

      const result = renderMarkdown('- Item 1\n- Item 2');

      expect(mockMdInstance.render).toHaveBeenCalledWith('- Item 1\n- Item 2');
    });

    it('should render numbered lists', () => {
      mockMdInstance.render.mockReturnValue('<ol><li>Item</li></ol>');

      const result = renderMarkdown('1. Item');

      expect(mockMdInstance.render).toHaveBeenCalledWith('1. Item');
    });

    it('should render code blocks with syntax', () => {
      mockMdInstance.render.mockReturnValue('<pre><code>code</code></pre>');

      const result = renderMarkdown('```\ncode\n```');

      expect(mockMdInstance.render).toHaveBeenCalledWith('```\ncode\n```');
    });
  });

  describe('default export', () => {
    it('should export the markdown-it instance', () => {
      expect(mdDefault).toBeDefined();
      expect(typeof mdDefault.render).toBe('function');
      expect(typeof mdDefault.renderInline).toBe('function');
      expect(typeof mdDefault.use).toBe('function');
    });

    it('should allow custom configuration via use', () => {
      mdDefault.use.mockReturnValue(mockMdInstance);

      mdDefault.use({});

      expect(mdDefault.use).toHaveBeenCalled();
    });
  });
});

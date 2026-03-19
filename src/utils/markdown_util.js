import MarkdownIt from 'markdown-it';

// Configure markdown-it
const md = new MarkdownIt({
  html: false, // Disable HTML tags in source
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement and quotes beautification
  breaks: true, // Convert \n to <br>
  quotes: '""\'\'', // Smart quotes
});

/**
 * Render markdown content to HTML
 * @param {string} content - Markdown content
 * @returns {string} Rendered HTML
 */
export function renderMarkdown(content) {
  if (!content) return '';

  try {
    const sanitizedContent = String(content).replace(/\.\.\/|\.\.\\/g, '');
    return md.render(sanitizedContent);
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return content; // Return original content if rendering fails
  }
}

/**
 * Render inline markdown (no block elements)
 * @param {string} content - Inline markdown content
 * @returns {string} Rendered HTML
 */
export function renderInlineMarkdown(content) {
  if (!content) return '';

  try {
    return md.renderInline(content);
  } catch (error) {
    console.error('Inline markdown rendering error:', error);
    return content;
  }
}

export default md;

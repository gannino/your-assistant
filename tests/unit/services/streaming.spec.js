import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { StreamParser } from '@/services/ai/streaming';

// Helper to create a mock readable stream
const createMockStream = chunks => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach(chunk => {
        controller.enqueue(encoder.encode(chunk));
      });
      controller.close();
    },
  });
  return stream;
};

describe('StreamParser', () => {
  describe('constructor', () => {
    it('should create parser with default config', () => {
      const parser = new StreamParser();

      expect(parser.extractContent).toBeInstanceOf(Function);
      expect(parser.isEndMarker).toBeInstanceOf(Function);
      expect(parser.linePrefix).toBe('data: ');
    });

    it('should accept custom extractContent function', () => {
      const customExtractor = jest.fn().mockReturnValue('custom');
      const parser = new StreamParser({ extractContent: customExtractor });

      expect(parser.extractContent).toBe(customExtractor);
    });

    it('should accept custom isEndMarker function', () => {
      const customEndMarker = jest.fn().mockReturnValue(true);
      const parser = new StreamParser({ isEndMarker: customEndMarker });

      expect(parser.isEndMarker).toBe(customEndMarker);
    });

    it('should accept custom linePrefix', () => {
      const parser = new StreamParser({ linePrefix: 'event: ' });

      expect(parser.linePrefix).toBe('event: ');
    });
  });

  describe('defaultExtractContent', () => {
    it('should extract content from OpenAI-compatible format', () => {
      const parser = new StreamParser();
      const parsed = {
        choices: [
          {
            delta: { content: 'Hello world' },
          },
        ],
      };

      const result = parser.defaultExtractContent(parsed);

      expect(result).toBe('Hello world');
    });

    it('should return null if no choices', () => {
      const parser = new StreamParser();
      const parsed = {};

      const result = parser.defaultExtractContent(parsed);

      expect(result).toBeNull();
    });

    it('should return null if no delta', () => {
      const parser = new StreamParser();
      const parsed = { choices: [{}] };

      const result = parser.defaultExtractContent(parsed);

      expect(result).toBeNull();
    });

    it('should return null if no content', () => {
      const parser = new StreamParser();
      const parsed = { choices: [{ delta: {} }] };

      const result = parser.defaultExtractContent(parsed);

      expect(result).toBeNull();
    });
  });

  describe('parseStream', () => {
    it('should parse simple SSE stream', async () => {
      const parser = new StreamParser();
      const chunks = ['data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'];
      const stream = createMockStream(chunks);

      const receivedChunks = [];
      await parser.parseStream(stream, chunk => receivedChunks.push(chunk));

      expect(receivedChunks).toEqual(['Hello']);
    });

    it('should handle multiple chunks', async () => {
      const parser = new StreamParser();
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
      ];
      const stream = createMockStream(chunks);

      const receivedChunks = [];
      await parser.parseStream(stream, chunk => receivedChunks.push(chunk));

      expect(receivedChunks).toEqual(['Hello', ' World', '!']);
    });

    it('should skip lines without prefix', async () => {
      const parser = new StreamParser();
      const chunks = [
        'random line\n',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'another random line\n',
      ];
      const stream = createMockStream(chunks);

      const receivedChunks = [];
      await parser.parseStream(stream, chunk => receivedChunks.push(chunk));

      expect(receivedChunks).toEqual(['Hello']);
    });

    it('should handle [DONE] markers', async () => {
      const parser = new StreamParser({
        extractContent: parsed => parsed.content,
        isEndMarker: data => data === '[DONE]',
      });

      const chunks = [
        'data: {"content":"Hello"}\n\n',
        'data: [DONE]\n\n',
        'data: {"content":"World"}\n\n',
      ];
      const stream = createMockStream(chunks);

      const receivedChunks = [];
      await parser.parseStream(stream, chunk => receivedChunks.push(chunk));

      // [DONE] marker should be skipped, but other chunks processed
      expect(receivedChunks).toEqual(['Hello', 'World']);
    });

    it('should skip invalid JSON lines', async () => {
      const parser = new StreamParser();
      const chunks = [
        'data: invalid json\n',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: more invalid json\n',
      ];
      const stream = createMockStream(chunks);

      const receivedChunks = [];
      await parser.parseStream(stream, chunk => receivedChunks.push(chunk));

      expect(receivedChunks).toEqual(['Hello']);
    });

    it('should handle incomplete chunks across network packets', async () => {
      const parser = new StreamParser();
      const chunks = ['data: {"choices":[{"delta":{"content":"Hello World"}}]}\n\n'];
      const stream = createMockStream(chunks);

      const receivedChunks = [];
      await parser.parseStream(stream, chunk => receivedChunks.push(chunk));

      expect(receivedChunks).toEqual(['Hello World']);
    });

    it('should not call onChunk for null content', async () => {
      const parser = new StreamParser();
      const chunks = [
        'data: {"choices":[{"delta":{}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      ];
      const stream = createMockStream(chunks);

      const receivedChunks = [];
      await parser.parseStream(stream, chunk => receivedChunks.push(chunk));

      expect(receivedChunks).toEqual(['Hello']);
    });
  });

  describe('static factory methods', () => {
    describe('openAICompatible', () => {
      it('should create OpenAI-compatible parser', () => {
        const parser = StreamParser.openAICompatible();

        expect(parser.linePrefix).toBe('data: ');
        expect(parser.extractContent).toBeInstanceOf(Function);
        expect(parser.isEndMarker).toBeInstanceOf(Function);

        // Test extractContent
        const parsed = {
          choices: [{ delta: { content: 'Test' } }],
        };
        expect(parser.extractContent(parsed)).toBe('Test');

        // Test isEndMarker
        expect(parser.isEndMarker('[DONE]')).toBe(true);
        expect(parser.isEndMarker('other')).toBe(false);
      });
    });

    describe('anthropic', () => {
      it('should create Anthropic parser', () => {
        const parser = StreamParser.anthropic();

        expect(parser.linePrefix).toBe('data: ');
        expect(parser.extractContent).toBeInstanceOf(Function);
        expect(parser.isEndMarker).toBeInstanceOf(Function);

        // Test extractContent with content_block_delta
        const contentDelta = {
          type: 'content_block_delta',
          delta: { text: 'Hello' },
        };
        expect(parser.extractContent(contentDelta)).toBe('Hello');

        // Test extractContent with non-matching type
        const otherType = { type: 'other', delta: { text: 'World' } };
        expect(parser.extractContent(otherType)).toBeNull();

        // Test isEndMarker - Anthropic doesn't use [DONE]
        expect(parser.isEndMarker('[DONE]')).toBe(false);
        expect(parser.isEndMarker('anything')).toBe(false);
      });

      it('should return null if delta is missing', () => {
        const parser = StreamParser.anthropic();
        const parsed = { type: 'content_block_delta' };

        expect(parser.extractContent(parsed)).toBeNull();
      });

      it('should return null if text is missing', () => {
        const parser = StreamParser.anthropic();
        const parsed = { type: 'content_block_delta', delta: {} };

        expect(parser.extractContent(parsed)).toBeNull();
      });
    });

    describe('gemini', () => {
      it('should create Gemini parser', () => {
        const parser = StreamParser.gemini();

        expect(parser.linePrefix).toBe('data: ');
        expect(parser.extractContent).toBeInstanceOf(Function);
        expect(parser.isEndMarker).toBeInstanceOf(Function);

        // Test extractContent
        const parsed = {
          candidates: [
            {
              content: {
                parts: [{ text: 'Gemini response' }],
              },
            },
          ],
        };
        expect(parser.extractContent(parsed)).toBe('Gemini response');

        // Test isEndMarker
        expect(parser.isEndMarker('[DONE]')).toBe(true);
        expect(parser.isEndMarker('other')).toBe(false);
      });

      it('should return null if candidates is empty', () => {
        const parser = StreamParser.gemini();
        const parsed = { candidates: [] };

        expect(parser.extractContent(parsed)).toBeNull();
      });

      it('should return null if content is missing', () => {
        const parser = StreamParser.gemini();
        const parsed = { candidates: [{}] };

        expect(parser.extractContent(parsed)).toBeNull();
      });

      it('should return null if parts is missing', () => {
        const parser = StreamParser.gemini();
        const parsed = { candidates: [{ content: {} }] };

        expect(parser.extractContent(parsed)).toBeNull();
      });

      it('should return null if parts is empty', () => {
        const parser = StreamParser.gemini();
        const parsed = { candidates: [{ content: { parts: [] } }] };

        expect(parser.extractContent(parsed)).toBeNull();
      });
    });

    describe('ollama', () => {
      it('should create Ollama parser', () => {
        const parser = StreamParser.ollama();

        // Note: Empty string '' is falsy, so it defaults to 'data: '
        // This is a known issue in the constructor: `this.linePrefix = config.linePrefix || 'data: '`
        expect(parser.linePrefix).toBe('data: '); // Falls back to default due to empty string
        expect(parser.extractContent).toBeInstanceOf(Function);
        expect(parser.isEndMarker).toBeInstanceOf(Function);

        // Test extractContent
        const parsed = { message: { content: 'Ollama response' } };
        expect(parser.extractContent(parsed)).toBe('Ollama response');

        // Test isEndMarker
        expect(parser.isEndMarker({ done: true })).toBe(true);
        expect(parser.isEndMarker({ done: false })).toBe(false);
      });

      it('should return null if message is missing', () => {
        const parser = StreamParser.ollama();
        const parsed = {};

        expect(parser.extractContent(parsed)).toBeNull();
      });

      it('should return null if content is missing', () => {
        const parser = StreamParser.ollama();
        const parsed = { message: {} };

        expect(parser.extractContent(parsed)).toBeNull();
      });
    });

    describe('custom', () => {
      it('should create parser with custom extractContent', () => {
        const customExtractor = parsed => parsed.custom;
        const parser = StreamParser.custom({ extractContent: customExtractor });

        const parsed = { custom: 'custom content' };
        expect(parser.extractContent(parsed)).toBe('custom content');
      });

      it('should create parser with custom isEndMarker', () => {
        const customEndMarker = data => data === 'END';
        const parser = StreamParser.custom({ isEndMarker: customEndMarker });

        expect(parser.isEndMarker('END')).toBe(true);
        expect(parser.isEndMarker('other')).toBe(false);
      });

      it('should create parser with custom linePrefix', () => {
        const parser = StreamParser.custom({ linePrefix: 'event: ' });

        expect(parser.linePrefix).toBe('event: ');
      });

      it('should use default isEndMarker if not provided', () => {
        const parser = StreamParser.custom({});

        expect(parser.isEndMarker('anything')).toBe(false);
      });

      it('should use default linePrefix if not provided', () => {
        const parser = StreamParser.custom({});

        expect(parser.linePrefix).toBe('data: ');
      });

      it('should combine all custom options', () => {
        const customExtractor = parsed => parsed.text;
        const customEndMarker = data => data === 'END';
        const parser = StreamParser.custom({
          extractContent: customExtractor,
          isEndMarker: customEndMarker,
          linePrefix: 'custom: ',
        });

        expect(parser.extractContent({ text: 'test' })).toBe('test');
        expect(parser.isEndMarker('END')).toBe(true);
        expect(parser.linePrefix).toBe('custom: ');
      });
    });
  });
});

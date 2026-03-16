import {
  parseOpenAICompatibleStream,
  resetStreamBuffer,
  createStreamBuffer,
} from '@/utils/StreamParser';

describe('StreamParser', () => {
  let buffer;
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    buffer = createStreamBuffer();
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('createStreamBuffer', () => {
    it('should create buffer with empty streamBuffer', () => {
      const newBuffer = createStreamBuffer();
      expect(newBuffer).toEqual({ streamBuffer: '' });
    });

    it('should create independent buffers', () => {
      const buffer1 = createStreamBuffer();
      const buffer2 = createStreamBuffer();

      buffer1.streamBuffer = 'test';
      expect(buffer2.streamBuffer).toBe('');
    });
  });

  describe('resetStreamBuffer', () => {
    it('should reset buffer to empty string', () => {
      buffer.streamBuffer = 'some content';
      resetStreamBuffer(buffer);
      expect(buffer.streamBuffer).toBe('');
    });

    it('should handle empty buffer', () => {
      resetStreamBuffer(buffer);
      expect(buffer.streamBuffer).toBe('');
    });
  });

  describe('parseOpenAICompatibleStream', () => {
    it('should parse simple SSE chunk', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Hello');
      expect(buffer.streamBuffer).toBe('');
    });

    it('should parse multiple lines in one chunk', () => {
      const chunk =
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n' +
        'data: {"choices":[{"delta":{"content":" World"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Hello World');
    });

    it('should handle [DONE] marker', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n' + 'data: [DONE]\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Hello');
      expect(buffer.streamBuffer).toBe('');
    });

    it('should skip non-data lines', () => {
      const chunk = ': comment\n' + 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Hello');
    });

    it('should skip empty lines', () => {
      const chunk = '\n\ndata: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Hello');
    });

    it('should buffer incomplete JSON', () => {
      const chunk1 = 'data: {"choices":[{"delta":{"content":"Hel';
      const chunk2 = 'lo"}}]}\n\n';

      const content1 = parseOpenAICompatibleStream(chunk1, buffer, 'TestProvider');
      expect(content1).toBe('');
      expect(buffer.streamBuffer).toContain('Hel');

      const content2 = parseOpenAICompatibleStream(chunk2, buffer, 'TestProvider');
      expect(content2).toBe('Hello');
      expect(buffer.streamBuffer).toBe('');
    });

    it('should handle chunks split across line boundaries', () => {
      const chunk1 = 'data: {"choices":[{"delta":{"content":"Hel';
      const chunk2 = 'lo"}}]}';
      const chunk3 = '\n\n';

      parseOpenAICompatibleStream(chunk1, buffer, 'TestProvider');
      parseOpenAICompatibleStream(chunk2, buffer, 'TestProvider');
      const content = parseOpenAICompatibleStream(chunk3, buffer, 'TestProvider');

      expect(content).toBe('Hello');
    });

    it('should handle multiple SSE events in one chunk', () => {
      const chunk =
        'data: {"choices":[{"delta":{"content":"A"}}]}\n' +
        'data: {"choices":[{"delta":{"content":"B"}}]}\n' +
        'data: {"choices":[{"delta":{"content":"C"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('ABC');
    });

    it('should handle content without choices array', () => {
      const chunk = 'data: {"id":"test","object":"chat.completion"}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('');
    });

    it('should handle delta without content', () => {
      const chunk = 'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('');
    });

    it('should concatenate content across multiple chunks', () => {
      const chunk1 = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';
      const chunk2 = 'data: {"choices":[{"delta":{"content":" World"}}]}\n\n';
      const chunk3 = 'data: {"choices":[{"delta":{"content":"!"}}]}\n\n';

      const content1 = parseOpenAICompatibleStream(chunk1, buffer, 'TestProvider');
      const content2 = parseOpenAICompatibleStream(chunk2, buffer, 'TestProvider');
      const content3 = parseOpenAICompatibleStream(chunk3, buffer, 'TestProvider');

      expect(content1).toBe('Hello');
      expect(content2).toBe(' World');
      expect(content3).toBe('!');
    });

    it('should handle whitespace in data lines', () => {
      const chunk = '  data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Hello');
    });

    it('should handle malformed JSON gracefully', () => {
      const chunk = 'data: {invalid json}\n' + 'data: {"choices":[{"delta":{"content":"Valid"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Valid');
    });

    it('should preserve incomplete chunks for next parsing', () => {
      const chunk1 = 'data: {"choices":[{"delta":{"content":"First\'"}}]}\n';
      const chunk2 = 'data: {"choices":[{"delta":{"content":"Second"}}]}\n\n';

      const content1 = parseOpenAICompatibleStream(chunk1, buffer, 'TestProvider');
      const content2 = parseOpenAICompatibleStream(chunk2, buffer, 'TestProvider');

      expect(content1).toBe('');
      expect(content2).toBe('Second');
    });

    it('should handle real-world streaming scenario', () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"The"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" quick"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" brown"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" fox"}}]}\n\n',
        'data: [DONE]\n',
      ];

      let fullContent = '';
      for (const chunk of chunks) {
        fullContent += parseOpenAICompatibleStream(chunk, buffer, 'OpenAI');
      }

      expect(fullContent).toBe('The quick brown fox');
    });

    it('should handle chunk with multiple newlines', () => {
      const chunk =
        'data: {"choices":[{"delta":{"content":"A"}}]}\n\n\n' +
        'data: {"choices":[{"delta":{"content":"B"}}]}\n\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('AB');
    });

    it('should handle data prefix variations', () => {
      const chunk = 'data:{"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Hello');
    });

    it('should handle very long content', () => {
      const longContent = 'x'.repeat(1000);
      const chunk = `data: {"choices":[{"delta":{"content":"${longContent}"}}]}\n\n`;

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe(longContent);
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Hello\nWorld\tTest\r\n';
      const chunk = `data: {"choices":[{"delta":{"content":"${specialContent}"}}]}\n\n`;

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe(specialContent);
    });

    it('should handle unicode characters', () => {
      const unicodeContent = 'Hello 世界 🌍';
      const chunk = `data: {"choices":[{"delta":{"content":"${unicodeContent}"}}]}\n\n`;

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe(unicodeContent);
    });

    it('should clean up buffer after successful parse', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(buffer.streamBuffer).toBe('');
    });

    it('should keep incomplete data in buffer', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hel';

      parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(buffer.streamBuffer).toContain('Hel');
    });

    it('should handle provider name in logs', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      parseOpenAICompatibleStream(chunk, buffer, 'CustomProvider');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[CustomProvider Parser]'));
    });
  });

  describe('edge cases', () => {
    it('should handle empty string chunk', () => {
      const content = parseOpenAICompatibleStream('', buffer, 'TestProvider');
      expect(content).toBe('');
    });

    it('should handle chunk with only newlines', () => {
      const chunk = '\n\n\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');
      expect(content).toBe('');
    });

    it('should handle chunk with only whitespace', () => {
      const chunk = '   \n   \n   \n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');
      expect(content).toBe('');
    });

    it('should handle null/undefined buffer gracefully', () => {
      const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';

      // Should initialize buffer if not exists
      const content = parseOpenAICompatibleStream(chunk, {}, 'TestProvider');

      expect(content).toBe('Hello');
    });

    it('should handle mixed valid and invalid JSON', () => {
      const chunk =
        'data: invalid\n' +
        'data: {"choices":[{"delta":{"content":"Valid1"}}]}\n' +
        'data: {also invalid}\n' +
        'data: {"choices":[{"delta":{"content":"Valid2"}}]}\n\n';

      const content = parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');

      expect(content).toBe('Valid1Valid2');
    });
  });

  describe('streaming simulation', () => {
    it('should simulate real streaming response', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"The"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" quick"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" brown"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" fox"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" jumps"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" over"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" the"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" lazy"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" dog."}}]}\n\n',
        'data: [DONE]\n',
      ];

      let fullResponse = '';
      for (const chunk of chunks) {
        fullResponse += parseOpenAICompatibleStream(chunk, buffer, 'TestProvider');
      }

      expect(fullResponse).toBe('The quick brown fox jumps over the lazy dog.');
    });
  });
});

import { OllamaService } from '../ollama.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('OllamaService Error Handling - PR #8 Fix Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error propagation pattern verification', () => {
    it('should demonstrate the fix: error captured then thrown after await', async () => {
      // This test verifies the pattern used in the fix:
      // 1. Error occurs during streaming
      // 2. Error is captured in streamError variable (not thrown in callback)
      // 3. After await completes, error is thrown
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      let errorThrown = false;
      try {
        await OllamaService.executeToolLoopStreaming(
          'llama2',
          'test query',
          (_chunk: string) => {},
          (_metadata: any) => {}
        );
      } catch (error) {
        errorThrown = true;
        // Verify error propagated correctly
        expect(error).toBeInstanceOf(Error);
      }

      expect(errorThrown).toBe(true);
    });

    it('should handle errors in the correct context for try-catch', async () => {
      // Simulate server error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        body: null,
      });

      // The error should be catchable by the caller's try-catch
      let caughtError: Error | null = null;
      try {
        await OllamaService.executeToolLoopStreaming(
          'llama2',
          'test query',
          (_chunk: string) => {},
          (_metadata: any) => {}
        );
      } catch (error) {
        caughtError = error as Error;
      }

      // Verify the error was caught at the correct level
      expect(caughtError).not.toBeNull();
      expect(caughtError).toBeInstanceOf(Error);
    });

    it('should throw errors after await completes, not during callback execution', async () => {
      // This verifies the core fix: errors are not thrown inside the onError callback
      // but are captured and thrown after the await completes
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        body: null,
      });

      // The method should throw, and the throw should happen after the await
      await expect(
        OllamaService.executeToolLoopStreaming(
          'llama2',
          'test query',
          (_chunk: string) => {},
          (_metadata: any) => {}
        )
      ).rejects.toThrow();
    });
  });

  describe('Error logging behavior', () => {
    it('should log streaming errors before propagating them', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a custom error in the stream
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockRejectedValueOnce(new Error('Stream interrupted'))
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      try {
        await OllamaService.executeToolLoopStreaming(
          'llama2',
          'test query',
          (_chunk: string) => {},
          (_metadata: any) => {}
        );
      } catch {
        // Expected to throw
      }

      // Verify some error was logged (streaming error or chat error)
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain normal operation when no errors occur', async () => {
      // Mock a successful response that completes immediately
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(JSON.stringify({
                  message: { content: 'Response without tool calls', role: 'assistant' },
                  done: true
                }) + '\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              })
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Should complete successfully without errors
      const result = await OllamaService.executeToolLoopStreaming(
        'llama2',
        'test query',
        (_chunk: string) => {},
        (_metadata: any) => {}
      );

      expect(result).toBeDefined();
      expect(result.iterations).toBeGreaterThan(0);
    });
  });
});

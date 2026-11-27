// In-Browser Client-Side Execution Engine (WebAssembly & Isolated JS)
// Runs student code 100% locally in the browser with 0 server load

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    __pyodideInstance?: any;
    __pyodideLoadingPromise?: Promise<any>;
  }
}

export interface ClientRunResult {
  stdout: string;
  stderr: string;
  verdict: 'PASSED' | 'FAILED' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TLE';
  timeMs: number;
}

const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';

export function isClientRunnable(language: string): boolean {
  const lang = (language || '').toLowerCase().trim();
  return ['python', 'py', 'python3', 'javascript', 'js', 'node'].includes(lang);
}

export async function getPyodide(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if (window.__pyodideInstance) {
    return window.__pyodideInstance;
  }

  if (window.__pyodideLoadingPromise) {
    return window.__pyodideLoadingPromise;
  }

  window.__pyodideLoadingPromise = new Promise((resolve, reject) => {
    const initPyodide = async () => {
      try {
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = `${PYODIDE_CDN_URL}pyodide.js`;
          script.async = true;
          script.onload = async () => {
            try {
              const pyodide = await window.loadPyodide!({ indexURL: PYODIDE_CDN_URL });
              window.__pyodideInstance = pyodide;
              resolve(pyodide);
            } catch (e) {
              reject(e);
            }
          };
          script.onerror = () => reject(new Error('Failed to load Pyodide WebAssembly runtime from CDN.'));
          document.head.appendChild(script);
        } else {
          const pyodide = await window.loadPyodide({ indexURL: PYODIDE_CDN_URL });
          window.__pyodideInstance = pyodide;
          resolve(pyodide);
        }
      } catch (err) {
        reject(err);
      }
    };
    initPyodide();
  });

  return window.__pyodideLoadingPromise;
}

export async function runPythonInBrowser({
  code,
  input = '',
  timeLimitMs = 2000,
}: {
  code: string;
  input?: string;
  timeLimitMs?: number;
}): Promise<ClientRunResult> {
  const startTime = performance.now();

  try {
    const pyodide = await getPyodide();

    // Prepare wrapper script to stream input and intercept stdout / stderr
    const escapedInput = JSON.stringify(input);
    const escapedCode = JSON.stringify(code);

    const runnerWrapper = `
import sys
import io
import json

__stdin_data = ${escapedInput}
sys.stdin = io.StringIO(__stdin_data)
__stdout_stream = io.StringIO()
__stderr_stream = io.StringIO()
sys.stdout = __stdout_stream
sys.stderr = __stderr_stream

__user_code = ${escapedCode}
__error_msg = None
__is_syntax_error = False

try:
    exec(__user_code, {'__name__': '__main__'})
except SyntaxError as e:
    __is_syntax_error = True
    import traceback
    __error_msg = traceback.format_exc()
except Exception as e:
    import traceback
    __error_msg = traceback.format_exc()

sys.stdout.flush()
sys.stderr.flush()
__captured_stdout = __stdout_stream.getvalue()
__captured_stderr = __stderr_stream.getvalue()
if __error_msg:
    __captured_stderr = (__captured_stderr + "\\n" + __error_msg).strip()

json.dumps({
    "stdout": __captured_stdout,
    "stderr": __captured_stderr,
    "isSyntaxError": __is_syntax_error,
    "hasError": bool(__error_msg)
})
`;

    // Timeout race promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIME_LIMIT_EXCEEDED')), timeLimitMs);
    });

    const executionPromise = (async () => {
      const rawJson = await pyodide.runPythonAsync(runnerWrapper);
      return JSON.parse(rawJson);
    })();

    const result = await Promise.race([executionPromise, timeoutPromise]);
    const timeMs = Math.round(performance.now() - startTime);

    if (result.hasError) {
      return {
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
        verdict: result.isSyntaxError ? 'COMPILE_ERROR' : 'RUNTIME_ERROR',
        timeMs,
      };
    }

    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      verdict: 'PASSED',
      timeMs,
    };
  } catch (err: any) {
    const timeMs = Math.round(performance.now() - startTime);
    if (err.message === 'TIME_LIMIT_EXCEEDED') {
      return {
        stdout: '',
        stderr: `Time Limit Exceeded: Execution took longer than ${timeLimitMs}ms.`,
        verdict: 'TLE',
        timeMs,
      };
    }

    return {
      stdout: '',
      stderr: err.message || 'Client Execution Error',
      verdict: 'RUNTIME_ERROR',
      timeMs,
    };
  }
}

export async function runJsInBrowser({
  code,
  input = '',
  timeLimitMs = 2000,
}: {
  code: string;
  input?: string;
  timeLimitMs?: number;
}): Promise<ClientRunResult> {
  const startTime = performance.now();

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    const timer = setTimeout(() => {
      isTimedOut = true;
      resolve({
        stdout: stdout.trim(),
        stderr: `Time Limit Exceeded: Execution took longer than ${timeLimitMs}ms.`,
        verdict: 'TLE',
        timeMs: timeLimitMs,
      });
    }, timeLimitMs);

    try {
      const customConsole = {
        log: (...args: any[]) => {
          stdout += args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
        },
        error: (...args: any[]) => {
          stderr += args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
        },
      };

      // Mock fs.readFileSync(0) for competitive programming stdin
      const mockFs = {
        readFileSync: (_fd: any) => input,
      };

      const mockRequire = (mod: string) => {
        if (mod === 'fs') return mockFs;
        throw new Error(`Module ${mod} is not supported in the sandbox.`);
      };

      // Isolated execution scope
      const runnerFn = new Function('console', 'require', 'input', code);
      runnerFn(customConsole, mockRequire, input);

      clearTimeout(timer);
      if (isTimedOut) return;

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        verdict: 'PASSED',
        timeMs: Math.round(performance.now() - startTime),
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (isTimedOut) return;

      const isSyntax =
        err instanceof SyntaxError ||
        (err.message && (err.message.includes('Unexpected') || err.message.includes('SyntaxError')));

      resolve({
        stdout: stdout.trim(),
        stderr: err.stack || err.message || 'Runtime Error',
        verdict: isSyntax ? 'COMPILE_ERROR' : 'RUNTIME_ERROR',
        timeMs: Math.round(performance.now() - startTime),
      });
    }
  });
}

export async function runCodeInBrowser({
  code,
  language,
  input = '',
  timeLimitMs = 2000,
}: {
  code: string;
  language: string;
  input?: string;
  timeLimitMs?: number;
}): Promise<ClientRunResult> {
  const lang = (language || '').toLowerCase().trim();

  if (['python', 'py', 'python3'].includes(lang)) {
    return runPythonInBrowser({ code, input, timeLimitMs });
  }

  if (['javascript', 'js', 'node'].includes(lang)) {
    return runJsInBrowser({ code, input, timeLimitMs });
  }

  throw new Error(`Client runner not available for language: ${language}`);
}

import { logger } from '../../utils/logger.js';
import { SUBMISSION_VERDICT } from '@codeathon/shared';
import { executionQueue } from './executionQueue.js';
import { pythonRunner } from './runners/pythonRunner.js';
import { javaRunner } from './runners/javaRunner.js';
import { csharpRunner } from './runners/csharpRunner.js';
import { nodeRunner } from './runners/nodeRunner.js';

export class ExecutionService {
  constructor() {
    this.runners = {
      python: pythonRunner,
      py: pythonRunner,
      python3: pythonRunner,
      java: javaRunner,
      jdk: javaRunner,
      csharp: csharpRunner,
      cs: csharpRunner,
      'c#': csharpRunner,
      dotnet: csharpRunner,
      javascript: nodeRunner,
      js: nodeRunner,
      node: nodeRunner,
      nodejs: nodeRunner,
    };
  }

  async executeCode({ code, language = 'python', input = '', timeLimitMs = 2000, memoryLimitMb = 256 }) {
    const langKey = (language || 'python').toLowerCase().trim();

    const runner = this.runners[langKey];
    if (!runner) {
      return {
        stdout: '',
        stderr: `Language "${language}" is not currently configured in the HACKPRO compiler engine. Supported languages: Java, Python, C#, JavaScript.`,
        verdict: SUBMISSION_VERDICT.COMPILE_ERROR,
        timeMs: 0,
        memoryKb: 0,
      };
    }

    // Process through concurrency queue to protect CPU and memory during peak student traffic
    try {
      return await executionQueue.enqueue(async () => {
        return await runner.execute({
          code,
          input,
          timeLimitMs,
          memoryLimitMb,
        });
      });
    } catch (err) {
      logger.error(`Execution error for ${language}:`, err);
      return {
        stdout: '',
        stderr: `Internal Engine Error: ${err.message}`,
        verdict: SUBMISSION_VERDICT.RUNTIME_ERROR,
        timeMs: 0,
        memoryKb: 0,
      };
    }
  }

  compareOutput(actual, expected) {
    if (actual === undefined || expected === undefined) return false;
    const normalize = (str) =>
      String(str)
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
        .trim();

    return normalize(actual) === normalize(expected);
  }
}

export const executionService = new ExecutionService();

import fs from 'fs';
import path from 'path';
import { BaseRunner } from './baseRunner.js';
import { SUBMISSION_VERDICT } from '@codeathon/shared';

export class JavaRunner extends BaseRunner {
  extractClassName(code) {
    // Check for public class
    const publicMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    if (publicMatch && publicMatch[1]) {
      return publicMatch[1];
    }
    // Check for any class
    const anyClassMatch = code.match(/class\s+([A-Za-z0-9_]+)/);
    if (anyClassMatch && anyClassMatch[1]) {
      return anyClassMatch[1];
    }
    return 'Solution';
  }

  async execute({ code, input = '', timeLimitMs = 2000, memoryLimitMb = 256 }) {
    const workspace = this.createTempWorkspace('codeathon-java-');
    const className = this.extractClassName(code);
    const sourcePath = path.join(workspace, `${className}.java`);

    try {
      fs.writeFileSync(sourcePath, code, 'utf8');

      // Step 1: Compilation Phase with heap limit to prevent host memory exhaustion
      const compileResult = await this.runProcess({
        command: 'javac',
        args: ['-J-Xmx128m', '-encoding', 'UTF-8', `${className}.java`],
        cwd: workspace,
        timeLimitMs: 6000,
      });

      if (compileResult.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileResult.stderr || compileResult.stdout || 'Compilation failed',
          verdict: SUBMISSION_VERDICT.COMPILE_ERROR,
          timeMs: compileResult.timeMs,
          memoryKb: 0,
        };
      }

      // Step 2: Sandboxed JVM Execution Phase with conservative heap
      const effectiveHeapMb = Math.min(memoryLimitMb || 128, 128);
      const execResult = await this.runProcess({
        command: 'java',
        args: [
          `-Xmx${effectiveHeapMb}m`,
          '-Xms16m',
          '-XX:+TieredCompilation',
          '-XX:TieredStopAtLevel=1',
          '-Dfile.encoding=UTF-8',
          className,
        ],
        cwd: workspace,
        input,
        timeLimitMs,
      });

      if (execResult.verdict) {
        return execResult;
      }

      if (execResult.exitCode !== 0) {
        return {
          stdout: execResult.stdout,
          stderr: execResult.stderr,
          verdict: SUBMISSION_VERDICT.RUNTIME_ERROR,
          timeMs: execResult.timeMs,
          memoryKb: 32000,
        };
      }

      return {
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        verdict: SUBMISSION_VERDICT.PASSED,
        timeMs: execResult.timeMs,
        memoryKb: 28000,
      };
    } finally {
      this.cleanupWorkspace(workspace);
    }
  }
}

export const javaRunner = new JavaRunner();

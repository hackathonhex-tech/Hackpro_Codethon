import fs from 'fs';
import path from 'path';
import { BaseRunner } from './baseRunner.js';
import { SUBMISSION_VERDICT } from '@codeathon/shared';

export class NodeRunner extends BaseRunner {
  async execute({ code, input = '', timeLimitMs = 2000, memoryLimitMb = 256 }) {
    const workspace = this.createTempWorkspace('codeathon-js-');
    const scriptPath = path.join(workspace, 'solution.js');

    try {
      fs.writeFileSync(scriptPath, code, 'utf8');

      const result = await this.runProcess({
        command: 'node',
        args: [`--max-old-space-size=${memoryLimitMb}`, 'solution.js'],
        cwd: workspace,
        input,
        timeLimitMs,
      });

      if (result.verdict) {
        return result;
      }

      if (result.exitCode !== 0) {
        const isSyntax =
          result.stderr.includes('SyntaxError:') ||
          result.stderr.includes('Unexpected token') ||
          result.stderr.includes('Unexpected identifier');

        return {
          stdout: result.stdout,
          stderr: result.stderr,
          verdict: isSyntax ? SUBMISSION_VERDICT.COMPILE_ERROR : SUBMISSION_VERDICT.RUNTIME_ERROR,
          timeMs: result.timeMs,
          memoryKb: 25000,
        };
      }

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        verdict: SUBMISSION_VERDICT.PASSED,
        timeMs: result.timeMs,
        memoryKb: 22000,
      };
    } finally {
      this.cleanupWorkspace(workspace);
    }
  }
}

export const nodeRunner = new NodeRunner();

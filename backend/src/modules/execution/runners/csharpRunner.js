import fs from 'fs';
import path from 'path';
import { BaseRunner } from './baseRunner.js';
import { SUBMISSION_VERDICT } from '@codeathon/shared';

export class CSharpRunner extends BaseRunner {
  getCscCompilerPath() {
    if (process.platform === 'win32') {
      const candidates = [
        'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
        'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe',
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
    }
    return 'csc';
  }

  async execute({ code, input = '', timeLimitMs = 2000, memoryLimitMb = 256 }) {
    const workspace = this.createTempWorkspace('codeathon-cs-');
    const sourcePath = path.join(workspace, 'Solution.cs');
    const exeName = 'Solution.exe';
    const exePath = path.join(workspace, exeName);
    const isWindows = process.platform === 'win32';

    try {
      fs.writeFileSync(sourcePath, code, 'utf8');
      const cscPath = this.getCscCompilerPath();

      // Step 1: Compilation Phase (-flag syntax works on both Windows csc.exe and Linux Mono csc)
      const compileResult = await this.runProcess({
        command: cscPath,
        args: ['-nologo', '-optimize+', '-target:exe', `-out:${exeName}`, 'Solution.cs'],
        cwd: workspace,
        timeLimitMs: 6000,
        isolate: false,
      });

      if (compileResult.exitCode !== 0 || !fs.existsSync(exePath)) {
        return {
          stdout: '',
          stderr: compileResult.stdout || compileResult.stderr || 'C# Compilation failed',
          verdict: SUBMISSION_VERDICT.COMPILE_ERROR,
          timeMs: compileResult.timeMs,
          memoryKb: 0,
        };
      }

      // Step 2: Sandboxed Execution Phase (native on Windows, Mono runtime on Linux)
      const execResult = await this.runProcess({
        command: isWindows ? exePath : 'mono',
        args: isWindows ? [] : [exePath],
        cwd: workspace,
        input,
        timeLimitMs,
        memoryLimitMb,
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
          memoryKb: 20000,
        };
      }

      return {
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        verdict: SUBMISSION_VERDICT.PASSED,
        timeMs: execResult.timeMs,
        memoryKb: 18000,
      };
    } finally {
      this.cleanupWorkspace(workspace);
    }
  }
}

export const csharpRunner = new CSharpRunner();

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { BaseRunner } from './baseRunner.js';
import { SUBMISSION_VERDICT } from '@codeathon/shared';
import { env } from '../../../config/env.js';

let cachedPythonExec = null;

function resolvePythonExecutable() {
  if (cachedPythonExec) return cachedPythonExec;

  const candidates = [];

  if (env.PYTHON_BIN && env.PYTHON_BIN.trim()) {
    candidates.push({ command: env.PYTHON_BIN.trim(), prefixArgs: [] });
  }

  candidates.push(
    { command: 'python', prefixArgs: [] },
    { command: 'python3', prefixArgs: [] }
  );

  if (process.platform === 'win32') {
    candidates.push({ command: 'py', prefixArgs: ['-3'] });

    const searchDirs = [
      path.join(process.env.APPDATA || '', 'uv', 'python'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python'),
      'C:\\',
      'C:\\Program Files',
    ];

    for (const baseDir of searchDirs) {
      if (!baseDir || !fs.existsSync(baseDir)) continue;
      try {
        const entries = fs.readdirSync(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          if (/^(cpython-|python)/i.test(entry.name)) {
            const exePath = path.join(baseDir, entry.name, 'python.exe');
            if (fs.existsSync(exePath)) {
              candidates.push({ command: exePath, prefixArgs: [] });
            }
          }
        }
      } catch (_) {}
    }

    const localBinPy = path.join(process.env.USERPROFILE || '', '.local', 'bin');
    if (localBinPy && fs.existsSync(localBinPy)) {
      try {
        const files = fs.readdirSync(localBinPy);
        for (const f of files) {
          if (/^python(\d+(\.\d+)*)?\.exe$/i.test(f)) {
            candidates.push({ command: path.join(localBinPy, f), prefixArgs: [] });
          }
        }
      } catch (_) {}
    }
  }

  for (const cand of candidates) {
    try {
      const check = spawnSync(cand.command, [...cand.prefixArgs, '--version'], {
        timeout: 2000,
        windowsHide: true,
      });
      if (check.status === 0) {
        cachedPythonExec = cand;
        return cachedPythonExec;
      }
    } catch (_) {}
  }

  return { command: 'python', prefixArgs: [] };
}

export class PythonRunner extends BaseRunner {
  async execute({ code, input = '', timeLimitMs = 2000, memoryLimitMb = 256 }) {
    const workspace = this.createTempWorkspace('codeathon-py-');
    const scriptPath = path.join(workspace, 'solution.py');

    try {
      fs.writeFileSync(scriptPath, code, 'utf8');

      const { command, prefixArgs } = resolvePythonExecutable();

      // Execute Python with -u for unbuffered binary stdout/stderr
      const result = await this.runProcess({
        command,
        args: [...prefixArgs, '-u', 'solution.py'],
        cwd: workspace,
        input,
        timeLimitMs,
        memoryLimitMb,
        enforceAddressSpace: true,
      });

      if (result.verdict) {
        return result;
      }

      if (result.exitCode !== 0) {
        const isSyntax =
          result.stderr.includes('SyntaxError:') ||
          result.stderr.includes('IndentationError:') ||
          result.stderr.includes('TabError:');

        return {
          stdout: result.stdout,
          stderr: result.stderr,
          verdict: isSyntax ? SUBMISSION_VERDICT.COMPILE_ERROR : SUBMISSION_VERDICT.RUNTIME_ERROR,
          timeMs: result.timeMs,
          memoryKb: result.memoryKb || 18000,
        };
      }

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        verdict: SUBMISSION_VERDICT.PASSED,
        timeMs: result.timeMs,
        memoryKb: result.memoryKb || 16000,
      };
    } finally {
      this.cleanupWorkspace(workspace);
    }
  }
}

export const pythonRunner = new PythonRunner();

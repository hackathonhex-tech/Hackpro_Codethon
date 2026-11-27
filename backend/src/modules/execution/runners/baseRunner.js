import { spawn, spawnSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SUBMISSION_VERDICT } from '@codeathon/shared';

let hasPrlimitCache = null;
const hasPrlimit = () => {
  if (process.platform !== 'linux') return false;
  if (hasPrlimitCache !== null) return hasPrlimitCache;
  try {
    const res = spawnSync('prlimit', ['--version'], { timeout: 1000 });
    hasPrlimitCache = res.status === 0;
  } catch {
    hasPrlimitCache = false;
  }
  return hasPrlimitCache;
};

export class BaseRunner {
  createTempWorkspace(prefix = 'codeathon-run-') {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  }

  cleanupWorkspace(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) return;
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (err) {
      // In Windows, files may temporarily be locked for a few ms after process exit
      setTimeout(() => {
        try {
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
          }
        } catch (_) {}
      }, 500);
    }
  }

  getSanitizedEnv() {
    // Strict allowlist: never pass application secrets (MONGO_URI, JWT_*, BREVO_API_KEY, etc.) to candidate code
    const allowKeys = [
      'PATH',
      'Path',
      'PATHEXT',
      'SystemRoot',
      'WINDIR',
      'COMSPEC',
      'TEMP',
      'TMP',
      'TMPDIR',
      'HOME',
      'USERPROFILE',
      'LANG',
      'LC_ALL',
      'JAVA_HOME',
      'DOTNET_ROOT',
      'DOTNET_CLI_HOME',
    ];
    const safeEnv = {};
    for (const key of allowKeys) {
      if (process.env[key] !== undefined) {
        safeEnv[key] = process.env[key];
      }
    }
    return safeEnv;
  }

  async runProcess({
    command,
    args = [],
    cwd,
    input = '',
    timeLimitMs = 2000,
    memoryLimitMb = 256,
    enforceAddressSpace = false,
    isolate = true,
    maxBufferBytes = 512 * 1024,
  }) {
    const startTime = Date.now();
    const isWindows = process.platform === 'win32';
    const isLinux = process.platform === 'linux';

    let finalCommand = command;
    let finalArgs = args;

    // On Linux containers (e.g. Railway), wrap candidate processes with prlimit for fork-bomb, disk-write, and RAM protection
    if (isolate && isLinux && hasPrlimit()) {
      const prlimitArgs = [
        '--nproc=64',
        '--fsize=2097152', // 2 MB max file write
      ];
      if (enforceAddressSpace && memoryLimitMb > 0) {
        const bytes = Math.max(64, Number(memoryLimitMb)) * 1024 * 1024;
        prlimitArgs.push(`--as=${bytes}`);
      }
      prlimitArgs.push('--', command, ...args);
      finalCommand = 'prlimit';
      finalArgs = prlimitArgs;
    }

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let killed = false;
      let outputLimitExceeded = false;

      const child = spawn(finalCommand, finalArgs, {
        cwd,
        env: this.getSanitizedEnv(),
        windowsHide: true,
        detached: isLinux,
      });

      const killProcessTree = () => {
        if (child.pid && !child.killed) {
          if (isWindows) {
            exec(`taskkill /pid ${child.pid} /T /F`, () => {});
          } else if (isLinux) {
            try {
              process.kill(-child.pid, 'SIGKILL');
            } catch (_) {
              try {
                child.kill('SIGKILL');
              } catch (_) {}
            }
          } else {
            try {
              child.kill('SIGKILL');
            } catch (_) {}
          }
        }
      };

      // Watchdog timeout timer (TLE)
      const timeoutTimer = setTimeout(() => {
        killed = true;
        killProcessTree();
        resolve({
          stdout: stdout.trim(),
          stderr: `Time Limit Exceeded: Process terminated after ${timeLimitMs}ms.`,
          verdict: SUBMISSION_VERDICT.TLE,
          timeMs: timeLimitMs,
          memoryKb: 0,
          exitCode: -1,
        });
      }, timeLimitMs);

      // Write stdin if provided
      if (input !== undefined && input !== null) {
        try {
          child.stdin.write(String(input));
        } catch (_) {}
      }
      try {
        child.stdin.end();
      } catch (_) {}

      // Capture stdout with buffer ceiling
      child.stdout.on('data', (chunk) => {
        if (stdout.length < maxBufferBytes) {
          stdout += chunk.toString();
        } else if (!outputLimitExceeded) {
          outputLimitExceeded = true;
          killProcessTree();
        }
      });

      // Capture stderr
      child.stderr.on('data', (chunk) => {
        if (stderr.length < maxBufferBytes) {
          stderr += chunk.toString();
        }
      });

      child.on('error', (err) => {
        clearTimeout(timeoutTimer);
        resolve({
          stdout: stdout.trim(),
          stderr: `Process Execution Error: ${err.message}`,
          verdict: SUBMISSION_VERDICT.RUNTIME_ERROR,
          timeMs: Date.now() - startTime,
          memoryKb: 0,
          exitCode: -1,
        });
      });

      child.on('close', (code) => {
        clearTimeout(timeoutTimer);
        if (killed) return;

        const timeMs = Math.max(1, Date.now() - startTime);

        if (outputLimitExceeded) {
          return resolve({
            stdout: stdout.substring(0, 1000).trim(),
            stderr: 'Output Limit Exceeded: Program generated more than 512KB of output.',
            verdict: SUBMISSION_VERDICT.RUNTIME_ERROR,
            timeMs,
            memoryKb: 0,
            exitCode: -1,
          });
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          timeMs,
          memoryKb: 15000,
        });
      });
    });
  }
}

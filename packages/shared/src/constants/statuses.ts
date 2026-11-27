export const CONTEST_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
  ARCHIVED: 'archived',
} as const;

export type ContestStatus = (typeof CONTEST_STATUS)[keyof typeof CONTEST_STATUS];

export const CONTEST_ACTIVATION_MODE = {
  SCHEDULED: 'scheduled',
  MANUAL: 'manual',
} as const;

export type ContestActivationMode = (typeof CONTEST_ACTIVATION_MODE)[keyof typeof CONTEST_ACTIVATION_MODE];

export const ATTEMPT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  REVOKED_REOPENED: 'revoked_reopened',
} as const;

export type AttemptStatus = (typeof ATTEMPT_STATUS)[keyof typeof ATTEMPT_STATUS];

export const SUBMISSION_VERDICT = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  TLE: 'TLE', // Time Limit Exceeded
  MLE: 'MLE', // Memory Limit Exceeded
  RUNTIME_ERROR: 'RUNTIME_ERROR',
  COMPILE_ERROR: 'COMPILE_ERROR',
} as const;

export type SubmissionVerdict = (typeof SUBMISSION_VERDICT)[keyof typeof SUBMISSION_VERDICT];

export const ATTENDANCE_STATUS = {
  ABSENT: 'absent',
  PRESENT: 'present',
  COMPLETED: 'completed',
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const PROCTOR_VIOLATION_TYPE = {
  TAB_SWITCH: 'tab_switch',
  WINDOW_BLUR: 'window_blur',
  COPY: 'copy',
  PASTE: 'paste',
  CUT: 'cut',
  CONTEXT_MENU: 'context_menu',
  FULLSCREEN_EXIT: 'fullscreen_exit',
  DEVTOOLS_OPEN: 'devtools_open',
  PRINT_SCREEN: 'print_screen',
  TEXT_SELECTION: 'text_selection',
} as const;

export type ProctorViolationType = (typeof PROCTOR_VIOLATION_TYPE)[keyof typeof PROCTOR_VIOLATION_TYPE];

export const PROCTOR_ACTION = {
  WARN_ONLY: 'warn',
  FLAG: 'flag',
  AUTO_SUBMIT: 'auto_submit',
} as const;

export type ProctorAction = (typeof PROCTOR_ACTION)[keyof typeof PROCTOR_ACTION];

export const LEADERBOARD_DISPLAY_MODE = {
  ANONYMOUS: 'anonymous', // rank + score only
  WITH_NAMES: 'with_names',
} as const;

export type LeaderboardDisplayMode = (typeof LEADERBOARD_DISPLAY_MODE)[keyof typeof LEADERBOARD_DISPLAY_MODE];

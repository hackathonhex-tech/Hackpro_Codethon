export const CONTEST_STATUS = {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    ENDED: 'ended',
    ARCHIVED: 'archived',
};
export const CONTEST_ACTIVATION_MODE = {
    SCHEDULED: 'scheduled',
    MANUAL: 'manual',
};
export const ATTEMPT_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    REVOKED_REOPENED: 'revoked_reopened',
};
export const SUBMISSION_VERDICT = {
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    TLE: 'TLE', // Time Limit Exceeded
    MLE: 'MLE', // Memory Limit Exceeded
    RUNTIME_ERROR: 'RUNTIME_ERROR',
    COMPILE_ERROR: 'COMPILE_ERROR',
};
export const ATTENDANCE_STATUS = {
    ABSENT: 'absent',
    PRESENT: 'present',
    COMPLETED: 'completed',
};
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
};
export const PROCTOR_ACTION = {
    WARN_ONLY: 'warn',
    FLAG: 'flag',
    AUTO_SUBMIT: 'auto_submit',
};
export const LEADERBOARD_DISPLAY_MODE = {
    ANONYMOUS: 'anonymous', // rank + score only
    WITH_NAMES: 'with_names',
};

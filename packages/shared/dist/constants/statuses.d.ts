export declare const CONTEST_STATUS: {
    readonly DRAFT: "draft";
    readonly SCHEDULED: "scheduled";
    readonly LIVE: "live";
    readonly ENDED: "ended";
    readonly ARCHIVED: "archived";
};
export type ContestStatus = (typeof CONTEST_STATUS)[keyof typeof CONTEST_STATUS];
export declare const CONTEST_ACTIVATION_MODE: {
    readonly SCHEDULED: "scheduled";
    readonly MANUAL: "manual";
};
export type ContestActivationMode = (typeof CONTEST_ACTIVATION_MODE)[keyof typeof CONTEST_ACTIVATION_MODE];
export declare const ATTEMPT_STATUS: {
    readonly NOT_STARTED: "not_started";
    readonly IN_PROGRESS: "in_progress";
    readonly SUBMITTED: "submitted";
    readonly REVOKED_REOPENED: "revoked_reopened";
};
export type AttemptStatus = (typeof ATTEMPT_STATUS)[keyof typeof ATTEMPT_STATUS];
export declare const SUBMISSION_VERDICT: {
    readonly PASSED: "PASSED";
    readonly FAILED: "FAILED";
    readonly TLE: "TLE";
    readonly MLE: "MLE";
    readonly RUNTIME_ERROR: "RUNTIME_ERROR";
    readonly COMPILE_ERROR: "COMPILE_ERROR";
};
export type SubmissionVerdict = (typeof SUBMISSION_VERDICT)[keyof typeof SUBMISSION_VERDICT];
export declare const ATTENDANCE_STATUS: {
    readonly ABSENT: "absent";
    readonly PRESENT: "present";
    readonly COMPLETED: "completed";
};
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];
export declare const PROCTOR_VIOLATION_TYPE: {
    readonly TAB_SWITCH: "tab_switch";
    readonly WINDOW_BLUR: "window_blur";
    readonly COPY: "copy";
    readonly PASTE: "paste";
    readonly CUT: "cut";
    readonly CONTEXT_MENU: "context_menu";
    readonly FULLSCREEN_EXIT: "fullscreen_exit";
    readonly DEVTOOLS_OPEN: "devtools_open";
    readonly PRINT_SCREEN: "print_screen";
    readonly TEXT_SELECTION: "text_selection";
};
export type ProctorViolationType = (typeof PROCTOR_VIOLATION_TYPE)[keyof typeof PROCTOR_VIOLATION_TYPE];
export declare const PROCTOR_ACTION: {
    readonly WARN_ONLY: "warn";
    readonly FLAG: "flag";
    readonly AUTO_SUBMIT: "auto_submit";
};
export type ProctorAction = (typeof PROCTOR_ACTION)[keyof typeof PROCTOR_ACTION];
export declare const LEADERBOARD_DISPLAY_MODE: {
    readonly ANONYMOUS: "anonymous";
    readonly WITH_NAMES: "with_names";
};
export type LeaderboardDisplayMode = (typeof LEADERBOARD_DISPLAY_MODE)[keyof typeof LEADERBOARD_DISPLAY_MODE];
//# sourceMappingURL=statuses.d.ts.map
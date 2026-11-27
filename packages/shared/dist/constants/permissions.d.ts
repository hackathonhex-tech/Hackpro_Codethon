export declare const MODULES: readonly ["dashboard", "contests", "sections_questions", "participants", "team_access", "attendance", "proctoring", "leaderboard", "rubrics", "reports", "submissions", "users_roles", "audit_logs"];
export type Module = (typeof MODULES)[number];
export declare const PERMISSIONS: {
    readonly DASHBOARD_VIEW: "dashboard.view";
    readonly DASHBOARD_EXPORT: "dashboard.export";
    readonly CONTESTS_VIEW: "contests.view";
    readonly CONTESTS_CREATE: "contests.create";
    readonly CONTESTS_UPDATE: "contests.update";
    readonly CONTESTS_DELETE: "contests.delete";
    readonly CONTESTS_PUBLISH: "contests.publish";
    readonly CONTESTS_ADJUST_TIMING: "contests.adjust_timing";
    readonly QUESTIONS_VIEW: "sections_questions.view";
    readonly QUESTIONS_CREATE: "sections_questions.create";
    readonly QUESTIONS_UPDATE: "sections_questions.update";
    readonly QUESTIONS_DELETE: "sections_questions.delete";
    readonly QUESTIONS_TOGGLE_FIELDS: "sections_questions.toggle_fields";
    readonly PARTICIPANTS_VIEW: "participants.view";
    readonly PARTICIPANTS_CREATE: "participants.create";
    readonly PARTICIPANTS_IMPORT_CSV: "participants.import_csv";
    readonly PARTICIPANTS_UPDATE: "participants.update";
    readonly PARTICIPANTS_DELETE: "participants.delete";
    readonly TEAM_ACCESS_VIEW: "team_access.view";
    readonly TEAM_ACCESS_ASSIGN: "team_access.assign";
    readonly TEAM_ACCESS_UNASSIGN: "team_access.unassign";
    readonly ATTENDANCE_VIEW: "attendance.view";
    readonly ATTENDANCE_EXPORT: "attendance.export";
    readonly PROCTORING_VIEW: "proctoring.view";
    readonly PROCTORING_CONFIGURE: "proctoring.configure";
    readonly PROCTORING_ACT_VIOLATIONS: "proctoring.act_violations";
    readonly LEADERBOARD_VIEW: "leaderboard.view";
    readonly LEADERBOARD_CONFIGURE_VISIBILITY: "leaderboard.configure_visibility";
    readonly RUBRICS_VIEW: "rubrics.view";
    readonly RUBRICS_CREATE: "rubrics.create";
    readonly RUBRICS_UPDATE: "rubrics.update";
    readonly RUBRICS_DELETE: "rubrics.delete";
    readonly REPORTS_VIEW: "reports.view";
    readonly REPORTS_EDIT_MOCK: "reports.edit_mock";
    readonly REPORTS_EXPORT: "reports.export";
    readonly SUBMISSIONS_VIEW: "submissions.view";
    readonly SUBMISSIONS_REVOKE: "submissions.revoke";
    readonly USERS_ROLES_VIEW: "users_roles.view";
    readonly USERS_ROLES_CREATE: "users_roles.create";
    readonly USERS_ROLES_UPDATE: "users_roles.update";
    readonly USERS_ROLES_DELETE: "users_roles.delete";
    readonly AUDIT_LOGS_VIEW: "audit_logs.view";
};
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export interface ModulePermissionDefinition {
    module: Module;
    label: string;
    permissions: {
        key: PermissionKey;
        label: string;
        superAdminOnly?: boolean;
    }[];
}
export declare const MODULE_PERMISSIONS: ModulePermissionDefinition[];
export declare const ALL_PERMISSIONS: ("dashboard.view" | "dashboard.export" | "contests.view" | "contests.create" | "contests.update" | "contests.delete" | "contests.publish" | "contests.adjust_timing" | "sections_questions.view" | "sections_questions.create" | "sections_questions.update" | "sections_questions.delete" | "sections_questions.toggle_fields" | "participants.view" | "participants.create" | "participants.import_csv" | "participants.update" | "participants.delete" | "team_access.view" | "team_access.assign" | "team_access.unassign" | "attendance.view" | "attendance.export" | "proctoring.view" | "proctoring.configure" | "proctoring.act_violations" | "leaderboard.view" | "leaderboard.configure_visibility" | "rubrics.view" | "rubrics.create" | "rubrics.update" | "rubrics.delete" | "reports.view" | "reports.edit_mock" | "reports.export" | "submissions.view" | "submissions.revoke" | "users_roles.view" | "users_roles.create" | "users_roles.update" | "users_roles.delete" | "audit_logs.view")[];
//# sourceMappingURL=permissions.d.ts.map
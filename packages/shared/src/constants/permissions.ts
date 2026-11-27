export const MODULES = [
  'dashboard',
  'contests',
  'sections_questions',
  'participants',
  'team_access',
  'attendance',
  'proctoring',
  'leaderboard',
  'rubrics',
  'reports',
  'submissions',
  'users_roles',
  'audit_logs',
] as const;

export type Module = (typeof MODULES)[number];

export const PERMISSIONS = {
  // Dashboard & Analytics
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_EXPORT: 'dashboard.export',

  // Contest Management
  CONTESTS_VIEW: 'contests.view',
  CONTESTS_CREATE: 'contests.create',
  CONTESTS_UPDATE: 'contests.update',
  CONTESTS_DELETE: 'contests.delete',
  CONTESTS_PUBLISH: 'contests.publish',
  CONTESTS_ADJUST_TIMING: 'contests.adjust_timing',

  // Sections & Questions
  QUESTIONS_VIEW: 'sections_questions.view',
  QUESTIONS_CREATE: 'sections_questions.create',
  QUESTIONS_UPDATE: 'sections_questions.update',
  QUESTIONS_DELETE: 'sections_questions.delete',
  QUESTIONS_TOGGLE_FIELDS: 'sections_questions.toggle_fields',

  // Participants
  PARTICIPANTS_VIEW: 'participants.view',
  PARTICIPANTS_CREATE: 'participants.create',
  PARTICIPANTS_IMPORT_CSV: 'participants.import_csv',
  PARTICIPANTS_UPDATE: 'participants.update',
  PARTICIPANTS_DELETE: 'participants.delete',

  // Team Access
  TEAM_ACCESS_VIEW: 'team_access.view',
  TEAM_ACCESS_ASSIGN: 'team_access.assign',
  TEAM_ACCESS_UNASSIGN: 'team_access.unassign',

  // Attendance
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_EXPORT: 'attendance.export',

  // Proctoring
  PROCTORING_VIEW: 'proctoring.view',
  PROCTORING_CONFIGURE: 'proctoring.configure',
  PROCTORING_ACT_VIOLATIONS: 'proctoring.act_violations',

  // Leaderboard
  LEADERBOARD_VIEW: 'leaderboard.view',
  LEADERBOARD_CONFIGURE_VISIBILITY: 'leaderboard.configure_visibility',

  // Rubrics
  RUBRICS_VIEW: 'rubrics.view',
  RUBRICS_CREATE: 'rubrics.create',
  RUBRICS_UPDATE: 'rubrics.update',
  RUBRICS_DELETE: 'rubrics.delete',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EDIT_MOCK: 'reports.edit_mock',
  REPORTS_EXPORT: 'reports.export',

  // Submissions (Super Admin only for revoke)
  SUBMISSIONS_VIEW: 'submissions.view',
  SUBMISSIONS_REVOKE: 'submissions.revoke',

  // User & Role Management (Super Admin only for roles)
  USERS_ROLES_VIEW: 'users_roles.view',
  USERS_ROLES_CREATE: 'users_roles.create',
  USERS_ROLES_UPDATE: 'users_roles.update',
  USERS_ROLES_DELETE: 'users_roles.delete',

  // Audit Logs
  AUDIT_LOGS_VIEW: 'audit_logs.view',
} as const;

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

export const MODULE_PERMISSIONS: ModulePermissionDefinition[] = [
  {
    module: 'dashboard',
    label: 'Dashboard & Analytics',
    permissions: [
      { key: PERMISSIONS.DASHBOARD_VIEW, label: 'View Dashboard & Analytics' },
      { key: PERMISSIONS.DASHBOARD_EXPORT, label: 'Export Analytics (CSV/PDF)' },
    ],
  },
  {
    module: 'contests',
    label: 'Contest Management',
    permissions: [
      { key: PERMISSIONS.CONTESTS_VIEW, label: 'View Contests' },
      { key: PERMISSIONS.CONTESTS_CREATE, label: 'Create Contests' },
      { key: PERMISSIONS.CONTESTS_UPDATE, label: 'Update Contests' },
      { key: PERMISSIONS.CONTESTS_DELETE, label: 'Delete / Archive Contests' },
      { key: PERMISSIONS.CONTESTS_PUBLISH, label: 'Publish / Schedule Contests' },
      { key: PERMISSIONS.CONTESTS_ADJUST_TIMING, label: 'Adjust Live Timing / Extension' },
    ],
  },
  {
    module: 'sections_questions',
    label: 'Sections & Questions',
    permissions: [
      { key: PERMISSIONS.QUESTIONS_VIEW, label: 'View Sections & Questions' },
      { key: PERMISSIONS.QUESTIONS_CREATE, label: 'Create Questions & Sections' },
      { key: PERMISSIONS.QUESTIONS_UPDATE, label: 'Edit Questions & Test Cases' },
      { key: PERMISSIONS.QUESTIONS_DELETE, label: 'Delete Sections & Questions' },
      { key: PERMISSIONS.QUESTIONS_TOGGLE_FIELDS, label: 'Toggle Question Blocks Display' },
    ],
  },
  {
    module: 'participants',
    label: 'Participants & Teams',
    permissions: [
      { key: PERMISSIONS.PARTICIPANTS_VIEW, label: 'View Participants' },
      { key: PERMISSIONS.PARTICIPANTS_CREATE, label: 'Create Participants / Teams' },
      { key: PERMISSIONS.PARTICIPANTS_IMPORT_CSV, label: 'Bulk Import Participants (CSV)' },
      { key: PERMISSIONS.PARTICIPANTS_UPDATE, label: 'Update Participants' },
      { key: PERMISSIONS.PARTICIPANTS_DELETE, label: 'Delete Participants' },
    ],
  },
  {
    module: 'team_access',
    label: 'Team Access & Assignment',
    permissions: [
      { key: PERMISSIONS.TEAM_ACCESS_VIEW, label: 'View Contest Assignments' },
      { key: PERMISSIONS.TEAM_ACCESS_ASSIGN, label: 'Assign Participants / Teams' },
      { key: PERMISSIONS.TEAM_ACCESS_UNASSIGN, label: 'Unassign Participants' },
    ],
  },
  {
    module: 'attendance',
    label: 'Attendance Tracking',
    permissions: [
      { key: PERMISSIONS.ATTENDANCE_VIEW, label: 'View Attendance Records' },
      { key: PERMISSIONS.ATTENDANCE_EXPORT, label: 'Export Attendance' },
    ],
  },
  {
    module: 'proctoring',
    label: 'Proctoring & Violations',
    permissions: [
      { key: PERMISSIONS.PROCTORING_VIEW, label: 'View Proctoring Feed & Violations' },
      { key: PERMISSIONS.PROCTORING_CONFIGURE, label: 'Configure Proctor Rules' },
      { key: PERMISSIONS.PROCTORING_ACT_VIOLATIONS, label: 'Act on Violations' },
    ],
  },
  {
    module: 'leaderboard',
    label: 'Leaderboard',
    permissions: [
      { key: PERMISSIONS.LEADERBOARD_VIEW, label: 'View Leaderboard' },
      { key: PERMISSIONS.LEADERBOARD_CONFIGURE_VISIBILITY, label: 'Configure Visibility / Freeze' },
    ],
  },
  {
    module: 'rubrics',
    label: 'Rubrics Management',
    permissions: [
      { key: PERMISSIONS.RUBRICS_VIEW, label: 'View Rubrics' },
      { key: PERMISSIONS.RUBRICS_CREATE, label: 'Create Rubrics' },
      { key: PERMISSIONS.RUBRICS_UPDATE, label: 'Update Custom Rubrics' },
      { key: PERMISSIONS.RUBRICS_DELETE, label: 'Delete Custom Rubrics' },
    ],
  },
  {
    module: 'reports',
    label: 'Report Management',
    permissions: [
      { key: PERMISSIONS.REPORTS_VIEW, label: 'View Reports' },
      { key: PERMISSIONS.REPORTS_EDIT_MOCK, label: 'Adjust Display Figures' },
      { key: PERMISSIONS.REPORTS_EXPORT, label: 'Export Reports' },
    ],
  },
  {
    module: 'submissions',
    label: 'Submissions Control',
    permissions: [
      { key: PERMISSIONS.SUBMISSIONS_VIEW, label: 'View Submissions' },
      { key: PERMISSIONS.SUBMISSIONS_REVOKE, label: 'Revoke Submission (Super Admin)', superAdminOnly: true },
    ],
  },
  {
    module: 'users_roles',
    label: 'User & Role Management',
    permissions: [
      { key: PERMISSIONS.USERS_ROLES_VIEW, label: 'View Users & Roles' },
      { key: PERMISSIONS.USERS_ROLES_CREATE, label: 'Create Admins & Roles', superAdminOnly: true },
      { key: PERMISSIONS.USERS_ROLES_UPDATE, label: 'Update Users & Roles', superAdminOnly: true },
      { key: PERMISSIONS.USERS_ROLES_DELETE, label: 'Delete Users & Roles', superAdminOnly: true },
    ],
  },
  {
    module: 'audit_logs',
    label: 'Audit Logs',
    permissions: [
      { key: PERMISSIONS.AUDIT_LOGS_VIEW, label: 'View Audit Logs' },
    ],
  },
];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

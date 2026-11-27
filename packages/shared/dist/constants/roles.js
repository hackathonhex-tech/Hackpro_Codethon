export const SYSTEM_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    STUDENT: 'student',
};
export const PREDEFINED_SUB_ROLES = [
    {
        name: 'Contest Manager',
        description: 'Manages contest schedules, sections, timing, and settings',
        permissions: [
            'dashboard.view',
            'contests.view',
            'contests.create',
            'contests.update',
            'contests.publish',
            'contests.adjust_timing',
            'sections_questions.view',
            'sections_questions.create',
            'sections_questions.update',
            'sections_questions.toggle_fields',
            'team_access.view',
            'team_access.assign',
            'leaderboard.view',
            'leaderboard.configure_visibility',
        ],
    },
    {
        name: 'Question Setter',
        description: 'Creates and curates questions, test cases, and starter code',
        permissions: [
            'contests.view',
            'sections_questions.view',
            'sections_questions.create',
            'sections_questions.update',
            'sections_questions.toggle_fields',
            'rubrics.view',
        ],
    },
    {
        name: 'Proctor Monitor',
        description: 'Monitors real-time proctor feeds and acts on student violations',
        permissions: [
            'dashboard.view',
            'proctoring.view',
            'proctoring.configure',
            'proctoring.act_violations',
            'attendance.view',
        ],
    },
    {
        name: 'Evaluator',
        description: 'Reviews submissions, evaluates code quality, and reviews rubrics',
        permissions: [
            'dashboard.view',
            'submissions.view',
            'rubrics.view',
            'leaderboard.view',
            'attendance.view',
        ],
    },
    {
        name: 'Attendance Viewer',
        description: 'Views participant presence, start/submission timestamps and exports records',
        permissions: [
            'attendance.view',
            'attendance.export',
            'participants.view',
        ],
    },
    {
        name: 'Report Editor',
        description: 'Views performance analytics and exports summary reports',
        permissions: [
            'dashboard.view',
            'dashboard.export',
            'reports.view',
            'reports.edit_mock',
            'reports.export',
        ],
    },
];

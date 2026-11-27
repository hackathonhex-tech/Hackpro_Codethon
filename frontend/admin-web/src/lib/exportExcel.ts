import * as XLSX from 'xlsx';

function sanitize(str: string): string {
  return (str || 'assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function exportSubmissionsExcel({
  contestTitle = 'Assessment Contest',
  batchCode = '—',
  submissions = [],
}: {
  contestTitle?: string;
  batchCode?: string;
  submissions: any[];
}) {
  const rows = submissions.map((s, index) => {
    let dateStr = '—';
    if (s.submittedAt || s.updatedAt) {
      try {
        const d = new Date(s.submittedAt || s.updatedAt);
        dateStr = isNaN(d.getTime()) ? '—' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        dateStr = '—';
      }
    }

    return {
      'S.No': index + 1,
      'Superset ID': s.rollNumber && s.rollNumber !== 'null' ? s.rollNumber : s.userRoll || '—',
      'Candidate Name': s.participantName || s.userName || s.name || 'Candidate',
      'Email Address': s.email || s.userEmail || '—',
      'Contest Title': s.contestTitle || contestTitle,
      'Batch Code': batchCode,
      'Submission Status': (s.status || 'submitted').toUpperCase(),
      'MCQ Score': typeof s.mcqScore === 'number' ? s.mcqScore : 0,
      'Coding Score': typeof s.codingScore === 'number' ? s.codingScore : 0,
      'Final Total Score': typeof (s.finalScore ?? s.totalScore) === 'number' ? (s.finalScore ?? s.totalScore) : 0,
      'Submission Timestamp': dateStr,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

  XLSX.writeFile(workbook, `Submissions_${sanitize(contestTitle)}_${Date.now()}.xlsx`);
}

export function exportAttendanceExcel({
  contestTitle = 'Assessment Contest',
  batchCode = '—',
  records = [],
}: {
  contestTitle?: string;
  batchCode?: string;
  records: any[];
}) {
  const rows = records.map((r, index) => {
    const formatT = (t?: string | null) => {
      if (!t) return '—';
      try {
        const d = new Date(t);
        return isNaN(d.getTime()) ? '—' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return '—';
      }
    };

    return {
      'S.No': index + 1,
      'Superset ID': (r.rollNumber && r.rollNumber !== 'null' ? r.rollNumber : '—').replace(/^EMP/i, ''),
      'Candidate Name': r.name || r.participantName || r.userName || 'Candidate',
      'Email Address': r.email || '—',
      'Department': r.department || '—',
      'Team Allocation': r.teamName || 'Individual',
      'Contest Title': contestTitle,
      'Batch Code': batchCode,
      'Attendance Status':
        r.status === 'completed' || r.status === 'present' ? 'Present' : 'Absent',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  XLSX.writeFile(workbook, `Attendance_${sanitize(contestTitle)}_${Date.now()}.xlsx`);
}

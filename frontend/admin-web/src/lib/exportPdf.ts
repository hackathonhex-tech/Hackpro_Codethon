import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function sanitize(str: string): string {
  return (str || 'assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export interface AttendanceRecordForPdf {
  rollNumber?: string;
  name?: string;
  participantName?: string;
  userName?: string;
  email?: string;
  department?: string;
  teamName?: string;
  status: string;
  startedAt?: string | null;
  submittedAt?: string | null;
  durationMinutes?: number;
}

export function exportAttendancePdf({
  contestTitle = 'Assessment Contest',
  batchCode = '—',
  stats,
  records,
}: {
  contestTitle: string;
  batchCode?: string;
  stats?: { total: number; present: number; completed: number; absent: number };
  records: AttendanceRecordForPdf[];
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  // 1. Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 297, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HACKPRO ASSESSMENT SYSTEM', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('OFFICIAL CANDIDATE ATTENDANCE & EXAMINATION DOSSIER', 14, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${timestamp}`, 283, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Batch Code: ${batchCode}`, 283, 18, { align: 'right' });

  // 2. Contest Metadata & KPI Summary Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, 30, 269, 16, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Contest: ${contestTitle}`, 18, 37);

  const total = stats?.total ?? records.length;
  const present = stats?.present ?? records.filter((r) => r.status === 'present' || r.status === 'completed').length;
  const completed = stats?.completed ?? records.filter((r) => r.status === 'completed').length;
  const absent = stats?.absent ?? Math.max(0, total - present);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Total Assigned: `, 18, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${total}`, 42, 42);

  doc.setFont('helvetica', 'normal');
  doc.text(`Present: `, 65, 42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`${present}`, 79, 42);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Submitted: `, 105, 42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 96, 248); // Blue
  doc.text(`${completed}`, 122, 42);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Absent: `, 150, 42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68); // Red
  doc.text(`${absent}`, 163, 42);

  // 3. Table Rows (Department removed; Candidate Email, Check-in Time, and Turn-in Time emphasized)
  const tableData = records.map((r, index) => {
    const candidateName = r.name || r.participantName || r.userName || 'Candidate';
    const rollNo = r.rollNumber && r.rollNumber !== 'null' ? r.rollNumber : '—';
    const email =
      (r.email && r.email !== '—' && r.email !== 'null' && r.email) ||
      ((r as any).userEmail && (r as any).userEmail !== '—' && (r as any).userEmail) ||
      ((r as any).candidateEmail && (r as any).candidateEmail !== '—' && (r as any).candidateEmail) ||
      ((r as any).participantEmail && (r as any).participantEmail !== '—' && (r as any).participantEmail) ||
      ((r as any).participant?.email && (r as any).participant.email !== '—' && (r as any).participant.email) ||
      ((r as any).user?.email && (r as any).user.email !== '—' && (r as any).user.email) ||
      '—';
    const team = r.teamName || 'Individual';
    const statusLabel =
      r.status === 'completed'
        ? 'Submitted'
        : r.status === 'present'
        ? 'Present'
        : 'Absent';

    const checkinRaw = r.startedAt || (r as any).testStartTimestamp || (r as any).loginTimestamp;
    const turninRaw = r.submittedAt || (r as any).submitTimestamp;

    const formatT = (t?: string | null) => {
      if (!t) return '—';
      try {
        const d = new Date(t);
        return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      } catch {
        return '—';
      }
    };

    return [
      String(index + 1),
      rollNo,
      candidateName,
      email,
      team,
      statusLabel,
      formatT(checkinRaw),
      formatT(turninRaw),
      `${r.durationMinutes || 0}m`,
    ];
  });

  autoTable(doc, {
    startY: 50,
    margin: { left: 14, right: 14 },
    head: [
      [
        '#',
        'Superset ID',
        'Candidate Name',
        'Candidate Email',
        'Team Allocation',
        'Status',
        'Check-in Time',
        'Turn-in Time',
        'Duration',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30, fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 60 },
      4: { cellWidth: 30 },
      5: { cellWidth: 25, fontStyle: 'bold' },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
      8: { cellWidth: 18, halign: 'center' },
    },
    didDrawCell: (data) => {
      // Highlight Status column
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw);
        if (val === 'Submitted') {
          doc.setTextColor(55, 96, 248);
        } else if (val === 'Present') {
          doc.setTextColor(16, 185, 129);
        } else {
          doc.setTextColor(148, 163, 184);
        }
      }
    },
    didDrawPage: () => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `HACKPRO Confidential Report &bull; Page ${pageCount}`,
        283,
        202,
        { align: 'right' }
      );
    },
  });

  doc.save(`Attendance_${sanitize(contestTitle)}_${Date.now()}.pdf`);
}

export function exportSubmissionsPdf({
  contestTitle = 'Assessment Contest',
  batchCode = '—',
  submissions = [],
}: {
  contestTitle?: string;
  batchCode?: string;
  submissions: any[];
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  // 1. Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 297, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HACKPRO ASSESSMENT SYSTEM', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('STUDENT SUBMISSION EVALUATION & PERFORMANCE DOSSIER', 14, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${timestamp}`, 283, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Total Submissions: ${submissions.length}`, 283, 18, { align: 'right' });

  // 2. Summary Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 30, 269, 14, 2, 2, 'FD');

  const scores = submissions.map((s) => Number(s.finalScore ?? s.totalScore ?? 0)).filter((n) => !isNaN(n));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Contest: ${contestTitle}`, 18, 38.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Total Candidates: `, 115, 38.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${submissions.length}`, 143, 38.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Average Score: `, 165, 38.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 96, 248);
  doc.text(`${avgScore} pts`, 189, 38.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Top Score: `, 215, 38.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`${topScore} pts`, 233, 38.5);

  // 3. Table Rows
  const tableData = submissions.map((s, index) => {
    const rollNo = s.rollNumber && s.rollNumber !== 'null' ? s.rollNumber : s.userRoll || '—';
    const name = s.participantName || s.userName || s.name || 'Candidate';
    const email = s.email || s.userEmail || '—';
    const status = (s.status || 'submitted').toUpperCase();
    const mcq = typeof s.mcqScore === 'number' ? `${s.mcqScore}` : '0';
    const coding = typeof s.codingScore === 'number' ? `${s.codingScore}` : '0';
    const totalScore = typeof (s.finalScore ?? s.totalScore) === 'number' ? `${s.finalScore ?? s.totalScore}` : '0';

    let dateStr = '—';
    if (s.submittedAt || s.updatedAt) {
      try {
        const d = new Date(s.submittedAt || s.updatedAt);
        dateStr = isNaN(d.getTime()) ? '—' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        dateStr = '—';
      }
    }

    return [
      String(index + 1),
      rollNo,
      name,
      email,
      status,
      mcq,
      coding,
      totalScore,
      dateStr,
    ];
  });

  autoTable(doc, {
    startY: 48,
    margin: { left: 14, right: 14 },
    head: [
      [
        '#',
        'Superset ID',
        'Candidate Name',
        'Email Address',
        'Submission Status',
        'MCQ Score',
        'Coding Score',
        'Final Score',
        'Submitted At',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 45 },
      3: { cellWidth: 55 },
      4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 24, halign: 'center' },
      7: { cellWidth: 24, halign: 'center', fontStyle: 'bold', textColor: [55, 96, 248] },
      8: { cellWidth: 33, halign: 'center' },
    },
    didDrawPage: () => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `HACKPRO Confidential Report &bull; Page ${pageCount}`,
        283,
        202,
        { align: 'right' }
      );
    },
  });

  doc.save(`Submissions_${sanitize(contestTitle)}_${Date.now()}.pdf`);
}

'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PillTabs } from '@/components/ui/PillTabs';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import {
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Lock,
  Download,
  Printer,
  ArrowUpDown,
  Search,
  Filter,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { exportSubmissionsPdf } from '@/lib/exportPdf';
import { exportSubmissionsExcel } from '@/lib/exportExcel';

interface Submission {
  _id: string;
  id?: string;
  participantName: string;
  rollNumber: string;
  contestTitle: string;
  contestId?: string;
  status: string;
  totalScore?: number;
  finalScore?: number;
  mcqScore?: number;
  codingScore?: number;
  submittedAt?: string;
  attemptId: string;
}

export default function SubmissionsPage() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAdminAuthStore();
  const superAdmin = isSuperAdmin();

  const [revokeModal, setRevokeModal] = useState<Submission | null>(null);
  const [reason, setReason] = useState('');
  const [extensionMin, setExtensionMin] = useState('');
  const [resetAnswers, setResetAnswers] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'date_desc' | 'name_asc'>('score_desc');

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', search, page, limit],
    queryFn: () => submissionsApi.getLocked({ search, page, limit }),
  });
  const rawSubmissions: Submission[] = Array.isArray(data) ? data : (data as any)?.data || [];
  const pagination = (data as any)?.pagination;

  const revokeMutation = useMutation({
    mutationFn: () => {
      setErrorMsg(null);
      const targetAttemptId = revokeModal?.attemptId || revokeModal?._id || revokeModal?.id;
      if (!targetAttemptId) {
        throw new Error('Attempt ID not found');
      }
      return submissionsApi.revoke({
        attemptId: targetAttemptId,
        reason: reason.trim() || 'Administrative unlock',
        extensionMinutes: extensionMin ? Number(extensionMin) : 0,
        resetAnswers,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      setRevokeModal(null);
      setReason('');
      setExtensionMin('');
      setResetAnswers(true);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to unlock attempt'));
    },
  });

  const openRevoke = (s: Submission) => {
    setErrorMsg(null);
    setReason('');
    setExtensionMin('');
    setResetAnswers(true);
    setRevokeModal(s);
  };

  // Filtered and Sorted Submissions
  const processedSubmissions = useMemo(() => {
    let list = [...rawSubmissions];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          (s.participantName && s.participantName.toLowerCase().includes(q)) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
          (s.contestTitle && s.contestTitle.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      const scoreA = a.finalScore ?? a.totalScore ?? 0;
      const scoreB = b.finalScore ?? b.totalScore ?? 0;

      if (sortBy === 'score_desc') {
        return scoreB - scoreA;
      }
      if (sortBy === 'score_asc') {
        return scoreA - scoreB;
      }
      if (sortBy === 'date_desc') {
        return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
      }
      if (sortBy === 'name_asc') {
        return (a.participantName || '').localeCompare(b.participantName || '');
      }
      return 0;
    });

    return list;
  }, [rawSubmissions, statusFilter, search, sortBy]);

  // CSV / Excel Export
  const handleExportCsv = () => {
    const rows = [
      ['HACKPRO Assessment Submissions Report'],
      ['Export Date', new Date().toLocaleString()],
      ['Total Records', processedSubmissions.length],
      [],
      [
        'Rank',
        'Employee ID',
        'Candidate Name',
        'Contest Challenge',
        'Aggregate Score (pts)',
        'MCQ Points',
        'Coding Points',
        'Status',
        'Submission Timestamp',
      ],
    ];

    processedSubmissions.forEach((s, idx) => {
      const score = s.finalScore ?? s.totalScore ?? 0;
      rows.push([
        idx + 1,
        s.rollNumber || '—',
        s.participantName || 'Candidate',
        s.contestTitle || 'Contest Challenge',
        score,
        s.mcqScore ?? 0,
        s.codingScore ?? 0,
        s.status.toUpperCase(),
        s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—',
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HACKPRO_Submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const columns = [
    {
      key: 'rank',
      header: 'Rank',
      render: (s: Submission) => {
        const idx = processedSubmissions.indexOf(s);
        return (
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-xs ${
              idx === 0
                ? 'bg-amber-100 text-amber-800'
                : idx === 1
                ? 'bg-slate-200 text-slate-700'
                : idx === 2
                ? 'bg-amber-50 text-amber-700'
                : 'text-slate-500'
            }`}
          >
            {idx + 1}
          </span>
        );
      },
    },
    {
      key: 'rollNumber',
      header: 'Employee ID',
      render: (s: Submission) => (
        <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
          {s.rollNumber || (s as any).rollNo || '—'}
        </span>
      ),
    },
    {
      key: 'participantName',
      header: 'Candidate Name',
      render: (s: Submission) => (
        <span className="text-xs font-semibold text-slate-900 tracking-tight">
          {s.participantName || (s as any).userName || (s as any).name || 'Candidate'}
        </span>
      ),
    },
    {
      key: 'contestTitle',
      header: 'Contest Challenge',
      render: (s: Submission) => (
        <span className="text-xs text-slate-700 font-medium">
          {s.contestTitle || (s as any).title || 'Assessment Contest'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Submission Status',
      render: (s: Submission) => (
        <Badge
          color={
            s.status === 'submitted'
              ? 'green'
              : s.status === 'revoked_reopened'
              ? 'yellow'
              : 'primary'
          }
          dot
        >
          {s.status.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'totalScore',
      header: 'Score',
      render: (s: Submission) => (
        <span className="text-xs font-mono font-extrabold text-[#3760F8]">
          {s.finalScore ?? s.totalScore ?? 0} pts
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Locked / Submitted At',
      render: (s: Submission) => (
        <span className="text-xs font-mono text-slate-500">
          {s.submittedAt
            ? new Date(s.submittedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Authorization',
      render: (s: Submission) =>
        superAdmin ? (
          <Button
            size="sm"
            variant="danger"
            onClick={() => openRevoke(s)}
            leftIcon={<RotateCcw className="w-3 h-3 text-white" />}
          >
            Revoke Lock
          </Button>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Requires Super Admin</span>
        ),
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto print:p-0 print:m-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 print:border-none">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Candidate Submissions & Scores
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review completed assessment submissions, ranked score standings, and export reports
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5 text-slate-500" />}
          >
            Direct CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportSubmissionsExcel({
                contestTitle: 'Assessment Submissions',
                submissions: processedSubmissions,
              })
            }
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Direct Excel
          </Button>
          <Button
            size="sm"
            onClick={() =>
              exportSubmissionsPdf({
                contestTitle: 'Assessment Submissions',
                submissions: processedSubmissions,
              })
            }
            leftIcon={<FileText className="w-3.5 h-3.5 text-white" />}
          >
            Direct PDF
          </Button>
        </div>
      </div>

      {/* Filter and Sorting Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        {/* Status Filter Pill Tabs */}
        <div className="overflow-x-auto scrollbar-none pb-1 lg:pb-0">
          <PillTabs
            items={[
              { id: 'all', label: 'All Submissions', count: rawSubmissions.length },
              {
                id: 'submitted',
                label: 'Submitted',
                count: rawSubmissions.filter((s) => s.status === 'submitted').length,
              },
              {
                id: 'in_progress',
                label: 'In Progress',
                count: rawSubmissions.filter((s) => s.status === 'in_progress').length,
              },
              {
                id: 'revoked_reopened',
                label: 'Revoked',
                count: rawSubmissions.filter((s) => s.status === 'revoked_reopened').length,
              },
            ]}
            activeId={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or Employee ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs border border-slate-200/90 rounded-xl focus:ring-2 focus:ring-[#3760F8]/20 focus:outline-none bg-slate-50/50 hover:bg-white transition-all min-h-[36px]"
            />
          </div>

          {/* Sort By Custom Select */}
          <div className="w-full sm:w-56">
            <Select
              selectSize="sm"
              leftIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'score_desc', label: 'Score: Highest to Lowest' },
                { value: 'score_asc', label: 'Score: Lowest to Highest' },
                { value: 'date_desc', label: 'Time: Most Recent' },
                { value: 'name_asc', label: 'Candidate Name: A-Z' },
              ]}
            />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={processedSubmissions}
        loading={isLoading}
        rowKey={(s) => s._id || s.id || s.attemptId}
        emptyMessage="No matching assessment submissions found."
      />

      {pagination && (
        <Pagination
          page={page}
          totalPages={pagination.totalPages || 1}
          total={pagination.total || 0}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}

      {/* Revoke Modal */}
      <Modal open={!!revokeModal} onClose={() => setRevokeModal(null)} title="Revoke Locked Submission">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold">Emergency Re-attempt Protocol</p>
              <p>
                Revoking this submission will unlock the candidate’s attempt and allow them to resume.
                An audit entry will be permanently logged.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <p>
              <span className="font-semibold text-slate-600">Candidate:</span>{' '}
              <span className="font-bold text-slate-900">{revokeModal?.participantName}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-600">Employee ID:</span>{' '}
              <span className="font-mono text-slate-800">{revokeModal?.rollNumber}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-600">Current Score:</span>{' '}
              <span className="font-mono font-bold text-[#3760F8]">
                {revokeModal?.finalScore ?? revokeModal?.totalScore ?? 0} pts
              </span>
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Revocation Justification *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Technical system failure verified during exam session"
            required
          />

          <Input
            label="Time Extension in Minutes (Optional)"
            type="number"
            value={extensionMin}
            onChange={(e) => setExtensionMin(e.target.value)}
            placeholder="e.g. 15"
          />

          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-1.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={resetAnswers}
                onChange={(e) => setResetAnswers(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#3760F8] focus:ring-[#3760F8]"
              />
              <span>Full Re-attempt: Clear previous answers &amp; restore code submission quota</span>
            </label>
            <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
              When checked, past answers are cleared (questions will not show as attempted/green) and code run/submit quotas are fully reset for a fresh re-take.
            </p>
          </div>

          <div className="flex gap-2.5 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setRevokeModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => revokeMutation.mutate()}
              loading={revokeMutation.isPending}
            >
              Confirm &amp; Unlock Attempt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

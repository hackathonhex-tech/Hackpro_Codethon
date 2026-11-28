'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, contestsApi } from '@/lib/api';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { PillTabs } from '@/components/ui/PillTabs';
import { Pagination } from '@/components/ui/Pagination';
import Link from 'next/link';
import { ArrowLeft, Download, UserCheck, Users, CheckCircle2, Clock, UserX, Search, Printer, FileText, FileSpreadsheet } from 'lucide-react';
import { exportAttendancePdf } from '@/lib/exportPdf';
import { exportAttendanceExcel } from '@/lib/exportExcel';

interface AttendanceRecord {
  _id: string;
  id?: string;
  userId?: string;
  participantId?: string;
  participantName?: string;
  email?: string;
  name?: string;
  userName?: string;
  rollNumber?: string;
  department?: string;
  teamName?: string;
  status: 'absent' | 'present' | 'completed' | string;
  startedAt?: string | null;
  testStartTimestamp?: string | null;
  submittedAt?: string | null;
  loginStatus?: string;
  durationMinutes?: number;
}

const statusColor: Record<string, 'gray' | 'green' | 'primary'> = {
  absent: 'gray',
  present: 'green',
  completed: 'primary',
};

export default function AttendancePage() {
  const params = useParams<{ contestId: string }>();
  const contestId = typeof params?.contestId === 'string' ? params.contestId : Array.isArray(params?.contestId) ? params.contestId[0] : '';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryClient = useQueryClient();

  const markMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      attendanceApi.mark(contestId, userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', contestId] });
      refetch();
    },
  });

  const { data: contestData } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.get(contestId),
    enabled: !!contestId,
  });
  const contest = contestData as { title?: string } | null;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attendance', contestId, statusFilter, search, page, limit],
    queryFn: () =>
      attendanceApi.getByContest(contestId, {
        status: statusFilter || undefined,
        search,
        page,
        limit,
      }),
    enabled: !!contestId,
  });

  // Safely extract records whether backend returns an array or { records: [...] }
  const records: AttendanceRecord[] = useMemo(() => {
    if (!data) return [];
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as any).records)
      ? (data as any).records
      : Array.isArray((data as any).data)
      ? (data as any).data
      : [];
    return list.map((r: any) => ({
      ...r,
      email: r.email && r.email !== '—' && r.email !== 'null' ? r.email : (r.userEmail || r.candidateEmail || r.participantEmail || '—'),
      name: r.name || r.participantName || r.userName || 'Candidate',
      participantName: r.participantName || r.name || r.userName || 'Candidate',
      contestTitle: r.contestTitle || contest?.title,
      batchCode: r.batchCode || (contest as any)?.batchCode,
    }));
  }, [data, contest]);
  const pagination = (data as any)?.pagination;

  const stats = useMemo(() => {
    const total = (data as any)?.totalAssigned ?? records.length;
    const present = (data as any)?.totalPresent ?? records.filter((r) => r.status === 'present' || r.status === 'completed').length;
    const completed = (data as any)?.totalSubmitted ?? records.filter((r) => r.status === 'completed').length;
    const started = (data as any)?.totalStarted ?? records.filter((r) => r.status === 'present').length;
    const absent = (data as any)?.totalAbsent ?? Math.max(0, total - present);

    return { total, present, completed, started, absent };
  }, [data, records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const pName = String(r.participantName || r.name || r.userName || '').toLowerCase();
      const rNum = String(r.rollNumber || '').toLowerCase();
      const tName = String(r.teamName || '').toLowerCase();
      return pName.includes(q) || rNum.includes(q) || tName.includes(q);
    });
  }, [records, search]);

  const handleExport = async () => {
    try {
      const blob = await attendanceApi.exportCsv(contestId);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${contestId}.csv`;
      a.click();
    } catch {}
  };

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const columns = [
    {
      key: 'rollNumber',
      header: 'Superset ID',
      render: (r: AttendanceRecord) => (
        <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
          {(r.rollNumber && r.rollNumber !== 'null' ? r.rollNumber : '—').replace(/^EMP/i, '')}
        </span>
      ),
    },
    {
      key: 'participantName',
      header: 'Candidate & Email',
      render: (r: AttendanceRecord) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-900 tracking-tight">
            {r.participantName || r.name || r.userName || 'Candidate'}
          </span>
          {r.email && r.email !== '—' && (
            <span className="text-[11px] text-slate-500 font-mono mt-0.5">
              {r.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (r: AttendanceRecord) => (
        <span className="text-xs text-slate-600 font-medium">
          {r.department || '—'}
        </span>
      ),
    },
    {
      key: 'teamName',
      header: 'Team Allocation',
      render: (r: AttendanceRecord) =>
        r.teamName && r.teamName !== 'Individual' ? (
          <Badge color="neon">{r.teamName}</Badge>
        ) : (
          <span className="text-slate-400 text-xs font-medium">Individual</span>
        ),
    },
    {
      key: 'status',
      header: 'Attendance Status',
      render: (r: AttendanceRecord) => (
        <Badge color={statusColor[r.status] || 'gray'} dot>
          {r.status === 'completed'
            ? 'Submitted'
            : r.status === 'present'
            ? (r.testStartTimestamp || r.startedAt ? 'Testing (Active)' : 'Present (Logged In)')
            : 'Absent'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Mark Attendance',
      render: (r: AttendanceRecord) => {
        const uId = r.userId || r.participantId || r.id || r._id;
        const currentStatus = r.status || 'absent';
        return (
          <div className="flex items-center gap-1.5">
            {currentStatus === 'absent' ? (
              <Button
                size="sm"
                variant="outline"
                className="text-[11px] h-7 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300 font-semibold"
                disabled={markMutation.isPending}
                onClick={() => uId && markMutation.mutate({ userId: uId, status: 'present' })}
              >
                Mark Present
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-[11px] h-7 px-2.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300 font-semibold"
                disabled={markMutation.isPending}
                onClick={() => uId && markMutation.mutate({ userId: uId, status: 'absent' })}
              >
                Mark Absent
              </Button>
            )}
            {currentStatus === 'completed' && (
              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                Submitted
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'startedAt',
      header: 'Login Check-in',
      render: (r: AttendanceRecord) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatTime(r.startedAt)}
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Final Turn-in',
      render: (r: AttendanceRecord) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatTime(r.submittedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto print:p-2 print:space-y-4">
      {/* Official Print Header (Visible only when printing/saving to PDF) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="HACKPRO" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">HACKPRO ASSESSMENT PLATFORM</h1>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Candidate Attendance & Telemetry Dossier</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono font-bold text-slate-900">Generated: {new Date().toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-mono">Contest ID: {contestId}</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-slate-100 rounded-lg flex items-center justify-between text-xs font-medium text-slate-800">
          <div><span className="text-slate-500">Contest: </span><strong>{contest?.title || 'Assessment Contest'}</strong></div>
          <div><span className="text-slate-500">Enrolled: </span><strong>{stats.total}</strong></div>
          <div><span className="text-slate-500">Present: </span><strong className="text-emerald-700">{stats.present}</strong></div>
          <div><span className="text-slate-500">Submitted: </span><strong className="text-indigo-700">{stats.completed}</strong></div>
          <div><span className="text-slate-500">Absent: </span><strong className="text-rose-600">{stats.absent}</strong></div>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/contests/${contestId}?tab=attendance`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3760F8] hover:text-[#254EDB] px-3 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Contest Management</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Roster</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {contest?.title || 'Assessment Contest'} &bull; Real-time participant check-ins and session telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportAttendanceExcel({
                contestTitle: contest?.title || (records[0] as any)?.contestTitle || 'Assessment Contest',
                batchCode: (contest as any)?.batchCode || (records[0] as any)?.batchCode || '—',
                records,
              })
            }
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Direct Excel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              exportAttendancePdf({
                contestTitle: contest?.title || (records[0] as any)?.contestTitle || 'Assessment Contest',
                batchCode: (contest as any)?.batchCode || (records[0] as any)?.batchCode || '—',
                stats,
                records,
              })
            }
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Direct PDF
          </Button>
        </div>
      </div>

      {/* Roster Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Enrolled Total</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400">Total assigned candidates</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Attending</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            {stats.present}
          </div>
          <p className="text-[11px] text-slate-400">Present in assessment</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#C7D2FE] p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#3760F8]">
            <span>Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-[#3760F8]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#3760F8] font-mono">
            {stats.completed}
          </div>
          <p className="text-[11px] text-slate-400">Tests finalized and submitted</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Not Started / Absent</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-500 font-mono">
            {stats.absent}
          </div>
          <p className="text-[11px] text-slate-400">Yet to begin assessment</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <PillTabs
            items={[
              { id: '', label: 'All Candidates', count: stats.total },
              { id: 'present', label: 'Present / Started', count: stats.present },
              { id: 'completed', label: 'Submitted', count: stats.completed },
              { id: 'absent', label: 'Absent', count: stats.absent },
            ]}
            activeId={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name, superset ID, or team..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={7} cols={6} />
      ) : (
        <>
          <Table
            columns={columns}
            data={filtered}
            rowKey={(r) => r._id || r.id || r.userId || Math.random().toString()}
            emptyMessage="No attendance records found matching criteria."
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
        </>
      )}
    </div>
  );
}

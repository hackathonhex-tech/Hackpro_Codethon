'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PillTabs } from '@/components/ui/PillTabs';
import { Download, UserCheck, Users, CheckCircle2, UserX, Clock, RefreshCw, FileText, FileSpreadsheet } from 'lucide-react';
import { exportAttendancePdf } from '@/lib/exportPdf';
import { exportAttendanceExcel } from '@/lib/exportExcel';

interface AttendanceRecord {
  id: string;
  _id?: string;
  userId: string;
  participantId?: string;
  participantName: string;
  name?: string;
  email?: string;
  rollNumber: string;
  department?: string;
  teamName?: string;
  status: 'absent' | 'present' | 'completed';
  loginStatus?: string;
  testStartTimestamp?: string;
  submitTimestamp?: string;
  startedAt?: string;
  submittedAt?: string;
  durationMinutes?: number;
}

const statusColor: Record<string, 'gray' | 'green' | 'primary'> = {
  absent: 'gray',
  present: 'green',
  completed: 'primary',
};

export function ContestAttendanceTab({ contestId }: { contestId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['attendance', contestId, statusFilter],
    queryFn: () => attendanceApi.getByContest(contestId, { status: statusFilter || undefined }),
    refetchInterval: 15000,
  });

  const rawRecords: any = (data as any)?.records || (Array.isArray(data) ? data : []);
  const records: AttendanceRecord[] = rawRecords.map((r: any) => ({
    id: r.id || r._id || r.userId,
    userId: r.userId || r.participantId,
    participantName: r.participantName || r.name || 'Candidate',
    name: r.name || r.participantName || 'Candidate',
    email: r.email && r.email !== '—' && r.email !== 'null' ? r.email : (r.userEmail || '—'),
    rollNumber: r.rollNumber && r.rollNumber !== 'null' ? r.rollNumber : '—',
    department: r.department || '—',
    teamName: r.teamName,
    status: r.status || 'absent',
    testStartTimestamp: r.testStartTimestamp || r.startedAt,
    submitTimestamp: r.submitTimestamp || r.submittedAt,
    startedAt: r.startedAt || r.testStartTimestamp,
    submittedAt: r.submittedAt || r.submitTimestamp,
    durationMinutes: r.durationMinutes || 0,
  }));

  const markMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      attendanceApi.mark(contestId, userId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', contestId] });
    },
  });

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.participantName.toLowerCase().includes(q) ||
      r.rollNumber.toLowerCase().includes(q) ||
      (r.teamName || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'present' || r.status === 'completed').length,
    completed: records.filter((r) => r.status === 'completed').length,
    started: records.filter((r) => r.status === 'present').length,
    submitted: records.filter((r) => r.status === 'completed').length,
    absent: records.filter((r) => r.status === 'absent').length,
  };

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
          <span className="text-xs font-semibold text-slate-900 tracking-tight">{r.participantName}</span>
          {r.email && r.email !== '—' && (
            <span className="text-[11px] text-slate-500 font-mono mt-0.5">{r.email}</span>
          )}
        </div>
      ),
    },
    {
      key: 'teamName',
      header: 'Allocation',
      render: (r: AttendanceRecord) =>
        r.teamName && r.teamName !== 'Individual' ? (
          <Badge color="neon">{r.teamName}</Badge>
        ) : (
          <span className="text-slate-400 text-xs font-medium">Individual</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: AttendanceRecord) => (
        <Badge color={statusColor[r.status] || 'gray'} dot>
          {r.status === 'completed'
            ? 'Submitted'
            : r.status === 'present'
            ? 'Testing (Started)'
            : 'Not Started / Absent'}
        </Badge>
      ),
    },
    {
      key: 'startedAt',
      header: 'Started At',
      render: (r: AttendanceRecord) => (
        <span className="text-xs text-slate-500 font-mono">
          {r.testStartTimestamp ? new Date(r.testStartTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted At',
      render: (r: AttendanceRecord) => (
        <span className="text-xs text-slate-500 font-mono">
          {r.submitTimestamp ? new Date(r.submitTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Mark Attendance',
      render: (r: AttendanceRecord) => (
        <div className="flex items-center gap-1.5">
          {r.status === 'absent' && (
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] h-7 px-2"
              disabled={markMutation.isPending}
              onClick={() => markMutation.mutate({ userId: r.userId, status: 'present' })}
            >
              Mark Present
            </Button>
          )}
          {r.status === 'present' && (
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] h-7 px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              disabled={markMutation.isPending}
              onClick={() => markMutation.mutate({ userId: r.userId, status: 'completed' })}
            >
              Mark Submitted
            </Button>
          )}
          {r.status === 'completed' && (
            <span className="text-[11px] text-slate-400 font-medium italic">Finished</span>
          )}
          {r.status !== 'absent' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-[10px] h-6 px-1.5 text-slate-400 hover:text-rose-600"
              disabled={markMutation.isPending}
              onClick={() => markMutation.mutate({ userId: r.userId, status: 'absent' })}
            >
              Reset
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#3760F8]" />
            <span>Attendance &amp; Live Proctoring Status</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time track of enrolled candidates, test starts, and verified submission timestamps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const cTitle = rawRecords[0]?.contestTitle || 'Assessment Contest';
              const bCode = rawRecords[0]?.batchCode || '—';
              exportAttendanceExcel({
                contestTitle: cTitle,
                batchCode: bCode,
                records,
              });
            }}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Direct Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const cTitle = rawRecords[0]?.contestTitle || 'Assessment Contest';
              const bCode = rawRecords[0]?.batchCode || '—';
              exportAttendancePdf({
                contestTitle: cTitle,
                batchCode: bCode,
                stats,
                records,
              });
            }}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Direct PDF
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Enrolled Total</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.total}</div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700 mb-1">
            <span>Started Test</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">{stats.started}</div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 mb-1">
            <span>Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">{stats.submitted}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Not Started / Absent</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-500 font-mono">{stats.absent}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <PillTabs
            items={[
              { id: '', label: 'All Candidates', count: stats.total },
              { id: 'present', label: 'Started', count: stats.started },
              { id: 'completed', label: 'Submitted', count: stats.submitted },
              { id: 'absent', label: 'Absent / Not Started', count: stats.absent },
            ]}
            activeId={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search candidate, Superset ID, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          rowKey={(r) => r.id}
          emptyMessage="No attendance records found for this contest."
        />
      )}
    </div>
  );
}

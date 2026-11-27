'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, contestsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  Users,
  Award,
  Clock,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { exportSubmissionsPdf } from '@/lib/exportPdf';
import { exportSubmissionsExcel } from '@/lib/exportExcel';

export default function ContestAnalyticsReportPage() {
  const { contestId } = useParams<{ contestId: string }>();

  const { data: contestData } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.get(contestId),
  });
  const contest = contestData as { title?: string; durationMinutes?: number } | null;

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics-dashboard', contestId],
    queryFn: () => analyticsApi.getDashboard(contestId),
    refetchInterval: 10000,
  });

  const analytics = analyticsData as any;
  const stats = analytics?.stats || {
    totalRegistered: 0,
    started: 0,
    currentlyAttempting: 0,
    submitted: 0,
    averageScore: 0,
    highestScore: 0,
    averageTimeMinutes: 0,
  };

  const scoreDistribution = analytics?.scoreDistribution || {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
  };

  const topPerformers: any[] = analytics?.topPerformers || [];
  const violationSummary = analytics?.violationSummary || { total: 0, byType: {} };

  const handleExportCsv = () => {
    // Generate detailed analytical CSV
    const rows = [
      ['HACKPRO Assessment Performance Report'],
      ['Contest', contest?.title || 'Contest Assessment'],
      ['Contest ID', contestId],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Summary Metrics', 'Value'],
      ['Total Enrolled Candidates', stats.totalRegistered || stats.started || 0],
      ['Attended & Started', stats.started || 0],
      ['Submissions Recorded', stats.submitted || 0],
      ['Average Score (pts)', stats.averageScore || 0],
      ['Top Benchmark Score (pts)', stats.highestScore || 0],
      ['Average Duration (mins)', stats.averageTimeMinutes || 0],
      ['Total Proctoring Violations', violationSummary.total || 0],
      [],
      ['Candidate Performance Standings'],
      ['Rank', 'Candidate Name', 'Roll Number', 'Score (pts)', 'Duration (mins)'],
    ];

    topPerformers.forEach((p, idx) => {
      rows.push([
        p.rank || idx + 1,
        p.name || p.userId || 'Candidate',
        p.rollNumber || '—',
        p.score ?? 0,
        p.timeTakenMinutes ?? '—',
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HACKPRO_Assessment_Report_${contestId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const totalEvaluated = Math.max(1, stats.submitted || stats.started || 1);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto print:p-0 print:m-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 print:border-none">
        <div className="flex items-center gap-3">
          <Link
            href="/contests"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3760F8] hover:text-[#254EDB] px-3 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors print:hidden"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Contests</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Assessment Analytics & Report
              </h1>
              <Badge color="blue" dot>
                Live Metrics
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {contest?.title || 'HACKPRO National Assessment'} &bull; Comprehensive candidate
              evaluation and cohort performance data
            </p>
          </div>
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
                contestTitle: contest?.title || 'Contest Report',
                submissions: topPerformers,
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
                contestTitle: contest?.title || 'Contest Report',
                submissions: topPerformers,
              })
            }
            leftIcon={<FileText className="w-3.5 h-3.5 text-white" />}
          >
            Direct PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Enrolled</span>
                <Users className="w-4 h-4 text-[#3760F8]" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.totalRegistered || stats.started || 0}
              </p>
              <p className="text-[11px] text-slate-400">Assigned assessment candidates</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Attendance</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.started}</p>
                <span className="text-xs font-bold text-emerald-600">
                  {stats.totalRegistered > 0
                    ? `${Math.round((stats.started / stats.totalRegistered) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Candidates started the test</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.submitted}</p>
              <p className="text-[11px] text-slate-400">Completed test submissions</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
                <TrendingUp className="w-4 h-4 text-[#3760F8]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.averageScore}
                </p>
                <span className="text-xs font-bold text-slate-500">pts</span>
              </div>
              <p className="text-[11px] text-slate-400">Cohort weighted average</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Benchmark</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {stats.highestScore}
                </p>
                <span className="text-xs font-bold text-slate-500">pts</span>
              </div>
              <p className="text-[11px] text-slate-400">Highest score achieved</p>
            </div>
          </div>

          {/* Analytics Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Distribution */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#3760F8]" />
                    <span>Candidate Score Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated score brackets across all test submissions
                  </p>
                </div>
                <Badge color="blue">0 - 100 Points Scale</Badge>
              </div>

              <div className="space-y-3.5 pt-2">
                {[
                  { bracket: '81 - 100 pts', key: '81-100', color: 'bg-emerald-500', barBg: 'bg-emerald-100' },
                  { bracket: '61 - 80 pts', key: '61-80', color: 'bg-[#3760F8]', barBg: 'bg-blue-100' },
                  { bracket: '41 - 60 pts', key: '41-60', color: 'bg-indigo-500', barBg: 'bg-indigo-100' },
                  { bracket: '21 - 40 pts', key: '21-40', color: 'bg-amber-500', barBg: 'bg-amber-100' },
                  { bracket: '0 - 20 pts', key: '0-20', color: 'bg-rose-500', barBg: 'bg-rose-100' },
                ].map((item) => {
                  const count = scoreDistribution[item.key] || 0;
                  const pct = Math.round((count / totalEvaluated) * 100);

                  return (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{item.bracket}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500">{count} candidates</span>
                          <span className="font-bold text-slate-800">{pct}%</span>
                        </div>
                      </div>
                      <div className={`w-full h-2.5 rounded-full ${item.barBg} overflow-hidden`}>
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(count > 0 ? 8 : 0, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assessment Integrity & Proctoring Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Proctoring & Exam Integrity</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated security compliance verification
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">Total Violation Flags</span>
                  <Badge color={violationSummary.total > 0 ? 'red' : 'green'}>
                    {violationSummary.total} Events
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">Overall Integrity Status</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {violationSummary.total === 0 ? '100% Verified Clean' : 'Monitored with Warnings'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">Avg Completion Time</span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {stats.averageTimeMinutes} mins
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Violations Breakdown
                </span>
                {Object.keys(violationSummary.byType || {}).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No violations reported in this session.</p>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(violationSummary.byType).map(([type, count]: [string, any]) => (
                      <div
                        key={type}
                        className="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-slate-600 capitalize">
                          {type.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Performers Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Assessment Standings & Candidate Performance</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rankings based on rubric evaluation and completion metrics
                </p>
              </div>
            </div>

            {topPerformers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No candidate submissions recorded yet for this contest.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    {['Rank', 'Candidate', 'Roll No.', 'Aggregate Score', 'Time Taken', 'Status'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {topPerformers.map((p, idx) => (
                    <tr key={p.userId || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[11px] ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800'
                              : idx === 1
                              ? 'bg-slate-100 text-slate-700'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {p.rank || idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-900">
                        {p.name || p.userId}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-600">
                        {p.rollNumber || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#3760F8]">
                        {p.score ?? 0} pts
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                        {p.timeTakenMinutes !== undefined ? `${p.timeTakenMinutes}m` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <Badge color="green" dot>
                          Submitted & Evaluated
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

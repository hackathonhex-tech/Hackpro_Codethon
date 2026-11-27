'use client';

import { useState, useMemo, Suspense, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { contestsApi, invitationsApi } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  CheckSquare,
  Square,
  Eye,
  Filter,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  Check,
} from 'lucide-react';

function InvitationsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialContestId = searchParams.get('contestId') || '';

  const [selectedContestId, setSelectedContestId] = useState<string>(initialContestId);
  const [isContestDropdownOpen, setIsContestDropdownOpen] = useState(false);
  const contestDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'pending' | 'failed'>('all');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<any>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contestDropdownRef.current && !contestDropdownRef.current.contains(e.target as Node)) {
        setIsContestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch contests list
  const { data: contestsRaw } = useQuery({
    queryKey: ['admin-contests-list'],
    queryFn: () => contestsApi.list(),
  });

  const contests: any[] = Array.isArray(contestsRaw)
    ? contestsRaw
    : (contestsRaw as any)?.data || [];

  // Set default contest if none selected
  const activeContestId = selectedContestId || (contests.length > 0 ? (contests[0].id || contests[0]._id) : '');

  // Fetch invitations data for selected contest
  const {
    data: invitationData,
    isLoading: isLoadingData,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['contest-invitations', activeContestId],
    queryFn: () => invitationsApi.getStatus(activeContestId),
    enabled: Boolean(activeContestId),
    refetchInterval: 15000,
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: ({ contestId, ids }: { contestId: string; ids?: string[] }) =>
      invitationsApi.send(contestId, ids),
    onSuccess: (res: any) => {
      const successful = res?.data?.successful ?? res?.successful ?? 0;
      const failed = res?.data?.failed ?? res?.failed ?? 0;
      setActionSuccessMsg(`Invitations processed successfully: ${successful} dispatched, ${failed} failed.`);
      setActionErrorMsg('');
      setTimeout(() => setActionSuccessMsg(''), 6000);
      setSelectedParticipantIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['contest-invitations', activeContestId] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to dispatch invitations';
      setActionErrorMsg(msg);
      setTimeout(() => setActionErrorMsg(''), 6000);
    },
  });

  const resendFailedMutation = useMutation({
    mutationFn: (contestId: string) => invitationsApi.resendFailed(contestId),
    onSuccess: (res: any) => {
      const successful = res?.data?.successful ?? res?.successful ?? 0;
      setActionSuccessMsg(`Resent failed invitations: ${successful} dispatched.`);
      setActionErrorMsg('');
      setTimeout(() => setActionSuccessMsg(''), 6000);
      queryClient.invalidateQueries({ queryKey: ['contest-invitations', activeContestId] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to resend invitations';
      setActionErrorMsg(msg);
      setTimeout(() => setActionErrorMsg(''), 6000);
    },
  });

  const contestMeta = invitationData?.contest;
  const stats = invitationData?.stats || { total: 0, delivered: 0, pending: 0, failed: 0 };
  const participants: any[] = invitationData?.participants || [];

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (statusFilter !== 'all' && p.invitationStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchEmail = p.email?.toLowerCase().includes(q);
        const matchRoll = p.rollNumber?.toLowerCase().includes(q);
        return matchName || matchEmail || matchRoll;
      }
      return true;
    });
  }, [participants, statusFilter, searchQuery]);

  // Checkbox helpers
  const isAllSelected =
    filteredParticipants.length > 0 &&
    filteredParticipants.every((p) => selectedParticipantIds.has(p.participantId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedParticipantIds(new Set());
    } else {
      const allIds = new Set(filteredParticipants.map((p) => p.participantId));
      setSelectedParticipantIds(allIds);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#3760F8]/10 text-[#3760F8] rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Email Invitation Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Dispatch official assessment invitations with unique batch codes, candidate credentials, and direct login instructions via Brevo automated email delivery.
          </p>
        </div>

        {/* Sleek Custom Contest Selector */}
        <div className="flex items-center gap-2" ref={contestDropdownRef}>
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Contest:</label>
          <div className="relative">
            {(() => {
              const currentContestObj = contests.find((c: any) => (c.id || c._id) === activeContestId) || contests[0];
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setIsContestDropdownOpen((prev) => !prev)}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#3760F8]/30 transition-all min-w-[240px] max-w-[340px] cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{currentContestObj?.title || 'Select Contest'}</span>
                      {currentContestObj?.batchCode && (
                        <span className="text-[10px] font-mono font-bold bg-[#EEF2FF] text-[#3760F8] px-1.5 py-0.5 rounded-md shrink-0">
                          {currentContestObj.batchCode}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isContestDropdownOpen ? 'rotate-180 text-[#3760F8]' : ''}`} />
                  </button>

                  {isContestDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Available Assessments
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-50">
                        {contests.map((c: any) => {
                          const cid = c.id || c._id;
                          const isSelected = cid === activeContestId;
                          return (
                            <button
                              key={cid}
                              type="button"
                              onClick={() => {
                                setSelectedContestId(cid);
                                setSelectedParticipantIds(new Set());
                                setIsContestDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                                isSelected ? 'bg-[#EEF2FF]/80 text-[#3760F8] font-bold' : 'text-slate-700 font-medium'
                              }`}
                            >
                              <div className="flex flex-col truncate pr-2">
                                <span className="truncate">{c.title}</span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  Batch: <strong className="text-slate-600">{c.batchCode || 'N/A'}</strong>
                                </span>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#3760F8] text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Candidates
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Enrolled in contest batch</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Delivered
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{stats.delivered}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Successfully sent via SMTP</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Pending
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">{stats.pending}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting invitation dispatch</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
              Failed
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{stats.failed}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Delivery error / bounced</span>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name, email, roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3760F8]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {selectedParticipantIds.size > 0 && (
              <button
                onClick={() =>
                  sendMutation.mutate({
                    contestId: activeContestId,
                    ids: Array.from(selectedParticipantIds),
                  })
                }
                disabled={sendMutation.isPending}
                className="px-4 py-2 rounded-xl bg-[#3760F8] text-white text-xs font-bold hover:bg-[#254EDB] transition flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sendMutation.isPending
                    ? 'Sending...'
                    : `Send to Selected (${selectedParticipantIds.size})`}
                </span>
              </button>
            )}

            <button
              onClick={() => sendMutation.mutate({ contestId: activeContestId })}
              disabled={sendMutation.isPending || stats.total === 0}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{sendMutation.isPending ? 'Sending All...' : 'Send to All Participants'}</span>
            </button>

            {stats.failed > 0 && (
              <button
                onClick={() => resendFailedMutation.mutate(activeContestId)}
                disabled={resendFailedMutation.isPending}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{resendFailedMutation.isPending ? 'Resending...' : `Resend Failed (${stats.failed})`}</span>
              </button>
            )}

            <button
              onClick={() => {
                setPreviewCandidate(participants[0] || null);
                setShowPreviewModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Template</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter Status:
          </span>
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'delivered', label: `Delivered (${stats.delivered})` },
            { id: 'pending', label: `Pending (${stats.pending})` },
            { id: 'failed', label: `Failed (${stats.failed})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <button onClick={toggleSelectAll} className="cursor-pointer text-slate-500">
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#3760F8]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Candidate Name & Roll</th>
                <th className="py-3 px-4">Registered Email</th>
                <th className="py-3 px-4">Department / College</th>
                <th className="py-3 px-4">Batch Code</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Last Sent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingData ? (
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-4 h-4 bg-slate-200 rounded mx-auto" /></td>
                    <td className="py-3.5 px-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-40 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-16 h-7 bg-slate-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No participants match your query.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const isChecked = selectedParticipantIds.has(p.participantId);
                  return (
                    <tr
                      key={p.participantId}
                      className={`hover:bg-slate-50/80 transition ${isChecked ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleSelectOne(p.participantId)}
                          className="cursor-pointer text-slate-500"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#3760F8]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 font-normal">
                          {p.rollNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{p.email}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.department !== '—' ? p.department : p.college}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                          {p.batchCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.invitationStatus === 'delivered' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered
                          </span>
                        ) : p.invitationStatus === 'failed' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                            title={p.errorMsg || 'Failed to dispatch email'}
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {p.lastSentAt ? new Date(p.lastSentAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            sendMutation.mutate({
                              contestId: activeContestId,
                              ids: [p.participantId],
                            })
                          }
                          disabled={sendMutation.isPending}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-[#3760F8] hover:text-white text-slate-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          {p.invitationStatus === 'delivered' ? 'Resend' : 'Send'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Template Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#3760F8]" />
                <h3 className="font-bold text-sm text-slate-900">Email Invitation Preview</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div>
                  <strong>Sender:</strong> HACKPRO Assessment &lt;hackathonhex@gmail.com&gt;
                </div>
                <div>
                  <strong>Recipient:</strong> {previewCandidate?.name || 'Candidate Name'} &lt;
                  {previewCandidate?.email || 'student@domain.com'}&gt;
                </div>
                <div>
                  <strong>Subject:</strong> [Invitation] Assessment Access: {contestMeta?.title} (Batch:{' '}
                  {contestMeta?.batchCode})
                </div>
              </div>

              {/* Rendered Card Box */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="font-extrabold text-[#3760F8] tracking-wider text-sm">
                    HACKPRO ASSESSMENT
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Official Invitation
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-base text-slate-900">Online Assessment Invitation</h4>
                  <p className="text-xs text-slate-600">
                    Hello {previewCandidate?.name || 'Candidate'}, you have been enrolled in{' '}
                    <strong>{contestMeta?.title || 'Contest'}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Contest Duration:</span>
                    <span className="font-bold text-slate-900">
                      {contestMeta?.durationMinutes || 60} Minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Registered Email:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {previewCandidate?.email || 'student@domain.com'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/70 border-2 border-dashed border-indigo-300 text-center space-y-1">
                  <span className="text-[10px] font-black tracking-widest text-indigo-700 uppercase block">
                    Your Contest Batch Code
                  </span>
                  <span className="text-2xl font-black font-mono text-[#3760F8] tracking-widest">
                    {contestMeta?.batchCode || 'BATCH2026'}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#3760F8]" />
                    Participant Login Instructions:
                  </h5>
                  <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
                    <li>
                      The participant opens the examination portal in their web browser:{' '}
                      <a
                        href="https://contest.hackpro.in/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3760F8] underline font-medium hover:text-blue-700 break-all"
                      >
                        https://contest.hackpro.in/login
                      </a>
                    </li>
                    <li>Enters their registered email ID.</li>
                    <li>Enters the assigned contest batch code.</li>
                    <li>The system verifies the email ID and batch code.</li>
                    <li>Access is granted only when the contest is active.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvitationsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={6} />}>
      <InvitationsContent />
    </Suspense>
  );
}

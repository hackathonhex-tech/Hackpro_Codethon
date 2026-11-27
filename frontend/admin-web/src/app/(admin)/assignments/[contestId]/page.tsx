'use client';
import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi, participantsApi, teamsApi, contestsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { PillTabs } from '@/components/ui/PillTabs';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Users,
  Network,
  CheckCircle2,
  UserCheck,
  Search,
  Filter,
  User,
  AlertCircle,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface Participant {
  _id?: string;
  id?: string;
  rollNumber: string;
  name: string;
  email: string;
  department?: string;
}

interface Team {
  _id?: string;
  id?: string;
  name: string;
  memberIds: string[];
}

interface RawAssignment {
  id?: string;
  _id?: string;
  contestId: string;
  participantId?: string | null;
  teamId?: string | null;
  participant?: Participant | null;
  team?: Team | null;
}

type EnrollmentMode = 'all' | 'individual' | 'team';

export default function AssignmentsPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const qc = useQueryClient();

  const [mode, setMode] = useState<EnrollmentMode>('all');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: contestData } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.get(contestId),
  });
  const contest = contestData as { title?: string; description?: string } | null;

  const { data: assignmentsData, isLoading: aLoading } = useQuery({
    queryKey: ['assignments', contestId],
    queryFn: () => assignmentsApi.getByContest(contestId),
  });

  const rawAssignments: RawAssignment[] = useMemo(() => {
    if (!assignmentsData) return [];
    if (Array.isArray(assignmentsData)) return assignmentsData;
    if (Array.isArray((assignmentsData as any).assignments)) return (assignmentsData as any).assignments;
    return [];
  }, [assignmentsData]);

  const assignedParticipantIds = useMemo(() => {
    const set = new Set<string>();
    rawAssignments.forEach((a) => {
      if (a.participantId) set.add(String(a.participantId));
      if (a.participant?._id) set.add(String(a.participant._id));
      if (a.participant?.id) set.add(String(a.participant.id));
    });
    return set;
  }, [rawAssignments]);

  const assignedTeamIds = useMemo(() => {
    const set = new Set<string>();
    rawAssignments.forEach((a) => {
      if (a.teamId) set.add(String(a.teamId));
      if (a.team?._id) set.add(String(a.team._id));
      if (a.team?.id) set.add(String(a.team.id));
    });
    return set;
  }, [rawAssignments]);

  const { data: participantsData, isLoading: pLoading } = useQuery({
    queryKey: ['participants-all'],
    queryFn: () => participantsApi.list({ limit: 500 }),
  });
  const participants: Participant[] = (participantsData as { data?: Participant[] })?.data || [];

  const { data: teamsData, isLoading: tLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.list,
  });
  const teams: Team[] = (teamsData as Team[]) || [];

  const assignMutation = useMutation({
    mutationFn: (payload: { participantIds: string[]; teamIds: string[] }) => {
      setErrorMsg(null);
      return assignmentsApi.assign(contestId, payload.participantIds, payload.teamIds);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', contestId] });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to assign candidate/team to contest'));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (payload: { participantId?: string; teamId?: string }) => {
      setErrorMsg(null);
      return assignmentsApi.unassign(contestId, payload.participantId, payload.teamId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', contestId] });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to remove candidate/team from contest'));
    },
  });

  const getPId = (p: Participant) => String(p._id || p.id || '');
  const getTId = (t: Team) => String(t._id || t.id || '');

  // Filtered Candidate Collections
  const unassignedCandidates = useMemo(() => {
    return participants.filter((p) => {
      const pid = getPId(p);
      if (assignedParticipantIds.has(pid)) return false;
      if (!candidateSearch.trim()) return true;
      const q = candidateSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.rollNumber.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.department && p.department.toLowerCase().includes(q))
      );
    });
  }, [participants, assignedParticipantIds, candidateSearch]);

  const assignedCandidates = useMemo(() => {
    return participants.filter((p) => {
      const pid = getPId(p);
      if (!assignedParticipantIds.has(pid)) return false;
      if (!candidateSearch.trim()) return true;
      const q = candidateSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.rollNumber.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.department && p.department.toLowerCase().includes(q))
      );
    });
  }, [participants, assignedParticipantIds, candidateSearch]);

  // Filtered Team Collections
  const unassignedTeams = useMemo(() => {
    return teams.filter((t) => {
      const tid = getTId(t);
      if (assignedTeamIds.has(tid)) return false;
      if (!teamSearch.trim()) return true;
      const q = teamSearch.toLowerCase();
      return t.name.toLowerCase().includes(q);
    });
  }, [teams, assignedTeamIds, teamSearch]);

  const assignedTeamsList = useMemo(() => {
    return teams.filter((t) => {
      const tid = getTId(t);
      if (!assignedTeamIds.has(tid)) return false;
      if (!teamSearch.trim()) return true;
      const q = teamSearch.toLowerCase();
      return t.name.toLowerCase().includes(q);
    });
  }, [teams, assignedTeamIds, teamSearch]);

  if (aLoading && !assignmentsData) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  const showIndividuals = mode === 'all' || mode === 'individual';
  const showTeams = mode === 'all' || mode === 'team';

  return (
    <div className="p-6 sm:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href={`/contests/${contestId}?tab=assignments`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3760F8] hover:text-[#254EDB] px-3 py-1.5 rounded-xl bg-[#3760F8]/10 hover:bg-[#3760F8]/15 transition-colors border border-[#3760F8]/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Contest Management</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contest Enrollment Assignments</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {contest?.title || 'Contest'} &bull; Assign individual candidates or collaborative teams
            </p>
          </div>
        </div>

        {/* Enrollment Mode Selector */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto scrollbar-none">
          <PillTabs<EnrollmentMode>
            items={[
              { id: 'all', label: 'All Modes' },
              { id: 'individual', label: 'Individuals Only' },
              { id: 'team', label: 'Teams Only' },
            ]}
            activeId={mode}
            onChange={(m) => setMode(m)}
          />
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/70">
        <button
          onClick={() => setMode('all')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'all'
              ? 'bg-white text-[#3760F8] shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All ({assignedParticipantIds.size} Candidates, {assignedTeamIds.size} Teams)</span>
        </button>
        <button
          onClick={() => setMode('individual')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'individual'
              ? 'bg-white text-[#3760F8] shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Individual Candidates ({assignedParticipantIds.size})</span>
        </button>
        <button
          onClick={() => setMode('team')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'team'
              ? 'bg-white text-[#3760F8] shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Teams ({assignedTeamIds.size})</span>
        </button>
      </div>

      {/* SECTION 1: CANDIDATES ALLOCATION */}
      {showIndividuals && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#3760F8]" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Individual Candidates</h2>
              <span className="text-xs text-slate-400 font-mono">
                ({assignedCandidates.length} enrolled / {participants.length} total)
              </span>
            </div>
            <div className="w-full sm:w-72">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search candidates by name, roll, email..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3760F8]/20 focus:border-[#3760F8] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Unassigned Candidates */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col h-[380px]">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="font-bold text-slate-700 text-xs tracking-tight uppercase">Unassigned Candidates</span>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {unassignedCandidates.length} Available
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
                {unassignedCandidates.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 stroke-1" />
                    <p className="text-xs font-medium text-slate-600">
                      {candidateSearch ? 'No matching candidates found' : 'All registered candidates are enrolled'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {candidateSearch ? 'Try clearing your search query' : 'Register more in the Candidates tab'}
                    </p>
                  </div>
                ) : (
                  unassignedCandidates.map((p) => {
                    const pid = getPId(p);
                    return (
                      <div
                        key={pid}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50/80 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#3760F8]/10 text-[#3760F8] flex items-center justify-center font-bold text-xs shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 tracking-tight block truncate">
                              {p.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                              <span>{p.rollNumber}</span>
                              {p.department && (
                                <>
                                  <span>&bull;</span>
                                  <span className="font-sans text-slate-500">{p.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => assignMutation.mutate({ participantIds: [pid], teamIds: [] })}
                          loading={assignMutation.isPending && assignMutation.variables?.participantIds?.includes(pid)}
                          className="shrink-0 text-xs hover:border-[#3760F8] hover:text-[#3760F8]"
                        >
                          <span>Assign</span>
                          <ArrowRight className="w-3 h-3 text-[#3760F8]" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Enrolled Candidates */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col h-[380px]">
              <div className="px-5 py-3.5 border-b border-emerald-100 bg-emerald-50/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-900 text-xs tracking-tight uppercase">Enrolled Candidates</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {assignedCandidates.length} Enrolled
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
                {assignedCandidates.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <UserCheck className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                    <p className="text-xs font-medium text-slate-600">No candidates enrolled in this contest yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Assign&quot; on available candidates to enroll them</p>
                  </div>
                ) : (
                  assignedCandidates.map((p) => {
                    const pid = getPId(p);
                    return (
                      <div
                        key={pid}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50/80 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 tracking-tight block truncate">
                              {p.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                              <span>{p.rollNumber}</span>
                              {p.department && (
                                <>
                                  <span>&bull;</span>
                                  <span className="font-sans text-slate-500">{p.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => unassignMutation.mutate({ participantId: pid })}
                          disabled={unassignMutation.isPending && unassignMutation.variables?.participantId === pid}
                          className="shrink-0 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          {unassignMutation.isPending && unassignMutation.variables?.participantId === pid ? (
                            'Removing...'
                          ) : (
                            'Remove'
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TEAMS ALLOCATION */}
      {showTeams && (
        <div className="space-y-3.5 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#3760F8]" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Collaborative Teams</h2>
              <span className="text-xs text-slate-400 font-mono">
                ({assignedTeamsList.length} enrolled / {teams.length} total)
              </span>
            </div>
            <div className="w-full sm:w-72">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search teams by name..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3760F8]/20 focus:border-[#3760F8] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Unassigned Teams */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col h-[320px]">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="font-bold text-slate-700 text-xs tracking-tight uppercase">Unassigned Teams</span>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {unassignedTeams.length} Available
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
                {unassignedTeams.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 stroke-1" />
                    <p className="text-xs font-medium text-slate-600">
                      {teamSearch ? 'No matching teams found' : 'All teams are enrolled in this contest'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {teamSearch ? 'Try a different keyword' : 'Create more squads in the Teams tab'}
                    </p>
                  </div>
                ) : (
                  unassignedTeams.map((t) => {
                    const tid = getTId(t);
                    return (
                      <div
                        key={tid}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50/80 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#3760F8]/10 text-[#3760F8] flex items-center justify-center font-bold text-xs shrink-0">
                            <Network className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 tracking-tight block truncate">
                              {t.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {t.memberIds?.length || 0} Member{t.memberIds?.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => assignMutation.mutate({ participantIds: [], teamIds: [tid] })}
                          loading={assignMutation.isPending && assignMutation.variables?.teamIds?.includes(tid)}
                          className="shrink-0 text-xs hover:border-[#3760F8] hover:text-[#3760F8]"
                        >
                          <span>Assign Team</span>
                          <ArrowRight className="w-3 h-3 text-[#3760F8]" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Enrolled Teams */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col h-[320px]">
              <div className="px-5 py-3.5 border-b border-emerald-100 bg-emerald-50/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-900 text-xs tracking-tight uppercase">Enrolled Teams</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {assignedTeamsList.length} Teams
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
                {assignedTeamsList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Network className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                    <p className="text-xs font-medium text-slate-600">No teams enrolled yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Assign Team&quot; on available squads to enroll them</p>
                  </div>
                ) : (
                  assignedTeamsList.map((t) => {
                    const tid = getTId(t);
                    return (
                      <div
                        key={tid}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50/80 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Network className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 tracking-tight block truncate">
                              {t.name}
                            </span>
                            <span className="text-[11px] text-emerald-600 font-medium">
                              {t.memberIds?.length || 0} Enrolled Member{t.memberIds?.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => unassignMutation.mutate({ teamId: tid })}
                          disabled={unassignMutation.isPending && unassignMutation.variables?.teamId === tid}
                          className="shrink-0 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          {unassignMutation.isPending && unassignMutation.variables?.teamId === tid ? (
                            'Removing...'
                          ) : (
                            'Remove'
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

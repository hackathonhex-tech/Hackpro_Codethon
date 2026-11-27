'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi, participantsApi, teamsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { PillTabs } from '@/components/ui/PillTabs';
import {
  Users,
  Network,
  CheckCircle2,
  Search,
  User,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  Filter,
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

export function ContestAssignmentsTab({ contestId }: { contestId: string }) {
  const qc = useQueryClient();

  // Mode: 'individual' or 'team'
  const [mode, setMode] = useState<'individual' | 'team'>('individual');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    queryFn: () => participantsApi.list({ limit: 5000 }),
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
      qc.invalidateQueries({ queryKey: ['attendance', contestId] });
      setSelectedCandidates([]);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to assign to contest'));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (payload: { participantId?: string; teamId?: string }) => {
      setErrorMsg(null);
      return assignmentsApi.unassign(contestId, payload.participantId, payload.teamId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', contestId] });
      qc.invalidateQueries({ queryKey: ['attendance', contestId] });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to remove from contest'));
    },
  });

  const getPId = (p: Participant) => String(p._id || p.id || '');
  const getTId = (t: Team) => String(t._id || t.id || '');

  // Unassigned Individuals
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

  // Assigned Individuals
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

  // Unassigned Teams
  const unassignedTeams = useMemo(() => {
    return teams.filter((t) => {
      const tid = getTId(t);
      if (assignedTeamIds.has(tid)) return false;
      if (!teamSearch.trim()) return true;
      const q = teamSearch.toLowerCase();
      return t.name.toLowerCase().includes(q);
    });
  }, [teams, assignedTeamIds, teamSearch]);

  // Assigned Teams
  const assignedTeamsList = useMemo(() => {
    return teams.filter((t) => {
      const tid = getTId(t);
      if (!assignedTeamIds.has(tid)) return false;
      if (!teamSearch.trim()) return true;
      const q = teamSearch.toLowerCase();
      return t.name.toLowerCase().includes(q);
    });
  }, [teams, assignedTeamIds, teamSearch]);

  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllUnassigned = () => {
    if (selectedCandidates.length === unassignedCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(unassignedCandidates.map(getPId));
    }
  };

  const handleBulkAssignCandidates = () => {
    if (selectedCandidates.length === 0) return;
    assignMutation.mutate({ participantIds: selectedCandidates, teamIds: [] });
  };

  const isLoading = aLoading || pLoading || tLoading;

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#3760F8]" />
            <span>Contest Participant Assignment</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose whether to allocate only individual candidates or only teams for this contest.
          </p>
        </div>

        {/* Modern Pill Mode Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Allocation Target:</span>
          <PillTabs<'individual' | 'team'>
            items={[
              { id: 'individual', label: 'Individual Participants', icon: <User className="w-3.5 h-3.5" /> },
              { id: 'team', label: 'Teams Only', icon: <Users className="w-3.5 h-3.5" /> },
            ]}
            activeId={mode}
            onChange={(m) => {
              setMode(m);
              setSelectedCandidates([]);
            }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : mode === 'individual' ? (
        /* ================== INDIVIDUAL PARTICIPANTS VIEW ================== */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Available / Unassigned */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-[600px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-[#3760F8]" />
                  <span>Available Individual Candidates</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {unassignedCandidates.length} unassigned candidates
                </p>
              </div>

              {unassignedCandidates.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2"
                    onClick={selectAllUnassigned}
                  >
                    {selectedCandidates.length === unassignedCandidates.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-7 px-3 bg-[#3760F8] hover:bg-[#254EDB]"
                    disabled={unassignedCandidates.length === 0 || assignMutation.isPending}
                    loading={assignMutation.isPending}
                    onClick={() => {
                      const targets = selectedCandidates.length > 0 ? selectedCandidates : unassignedCandidates.map(getPId);
                      assignMutation.mutate({ participantIds: targets, teamIds: [] });
                    }}
                  >
                    {selectedCandidates.length > 0
                      ? `Assign Selected (${selectedCandidates.length})`
                      : `Assign All (${unassignedCandidates.length})`}
                  </Button>
                </div>
              )}
            </div>

            <div className="mb-3">
              <Input
                placeholder="Search candidates by name, Superset ID, or email..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {unassignedCandidates.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  {candidateSearch ? 'No matching candidates found.' : 'All candidates are already enrolled.'}
                </div>
              ) : (
                unassignedCandidates.map((p) => {
                  const pid = getPId(p);
                  const isSelected = selectedCandidates.includes(pid);
                  return (
                    <div
                      key={pid}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        isSelected
                          ? 'border-[#3760F8] bg-[#EEF2FF]'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCandidate(pid)}
                          className="w-4 h-4 rounded text-[#3760F8] focus:ring-[#3760F8] cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{p.name}</span>
                            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-semibold">
                              {p.rollNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">{p.email}</div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2.5"
                        disabled={assignMutation.isPending}
                        onClick={() => assignMutation.mutate({ participantIds: [pid], teamIds: [] })}
                      >
                        Assign &rarr;
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Enrolled Individuals */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-[600px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enrolled Candidates ({assignedCandidates.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Currently permitted to participate in this contest
                </p>
              </div>
            </div>

            <div className="mb-3">
              <Input
                placeholder="Search enrolled candidates..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {assignedCandidates.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  No individual candidates assigned to this contest yet.
                </div>
              ) : (
                assignedCandidates.map((p) => {
                  const pid = getPId(p);
                  return (
                    <div
                      key={pid}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{p.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                            {p.rollNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{p.email}</div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        disabled={unassignMutation.isPending}
                        onClick={() => unassignMutation.mutate({ participantId: pid })}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================== TEAMS VIEW ================== */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Available Teams */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-[600px]">
            <div className="pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Network className="w-4 h-4 text-[#3760F8]" />
                <span>Available Teams ({unassignedTeams.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Teams not yet registered in this contest
              </p>
            </div>

            <div className="mb-3">
              <Input
                placeholder="Search teams by name..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {unassignedTeams.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  {teamSearch ? 'No matching teams found.' : 'All teams have been assigned.'}
                </div>
              ) : (
                unassignedTeams.map((t) => {
                  const tid = getTId(t);
                  return (
                    <div
                      key={tid}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{t.name}</h4>
                        <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
                          {t.memberIds?.length || 0} Members
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-3"
                        disabled={assignMutation.isPending}
                        onClick={() => assignMutation.mutate({ participantIds: [], teamIds: [tid] })}
                      >
                        Assign Team &rarr;
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Enrolled Teams */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-[600px]">
            <div className="pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Enrolled Teams ({assignedTeamsList.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Teams assigned to compete in this contest
              </p>
            </div>

            <div className="mb-3">
              <Input
                placeholder="Search enrolled teams..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {assignedTeamsList.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  No teams currently assigned to this contest.
                </div>
              ) : (
                assignedTeamsList.map((t) => {
                  const tid = getTId(t);
                  return (
                    <div
                      key={tid}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{t.name}</h4>
                        <span className="text-[11px] text-slate-400 mt-0.5 inline-block">
                          {t.memberIds?.length || 0} Members
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        disabled={unassignMutation.isPending}
                        onClick={() => unassignMutation.mutate({ teamId: tid })}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove Team
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

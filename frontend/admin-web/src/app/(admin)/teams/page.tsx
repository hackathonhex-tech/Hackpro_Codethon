'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, participantsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, Edit2, Network, UserCheck, AlertCircle } from 'lucide-react';

interface Team {
  _id: string;
  name: string;
  memberIds: string[];
  memberNames?: string[];
}

interface Participant {
  _id: string;
  rollNumber: string;
  name: string;
  email: string;
}

export default function TeamsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', memberIds: [] as string[] });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.list,
  });
  const teams: Team[] = (teamsData as Team[]) || [];

  const { data: participantsData } = useQuery({
    queryKey: ['participants-all'],
    queryFn: () => participantsApi.list({ limit: 500 }),
  });
  const participants: Participant[] = (participantsData as { data?: Participant[] })?.data || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      return teamsApi.create({
        name: form.name.trim(),
        memberIds: form.memberIds,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setShowCreate(false);
      setForm({ name: '', memberIds: [] });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to create team'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      setErrorMsg(null);
      return teamsApi.update(id, {
        name: form.name.trim(),
        memberIds: form.memberIds,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setEditTeam(null);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to update team'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setDeleteId(null);
    },
  });

  const toggleMember = (participantId: string) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(participantId)
        ? f.memberIds.filter((id) => id !== participantId)
        : [...f.memberIds, participantId],
    }));
  };

  const openCreate = () => {
    setErrorMsg(null);
    setForm({ name: '', memberIds: [] });
    setShowCreate(true);
  };

  const openEdit = (team: Team) => {
    setErrorMsg(null);
    setEditTeam(team);
    setForm({ name: team.name, memberIds: team.memberIds || [] });
  };

  const columns = [
    {
      key: 'name',
      header: 'Team Name',
      render: (t: Team) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3760F8]/10 text-[#3760F8] flex items-center justify-center shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-900 tracking-tight text-sm">{t.name}</span>
        </div>
      ),
    },
    {
      key: 'members',
      header: 'Roster Members',
      render: (t: Team) => (
        <Badge color="neon">{(t.memberIds || []).length} Members Enrolled</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: Team) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(t)} leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
            Edit Roster
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            onClick={() => setDeleteId(t._id)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Formations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize and manage collaborative student teams for team-based hackathon rounds
          </p>
        </div>
        <Button size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Create Team
        </Button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={teams}
        loading={isLoading}
        rowKey={(t) => t._id}
        emptyMessage="No teams created yet. Click 'Create Team' to assemble a cohort."
      />

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Team" size="md">
        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Team Name *"
            placeholder="e.g. ByteForce / Neural Knights"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Select Candidates</label>
              <span className="text-xs font-bold text-[#3760F8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
                {form.memberIds.length} Selected
              </span>
            </div>
            <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
              {participants.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No candidates available. Please add candidates in the Participants section first.
                </div>
              ) : (
                participants.map((p) => {
                  const checked = form.memberIds.includes(p._id);
                  return (
                    <label
                      key={p._id}
                      className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                        checked ? 'bg-[#EEF2FF]/60' : 'hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#3760F8] rounded"
                        checked={checked}
                        onChange={() => toggleMember(p._id)}
                      />
                      <span className="text-xs font-mono text-slate-500 font-semibold">{p.rollNumber}</span>
                      <span className="text-xs font-medium text-slate-800">{p.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!form.name.trim()}
            >
              Create Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTeam} onClose={() => setEditTeam(null)} title="Edit Team Roster" size="md">
        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Team Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Select Candidates</label>
              <span className="text-xs font-bold text-[#3760F8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
                {form.memberIds.length} Selected
              </span>
            </div>
            <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
              {participants.map((p) => {
                const checked = form.memberIds.includes(p._id);
                return (
                  <label
                    key={p._id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                      checked ? 'bg-[#EEF2FF]/60' : 'hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#3760F8] rounded"
                      checked={checked}
                      onChange={() => toggleMember(p._id)}
                    />
                    <span className="text-xs font-mono text-slate-500 font-semibold">{p.rollNumber}</span>
                    <span className="text-xs font-medium text-slate-800">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setEditTeam(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => editTeam && updateMutation.mutate({ id: editTeam._id })}
              loading={updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              Save Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Team"
        message="Are you sure you want to delete this team? Member candidates will remain in the system."
        confirmLabel="Delete Team"
        danger
      />
    </div>
  );
}

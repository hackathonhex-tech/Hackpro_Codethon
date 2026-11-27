'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi, rubricsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Copy,
  Clock,
  Trash2,
  Users,
  Trophy,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  Power,
  PowerOff,
  Calendar,
} from 'lucide-react';

interface Contest {
  _id: string;
  id?: string;
  title: string;
  batchCode?: string;
  status: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalMarks?: number;
  rubricId?: string;
  description?: string;
  instructions?: string;
  proctorConfig?: {
    enabled?: boolean;
    detectTabSwitch?: boolean;
    blockCopyPaste?: boolean;
    enforceFullscreen?: boolean;
    blockRightClick?: boolean;
    maxViolations?: number;
  };
  leaderboardConfig?: {
    enabled?: boolean;
    displayMode?: string;
    topN?: number;
  };
  showTotalPointsEarned?: boolean;
  codeRunCooldownSeconds?: number;
  maxCodeSubmissions?: number;
  activationMode?: 'scheduled' | 'manual';
  isTurnedOff?: boolean;
}

interface Rubric {
  _id: string;
  name: string;
}

const statusColor: Record<string, 'gray' | 'green' | 'blue' | 'red'> = {
  draft: 'gray',
  scheduled: 'blue',
  live: 'green',
  completed: 'blue',
  ended: 'gray',
  archived: 'gray',
  cancelled: 'red',
};

const getDefaultForm = () => {
  const now = new Date();
  const later = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  return {
    title: '',
    batchCode: '',
    startTime: formatLocal(now),
    endTime: formatLocal(later),
    durationMinutes: 180,
    totalMarks: 100,
    rubricId: '',
    description: '',
    instructions: '',
    proctorEnabled: true,
    detectTabSwitch: true,
    blockCopyPaste: true,
    enforceFullscreen: true,
    blockRightClick: true,
    maxViolations: 5,
    leaderboardEnabled: true,
    leaderboardAnonymous: false,
    leaderboardTopN: 50,
    showTotalPointsEarned: true,
    codeRunCooldownSeconds: 30,
    maxCodeSubmissions: 3,
    activationMode: 'scheduled',
  };
};

const safeToIso = (val: string | undefined, fallback: Date): string => {
  if (!val || typeof val !== 'string' || !val.trim()) return fallback.toISOString();
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString();

  const parts = val.trim().split(/[-/T\s:]+/);
  if (parts.length >= 3) {
    if (Number(parts[2]) >= 2000) {
      const day = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const year = Number(parts[2]);
      const hour = Number(parts[3]) || 0;
      const min = Number(parts[4]) || 0;
      const parsed = new Date(year, month, day, hour, min);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
    if (Number(parts[0]) >= 2000) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      const hour = Number(parts[3]) || 0;
      const min = Number(parts[4]) || 0;
      const parsed = new Date(year, month, day, hour, min);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }
  return fallback.toISOString();
};

function ContestFormInputs({
  form,
  setForm,
  rubrics,
  idPrefix = 'form',
}: {
  form: ReturnType<typeof getDefaultForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof getDefaultForm>>>;
  rubrics: Rubric[];
  idPrefix?: string;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Contest Title *"
        placeholder="e.g. National Coding Olympiad 2026 - Round 1"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        required
      />

      <div>
        <Input
          label="Batch Code *"
          placeholder="e.g. BATCH2026 or AIML-A"
          value={form.batchCode}
          onChange={(e) => setForm((f) => ({ ...f, batchCode: e.target.value.toUpperCase() }))}
        />
        <p className="mt-1 text-[11px] text-slate-500 font-medium">
          Students will enter this batch code along with their email to attend the test.
        </p>
      </div>

      {/* Activation Mode Selector */}
      <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
          Activation Mode *
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, activationMode: 'scheduled' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              (form.activationMode || 'scheduled') === 'scheduled'
                ? 'border-[#3760F8] bg-blue-50/60 text-[#3760F8] ring-2 ring-[#3760F8]/20 font-bold'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3760F8]" />
              <span className="text-xs font-bold">Scheduled Timer</span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-1 leading-relaxed">
              Auto-opens at start time and closes at end time.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, activationMode: 'manual' }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              form.activationMode === 'manual'
                ? 'border-emerald-600 bg-emerald-50/60 text-emerald-800 ring-2 ring-emerald-600/20 font-bold'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Power className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold">Manual Control</span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal mt-1 leading-relaxed">
              You turn the assessment ON/OFF live using the switch.
            </p>
          </button>
        </div>
      </div>

      {form.activationMode === 'manual' ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Power className="w-3.5 h-3.5 text-emerald-600" />
            Manual Control Active
          </p>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            Scheduled timer is disabled. Students will take the test for the set duration whenever you turn the assessment ON.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Start Window *"
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
          />
          <Input
            label="End Window *"
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Duration (Minutes) *"
          type="number"
          min="5"
          value={String(form.durationMinutes)}
          onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
        />
        <Select
          label="Evaluation Rubric"
          value={form.rubricId}
          onChange={(e) => setForm((f) => ({ ...f, rubricId: e.target.value }))}
        >
          <option value="">Default Standard Evaluation</option>
          {rubrics.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Description (Optional)"
        placeholder="Brief overview or eligibility criteria"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />

      <Input
        label="Instructions for Candidates (Optional)"
        placeholder="e.g. All questions are mandatory. Ensure fullscreen mode."
        value={form.instructions}
        onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
      />

      {/* Security Proctoring Section */}
      <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id={`${idPrefix}_proctorEnabled`}
            className="w-4 h-4 text-[#3760F8] accent-[#3760F8] rounded cursor-pointer"
            checked={form.proctorEnabled}
            onChange={(e) => setForm((f) => ({ ...f, proctorEnabled: e.target.checked }))}
          />
          <label htmlFor={`${idPrefix}_proctorEnabled`} className="text-xs font-bold text-slate-800 cursor-pointer">
            Enable Assessment Proctoring
          </label>
        </div>

        {form.proctorEnabled && (
          <div className="ml-6 space-y-2.5 text-xs text-slate-700 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#3760F8]"
                  checked={form.detectTabSwitch}
                  onChange={(e) => setForm((f) => ({ ...f, detectTabSwitch: e.target.checked }))}
                />
                <span>Detect Tab Switches</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#3760F8]"
                  checked={form.blockCopyPaste}
                  onChange={(e) => setForm((f) => ({ ...f, blockCopyPaste: e.target.checked }))}
                />
                <span>Block Copy &amp; Paste</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#3760F8]"
                  checked={form.enforceFullscreen}
                  onChange={(e) => setForm((f) => ({ ...f, enforceFullscreen: e.target.checked }))}
                />
                <span>Enforce Fullscreen Mode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#3760F8]"
                  checked={form.blockRightClick}
                  onChange={(e) => setForm((f) => ({ ...f, blockRightClick: e.target.checked }))}
                />
                <span>Block Right Click &amp; Inspect</span>
              </label>
            </div>

            <div className="pt-2 max-w-xs">
              <Input
                label="Max Violation Limit Before Flag"
                type="number"
                min="1"
                max="50"
                value={String(form.maxViolations)}
                onChange={(e) => setForm((f) => ({ ...f, maxViolations: Number(e.target.value) }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Settings */}
      <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 bg-slate-50/50">
        <p className="text-xs font-bold text-slate-800">Leaderboard Configuration</p>
        <div className="flex flex-wrap gap-4 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-[#3760F8]"
              checked={form.leaderboardEnabled}
              onChange={(e) => setForm((f) => ({ ...f, leaderboardEnabled: e.target.checked }))}
            />
            <span>Visible to Candidates</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-[#3760F8]"
              checked={form.leaderboardAnonymous}
              onChange={(e) => setForm((f) => ({ ...f, leaderboardAnonymous: e.target.checked }))}
            />
            <span>Anonymize Candidate Names</span>
          </label>
        </div>
      </div>

      {/* Score & Results Configuration */}
      <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 bg-slate-50/50">
        <p className="text-xs font-bold text-slate-800">Score &amp; Results Configuration</p>
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
          <input
            type="checkbox"
            className="w-4 h-4 text-[#3760F8] accent-[#3760F8] rounded cursor-pointer"
            checked={form.showTotalPointsEarned}
            onChange={(e) => setForm((f) => ({ ...f, showTotalPointsEarned: e.target.checked }))}
          />
          <span className="font-semibold text-slate-800">Show Total Points Earned to candidate after test submission</span>
        </label>
        <p className="text-[11px] text-slate-500 ml-6">
          When unchecked, candidate results page will confirm submission but conceal points and score details.
        </p>
      </div>

      {/* Coding Submission Limits & Execution Quotas */}
      <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
        <div>
          <p className="text-xs font-bold text-slate-800">Coding Submission Limits &amp; Execution Quotas</p>
          <p className="text-[11px] text-slate-500">Configure compiler run rate limits and submission quotas for algorithmic challenges.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-codeRunCooldown`} className="text-[11px] font-bold text-slate-700 block mb-1">
              Code Run Cooling Time (seconds)
            </label>
            <Input
              id={`${idPrefix}-codeRunCooldown`}
              type="number"
              min="0"
              max="300"
              value={String(form.codeRunCooldownSeconds ?? 30)}
              onChange={(e) => setForm((f) => ({ ...f, codeRunCooldownSeconds: Math.max(0, Number(e.target.value)) }))}
              placeholder="30"
            />
            <p className="text-[10px] text-slate-500 mt-1">Enforces cooldown between &quot;Run Code&quot; attempts (prevents API spamming).</p>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-maxCodeSubmissions`} className="text-[11px] font-bold text-slate-700 block mb-1">
              Max Code Submissions per Question
            </label>
            <Input
              id={`${idPrefix}-maxCodeSubmissions`}
              type="number"
              min="1"
              max="50"
              value={String(form.maxCodeSubmissions ?? 3)}
              onChange={(e) => setForm((f) => ({ ...f, maxCodeSubmissions: Math.max(1, Number(e.target.value)) }))}
              placeholder="3"
            />
            <p className="text-[10px] text-slate-500 mt-1">Maximum number of times a candidate can submit code per challenge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContestsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editContest, setEditContest] = useState<Contest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(getDefaultForm());
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timingModal, setTimingModal] = useState<{ id: string; title: string } | null>(null);
  const [extensionMin, setExtensionMin] = useState('');
  const [timingReason, setTimingReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['contests', search],
    queryFn: () => contestsApi.list({ search, limit: 50 }),
  });
  const contests: Contest[] = (data as { data?: Contest[] })?.data || [];

  const { data: rubricsData } = useQuery({
    queryKey: ['rubrics'],
    queryFn: rubricsApi.list,
  });
  const rubrics: Rubric[] = (rubricsData as Rubric[]) || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      if (!form.title.trim()) {
        throw new Error('Contest title is required.');
      }
      if (form.title.trim().length < 3) {
        throw new Error('Contest title must be at least 3 characters.');
      }
      if (Number(form.durationMinutes) < 5) {
        throw new Error('Duration must be at least 5 minutes.');
      }

      const isManual = form.activationMode === 'manual';
      const startIso = isManual ? new Date().toISOString() : safeToIso(form.startTime, new Date());
      const endIso = isManual ? new Date(Date.now() + 365 * 86400000).toISOString() : safeToIso(form.endTime, new Date(Date.now() + 86400000));

      if (!isManual && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        throw new Error('End window must be after the start window.');
      }

      return contestsApi.create({
        title: form.title.trim(),
        batchCode: form.batchCode?.trim() || undefined,
        description: form.description.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        activationMode: form.activationMode || 'scheduled',
        startTime: startIso,
        endTime: endIso,
        durationMinutes: Number(form.durationMinutes) || 60,
        rubricId: form.rubricId || undefined,
        proctorConfig: {
          enabled: form.proctorEnabled,
          detectTabSwitch: form.detectTabSwitch,
          detectWindowBlur: true,
          blockCopyPaste: form.blockCopyPaste,
          blockRightClick: form.blockRightClick,
          enforceFullscreen: form.enforceFullscreen,
          blockDevTools: true,
          blockPrintScreen: true,
          blockTextSelection: true,
          maxViolations: Number(form.maxViolations) || 5,
          violationAction: 'warn',
        },
        leaderboardConfig: {
          enabled: form.leaderboardEnabled,
          displayMode: form.leaderboardAnonymous ? 'anonymous' : 'with_names',
          topN: Number(form.leaderboardTopN) || 50,
          freezeMinutesBeforeEnd: 0,
        },
        showTotalPointsEarned: form.showTotalPointsEarned,
        codeRunCooldownSeconds: Number(form.codeRunCooldownSeconds) ?? 30,
        maxCodeSubmissions: Number(form.maxCodeSubmissions) ?? 3,
      });
    },
    onSuccess: (newContest: any) => {
      qc.invalidateQueries({ queryKey: ['contests'] });
      setShowCreate(false);
      setForm(getDefaultForm());
      const newId = newContest?._id || newContest?.id;
      if (newId) {
        router.push(`/contests/${newId}`);
      }
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to create contest'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      setErrorMsg(null);
      if (form.title.trim() && form.title.trim().length < 3) {
        throw new Error('Contest title must be at least 3 characters.');
      }
      const isManual = form.activationMode === 'manual';
      const startIso = isManual ? new Date().toISOString() : (form.startTime ? safeToIso(form.startTime, new Date()) : undefined);
      const endIso = isManual ? new Date(Date.now() + 365 * 86400000).toISOString() : (form.endTime ? safeToIso(form.endTime, new Date(Date.now() + 86400000)) : undefined);

      return contestsApi.update(id, {
        title: form.title.trim(),
        batchCode: form.batchCode?.trim() || undefined,
        description: form.description.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        activationMode: form.activationMode || 'scheduled',
        startTime: startIso,
        endTime: endIso,
        durationMinutes: Number(form.durationMinutes) || 60,
        rubricId: form.rubricId || undefined,
        proctorConfig: {
          enabled: form.proctorEnabled,
          detectTabSwitch: form.detectTabSwitch,
          detectWindowBlur: true,
          blockCopyPaste: form.blockCopyPaste,
          blockRightClick: form.blockRightClick,
          enforceFullscreen: form.enforceFullscreen,
          blockDevTools: true,
          blockPrintScreen: true,
          blockTextSelection: true,
          maxViolations: Number(form.maxViolations) || 5,
          violationAction: 'warn',
        },
        leaderboardConfig: {
          enabled: form.leaderboardEnabled,
          displayMode: form.leaderboardAnonymous ? 'anonymous' : 'with_names',
          topN: Number(form.leaderboardTopN) || 50,
          freezeMinutesBeforeEnd: 0,
        },
        showTotalPointsEarned: form.showTotalPointsEarned,
        codeRunCooldownSeconds: Number(form.codeRunCooldownSeconds) ?? 30,
        maxCodeSubmissions: Number(form.maxCodeSubmissions) ?? 3,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contests'] });
      setEditContest(null);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to update contest'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contestsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contests'] });
      setDeleteId(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => contestsApi.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contests'] }),
  });

  const timingMutation = useMutation({
    mutationFn: ({ id, ext, reason }: { id: string; ext: number; reason: string }) =>
      contestsApi.adjustTiming(id, ext, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contests'] });
      setTimingModal(null);
      setExtensionMin('');
      setTimingReason('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isTurnedOff }: { id: string; isTurnedOff: boolean }) =>
      contestsApi.toggleStatus(id, isTurnedOff),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contests'] });
    },
  });

  const openCreate = () => {
    setErrorMsg(null);
    setForm(getDefaultForm());
    setShowCreate(true);
  };

  const openEdit = (c: Contest) => {
    setErrorMsg(null);
    setEditContest(c);
    setForm({
      ...getDefaultForm(),
      activationMode: c.activationMode || 'scheduled',
      title: c.title,
      batchCode: c.batchCode || '',
      startTime: c.startTime?.slice(0, 16) || '',
      endTime: c.endTime?.slice(0, 16) || '',
      durationMinutes: c.durationMinutes || 60,
      rubricId: c.rubricId || '',
      description: c.description || '',
      instructions: c.instructions || '',
      proctorEnabled: c.proctorConfig?.enabled ?? true,
      detectTabSwitch: c.proctorConfig?.detectTabSwitch ?? true,
      blockCopyPaste: c.proctorConfig?.blockCopyPaste ?? true,
      enforceFullscreen: c.proctorConfig?.enforceFullscreen ?? true,
      blockRightClick: c.proctorConfig?.blockRightClick ?? true,
      maxViolations: c.proctorConfig?.maxViolations ?? 5,
      leaderboardEnabled: c.leaderboardConfig?.enabled ?? true,
      leaderboardAnonymous: c.leaderboardConfig?.displayMode === 'anonymous',
      leaderboardTopN: c.leaderboardConfig?.topN ?? 50,
      showTotalPointsEarned: c.showTotalPointsEarned ?? true,
      codeRunCooldownSeconds: c.codeRunCooldownSeconds ?? 30,
      maxCodeSubmissions: c.maxCodeSubmissions ?? 3,
    });
  };

  const columns = [
    {
      key: 'title',
      header: 'Contest Title',
      render: (c: Contest) => (
        <div>
          <Link
            href={`/contests/${c._id}`}
            className="font-semibold text-slate-900 hover:text-[#3760F8] transition-colors block tracking-tight"
          >
            {c.title}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400 font-mono">ID: {c._id.slice(-6)}</span>
            {c.batchCode && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#3760F8] border border-[#C7D2FE]">
                Batch: {c.batchCode}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Contest) => {
        const isManual = c.activationMode === 'manual';
        const computed = (c as any).computedStatus || c.status;
        return (
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1 flex-wrap">
              <Badge color={isManual ? 'purple' : 'blue'}>
                {isManual ? 'MANUAL' : 'SCHEDULED'}
              </Badge>
              <Badge color={c.isTurnedOff ? 'red' : (statusColor[computed] || 'gray')}>
                {c.isTurnedOff ? 'TURNED OFF' : computed.toUpperCase()}
              </Badge>
            </div>
            {!c.showTotalPointsEarned && (
              <span className="text-[10px] text-slate-500 font-medium">Points Hidden</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (c: Contest) => (
        <span className="text-xs font-mono font-medium text-slate-700">{c.durationMinutes} mins</span>
      ),
    },
    {
      key: 'timing',
      header: 'Timing & Schedule',
      render: (c: Contest) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          {c.activationMode === 'manual' ? (
            <p className="text-emerald-700 font-medium flex items-center gap-1">
              <Power className="w-3 h-3 text-emerald-600" />
              <span>Manual Admin Switch</span>
            </p>
          ) : (
            <>
              <p>Start: {new Date(c.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p>End: {new Date(c.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'security',
      header: 'Proctoring',
      render: (c: Contest) => (
        <Badge color={c.proctorConfig?.enabled ? 'neon' : 'gray'}>
          {c.proctorConfig?.enabled ? 'Strict Lock' : 'Standard'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Contest) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href={`/contests/${c._id}`}>
            <Button variant="ghost" size="sm">
              Manage
            </Button>
          </Link>
          <Button
            variant={c.isTurnedOff ? 'primary' : 'outline'}
            size="sm"
            className={c.isTurnedOff ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' : 'text-amber-700 hover:bg-amber-50 border-amber-300'}
            onClick={() => toggleMutation.mutate({ id: c._id, isTurnedOff: !c.isTurnedOff })}
            leftIcon={c.isTurnedOff ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
          >
            {c.isTurnedOff ? 'Turn ON' : 'Turn OFF'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(c)} leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => duplicateMutation.mutate(c._id)}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Clone
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTimingModal({ id: c._id, title: c.title })}
            leftIcon={<Clock className="w-3.5 h-3.5" />}
          >
            Extend
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            onClick={() => setDeleteId(c._id)}
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessment Contests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, schedule, manage sections &amp; question banks, and monitor live exam environments
          </p>
        </div>
        <Button size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Create Contest
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Filter contests by title or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={contests}
        loading={isLoading}
        rowKey={(c) => c._id}
        emptyMessage="No contests found. Click 'Create Contest' to launch your first assessment."
      />

      {/* Create Contest Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Assessment Contest" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <ContestFormInputs form={form} setForm={setForm} rubrics={rubrics} idPrefix="create" />

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
            >
              Create Contest
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Contest Modal */}
      <Modal open={!!editContest} onClose={() => setEditContest(null)} title="Edit Contest Settings" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <ContestFormInputs form={form} setForm={setForm} rubrics={rubrics} idPrefix="edit" />

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setEditContest(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => editContest && updateMutation.mutate({ id: editContest._id })}
              loading={updateMutation.isPending}
              disabled={!form.title.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Adjust Timing Modal */}
      <Modal open={!!timingModal} onClose={() => setTimingModal(null)} title={`Extend Time &bull; ${timingModal?.title || ''}`}>
        <div className="space-y-4">
          <Input
            label="Extension Minutes"
            type="number"
            min="1"
            placeholder="e.g. 15"
            value={extensionMin}
            onChange={(e) => setExtensionMin(e.target.value)}
          />
          <Input
            label="Reason for Extension"
            placeholder="e.g. Platform network delay resolution"
            value={timingReason}
            onChange={(e) => setTimingReason(e.target.value)}
          />
          <div className="flex gap-2.5 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setTimingModal(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                timingModal &&
                timingMutation.mutate({
                  id: timingModal.id,
                  ext: Number(extensionMin),
                  reason: timingReason,
                })
              }
              loading={timingMutation.isPending}
              disabled={!extensionMin || !timingReason}
            >
              Apply Extension
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Contest Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Contest"
        message="Are you sure you want to delete this contest? All question associations, participant rosters, and attempts will be permanently erased."
        confirmLabel="Delete Contest"
        danger
      />
    </div>
  );
}

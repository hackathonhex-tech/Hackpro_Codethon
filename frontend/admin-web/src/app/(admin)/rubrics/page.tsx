'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rubricsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, Edit2, Copy, Scale, CheckCircle2, AlertCircle } from 'lucide-react';

interface Criterion {
  id?: string;
  name: string;
  weight: number | string;
}

interface Rubric {
  _id: string;
  name: string;
  description?: string;
  criteria: Criterion[];
}

const DEFAULT_CRITERIA: Criterion[] = [
  { name: 'Correctness & Test Cases', weight: 60 },
  { name: 'Code Quality & Efficiency', weight: 40 },
];

export default function RubricsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editRubric, setEditRubric] = useState<Rubric | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    criteria: Criterion[];
  }>({
    name: '',
    description: '',
    criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })),
  });

  const { data: rubricsData, isLoading } = useQuery({
    queryKey: ['rubrics'],
    queryFn: rubricsApi.list,
  });
  const rubrics: Rubric[] = (rubricsData as Rubric[]) || [];

  const totalWeight = form.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);

  const createMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      if (Math.round(totalWeight) !== 100) {
        throw new Error(`Total weightage must equal 100%. Current sum: ${totalWeight}%`);
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        criteria: form.criteria.map((c) => ({
          name: c.name.trim() || 'Criterion',
          type: 'test_cases_passed_pct',
          weight: Number(c.weight) || 0,
        })),
      };
      return rubricsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rubrics'] });
      setShowCreate(false);
      setForm({ name: '', description: '', criteria: DEFAULT_CRITERIA.map((c) => ({ ...c })) });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to create rubric'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      setErrorMsg(null);
      if (Math.round(totalWeight) !== 100) {
        throw new Error(`Total weightage must equal 100%. Current sum: ${totalWeight}%`);
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        criteria: form.criteria.map((c) => ({
          name: c.name.trim() || 'Criterion',
          type: 'test_cases_passed_pct',
          weight: Number(c.weight) || 0,
        })),
      };
      return rubricsApi.update(id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rubrics'] });
      setEditRubric(null);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to update rubric'));
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => rubricsApi.clone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rubrics'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rubricsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rubrics'] });
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setErrorMsg(null);
    setForm({
      name: '',
      description: '',
      criteria: [
        { name: 'Correctness & Test Cases', weight: 60 },
        { name: 'Code Quality & Efficiency', weight: 40 },
      ],
    });
    setShowCreate(true);
  };

  const openEdit = (r: Rubric) => {
    setErrorMsg(null);
    setEditRubric(r);
    setForm({
      name: r.name,
      description: r.description || '',
      criteria: r.criteria.map((c) => ({
        name: c.name,
        weight: c.weight,
      })),
    });
  };

  const addCriterion = () => {
    setForm((f) => ({
      ...f,
      criteria: [
        ...f.criteria,
        {
          name: '',
          weight: Math.max(0, 100 - totalWeight),
        },
      ],
    }));
  };

  const removeCriterion = (idx: number) => {
    setForm((f) => ({ ...f, criteria: f.criteria.filter((_, i) => i !== idx) }));
  };

  const updateCriterion = (idx: number, field: string, value: any) => {
    setForm((f) => ({
      ...f,
      criteria: f.criteria.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));
  };

  const columns = [
    {
      key: 'name',
      header: 'Rubric Name',
      render: (r: Rubric) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3760F8]/10 text-[#3760F8] flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 tracking-tight text-sm block">{r.name}</span>
            {r.description && <span className="text-xs text-slate-500 line-clamp-1">{r.description}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'criteria',
      header: 'Scoring Dimensions (Criterion & Weightage)',
      render: (r: Rubric) => (
        <div className="flex gap-1.5 flex-wrap">
          {r.criteria.map((c, i) => (
            <span
              key={i}
              className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
            >
              {c.name}: <strong className="text-[#3760F8]">{c.weight}%</strong>
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: Rubric) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cloneMutation.mutate(r._id)}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Clone
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(r)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(r._id)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evaluation Rubrics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure weighted scoring criteria to evaluate assessment performance.
          </p>
        </div>
        <Button size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Create Rubric
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={rubrics}
        loading={isLoading}
        rowKey={(r) => r._id}
        emptyMessage="No evaluation rubrics found. Click 'Create Rubric' to configure scoring dimensions."
      />

      {/* Create / Edit Modal */}
      <Modal
        open={showCreate || !!editRubric}
        onClose={() => {
          setShowCreate(false);
          setEditRubric(null);
        }}
        title={editRubric ? 'Edit Evaluation Rubric' : 'Create New Evaluation Rubric'}
        size="lg"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Rubric Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Standard Coding Assessment Rubric"
            required
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description (Optional)</label>
            <textarea
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief details about this scoring rubric..."
            />
          </div>

          {/* Scoring Dimensions Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">Scoring Dimensions</label>
                <p className="text-[11px] text-slate-500">Define criterion names and their weightage percentage.</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${
                    Math.round(totalWeight) === 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  Total Weight: {totalWeight}%
                </span>
                <Button size="sm" variant="outline" onClick={addCriterion} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Criterion
                </Button>
              </div>
            </div>

            {/* Criteria List */}
            <div className="space-y-2.5">
              {form.criteria.map((crit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80"
                >
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Criterion Name *
                    </label>
                    <input
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none"
                      value={crit.name}
                      onChange={(e) => updateCriterion(idx, 'name', e.target.value)}
                      placeholder="e.g. Correctness / Test Cases"
                    />
                  </div>

                  <div className="w-32">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Weightage (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white font-mono font-bold focus:ring-2 focus:ring-[#3760F8]/30 focus:outline-none pr-7"
                        value={String(crit.weight)}
                        onChange={(e) => updateCriterion(idx, 'weight', Number(e.target.value))}
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400 pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>

                  {form.criteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriterion(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors mt-4"
                      title="Remove Criterion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCreate(false);
                setEditRubric(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (editRubric) {
                  updateMutation.mutate({ id: editRubric._id });
                } else {
                  createMutation.mutate();
                }
              }}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim() || Math.round(totalWeight) !== 100}
            >
              {editRubric ? 'Save Changes' : 'Create Rubric'}
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
        title="Delete Evaluation Rubric"
        message="Are you sure you want to remove this rubric? Contests referencing it may fallback to standard default evaluation."
        confirmLabel="Delete Rubric"
        danger
      />
    </div>
  );
}

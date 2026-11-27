'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { Plus, ShieldCheck, Lock, Edit2, Trash2, AlertCircle } from 'lucide-react';

interface Role {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
}

interface PermItem {
  key: string;
  label: string;
  superAdminOnly?: boolean;
}

interface PermModule {
  module: string;
  label: string;
  permissions: PermItem[];
}

export default function RolesPage() {
  const qc = useQueryClient();
  const { isSuperAdmin, user } = useAdminAuthStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', permissions: [] as string[] });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
  });
  const roles: Role[] = Array.isArray(rolesData) ? rolesData : (rolesData as any)?.data || [];

  const { data: permsData, isLoading: permsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: rolesApi.getPermissions,
  });

  // Extract modules array safely from backend response
  const rawPerms: any = permsData || {};
  const permModules: PermModule[] =
    rawPerms.modules || rawPerms.data?.modules || (Array.isArray(rawPerms) ? rawPerms : []);

  const createMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      return rolesApi.create({
        name: form.name.trim(),
        permissions: form.permissions,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      setShowCreate(false);
      setForm({ name: '', permissions: [] });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to create role'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      setErrorMsg(null);
      return rolesApi.update(id, {
        name: form.name.trim(),
        permissions: form.permissions,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      setEditRole(null);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to update role'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      setDeleteId(null);
    },
  });

  const togglePermission = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const openCreate = () => {
    setErrorMsg(null);
    setForm({ name: '', permissions: [] });
    setShowCreate(true);
  };

  const openEdit = (role: Role) => {
    setErrorMsg(null);
    setEditRole(role);
    setForm({ name: role.name, permissions: Array.isArray(role.permissions) ? [...role.permissions] : [] });
  };

  const columns = [
    {
      key: 'name',
      header: 'Role Profile',
      render: (r: Role) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3760F8]/10 text-[#3760F8] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 tracking-tight text-sm block">{r.name}</span>
            {r.description && <span className="text-[11px] text-slate-500 line-clamp-1">{r.description}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'System Classification',
      render: (r: Role) => (
        <Badge color={r.isSystem ? 'primary' : 'neon'}>
          {r.isSystem ? 'Protected Core Role' : 'Custom Defined'}
        </Badge>
      ),
    },
    {
      key: 'permCount',
      header: 'Granted Permissions',
      render: (r: Role) => (
        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {(r.permissions || []).length} Scope Keys
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Operations',
      render: (r: Role) =>
        r.isSystem ? (
          <span className="text-xs text-slate-400 font-medium">Immutable</span>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEdit(r)} leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
              Edit Matrix
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => setDeleteId(r._id || r.id!)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>
        ),
    },
  ];

  const isLoading = rolesLoading || permsLoading;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Roles &amp; Permission Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure fine-grained role-based access control (RBAC) grants and feature capabilities
          </p>
        </div>
        <Button size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Create Custom Role
        </Button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={roles}
        loading={isLoading}
        rowKey={(r) => r._id || r.id || r.name}
        emptyMessage="No custom roles created yet."
      />

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Custom Role" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Role Name *"
            placeholder="e.g. Assessment Evaluator"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">Permission Capabilities Matrix</label>
              <span className="text-xs font-bold text-[#3760F8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
                {form.permissions.length} Perms Active
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto bg-slate-50/40 divide-y divide-slate-200">
              {permModules.map((group) => (
                <div key={group.module}>
                  <div className="bg-slate-100/90 px-4 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    {group.label || group.module}
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(group.permissions || []).map((perm: any) => {
                      const key = typeof perm === 'string' ? perm : perm.key;
                      const label = typeof perm === 'string' ? perm.replace(/[._]/g, ' ') : perm.label || perm.key;
                      const checked = form.permissions.includes(key);
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            checked ? 'bg-[#EEF2FF] text-[#3760F8] font-semibold' : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-[#3760F8] accent-[#3760F8] rounded"
                            checked={checked}
                            onChange={() => togglePermission(key)}
                          />
                          <span className="truncate">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {permModules.length === 0 && (
                <div className="p-8 text-xs text-slate-400 text-center">Loading permission definitions...</div>
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
              Create Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editRole} onClose={() => setEditRole(null)} title="Edit Role Permissions" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Role Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">Permission Capabilities Matrix</label>
              <span className="text-xs font-bold text-[#3760F8] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
                {form.permissions.length} Perms Active
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto bg-slate-50/40 divide-y divide-slate-200">
              {permModules.map((group) => (
                <div key={group.module}>
                  <div className="bg-slate-100/90 px-4 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    {group.label || group.module}
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(group.permissions || []).map((perm: any) => {
                      const key = typeof perm === 'string' ? perm : perm.key;
                      const label = typeof perm === 'string' ? perm.replace(/[._]/g, ' ') : perm.label || perm.key;
                      const checked = form.permissions.includes(key);
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            checked ? 'bg-[#EEF2FF] text-[#3760F8] font-semibold' : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-[#3760F8] accent-[#3760F8] rounded"
                            checked={checked}
                            onChange={() => togglePermission(key)}
                          />
                          <span className="truncate">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setEditRole(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => editRole && updateMutation.mutate({ id: editRole._id || editRole.id! })}
              loading={updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              Save Changes
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
        title="Delete Custom Role"
        message="Are you sure you want to delete this custom role? Assigned staff members will lose associated permissions."
        confirmLabel="Delete Role"
        danger
      />
    </div>
  );
}

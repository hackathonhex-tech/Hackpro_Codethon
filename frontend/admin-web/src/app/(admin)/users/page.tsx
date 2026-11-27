'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { Plus, UserCog, Trash2, Shield, Lock, AlertCircle, Users, CheckCircle2 } from 'lucide-react';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
  roleId?: string;
  roleName?: string;
  isActive?: boolean;
}

interface Role {
  _id: string;
  id?: string;
  name: string;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAdminAuthStore();

  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });
  const users: User[] = (usersData as { data?: User[] })?.data || (Array.isArray(usersData) ? usersData : []);

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
  });
  const roles: Role[] = (rolesData as { data?: Role[] })?.data || (Array.isArray(rolesData) ? rolesData : []);

  // Compute available role categories with member counts
  const roleTabs = useMemo(() => {
    const list: { id: string; label: string; count: number }[] = [
      { id: 'all', label: 'All Staff', count: users.length },
    ];

    roles
      .filter((r) => r.id !== 'student' && r.name.toLowerCase() !== 'student')
      .forEach((r) => {
      const roleKey = r._id || r.id || r.name;
      const count = users.filter((u) => {
        const uRole = (u.role || u.roleId || u.roleName || '').toLowerCase();
        const rName = r.name.toLowerCase();
        const rId = String(r._id || r.id || '').toLowerCase();
        return uRole === rName || uRole === rId || (u.roleName && u.roleName.toLowerCase() === rName);
      }).length;
      list.push({ id: roleKey, label: r.name, count });
    });

    // Also include Super Admin tab if not already present
    if (!list.some((t) => t.label.toLowerCase().includes('super'))) {
      const superCount = users.filter((u) =>
        (u.role || u.roleName || '').toLowerCase().includes('super')
      ).length;
      if (superCount > 0) {
        list.splice(1, 0, { id: 'super_admin', label: 'Super Admin', count: superCount });
      }
    }

    return list;
  }, [users, roles]);

  // Filter users by selected role
  const filteredUsers = useMemo(() => {
    if (selectedRole === 'all') return users;

    const targetTab = roleTabs.find((t) => t.id === selectedRole);
    const targetLabel = (targetTab?.label || selectedRole).toLowerCase();

    return users.filter((u) => {
      const uRole = (u.role || '').toLowerCase();
      const uRoleName = (u.roleName || '').toLowerCase();
      const uRoleId = String(u.roleId || '').toLowerCase();
      const sId = String(selectedRole).toLowerCase();

      return (
        uRoleId === sId ||
        uRole === sId ||
        uRoleName === targetLabel ||
        uRole.includes(targetLabel) ||
        uRoleName.includes(targetLabel)
      );
    });
  }, [users, selectedRole, roleTabs]);

  const createMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      const targetRole = form.roleId || 'admin';
      return usersApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        role: targetRole,
        roleId: targetRole,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', roleId: '' });
      setSuccessMsg('Staff member registered successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to create user'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => usersApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      setErrorMsg(null);
      setSuccessMsg('User account deleted successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to delete user account'));
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setErrorMsg(null);
    setForm({ name: '', email: '', password: '', roleId: '' });
    setShowCreate(true);
  };

  const columns = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (u: User) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs tracking-tight block">{u.name}</span>
          <span className="text-[11px] font-mono text-slate-400">{u.email}</span>
        </div>
      ),
    },
    {
      key: 'roleName',
      header: 'Assigned Role',
      render: (u: User) => {
        const isSuper = (u.role || u.roleName || '').toLowerCase().includes('super');
        return (
          <Badge color={isSuper ? 'purple' : 'primary'}>
            {u.roleName || (u.role ? u.role.replace(/_/g, ' ').toUpperCase() : 'Staff Admin')}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (u: User) => (
        <Badge color={u.isActive !== false ? 'green' : 'red'} dot>
          {u.isActive !== false ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Operations',
      render: (u: User) => {
        const isSuper =
          (u.role || u.roleName || '').toLowerCase().includes('super') ||
          u.email?.toLowerCase() === 'superadmin@hackpro.dev';

        if (isSuper) {
          return (
            <span className="text-[11px] font-semibold text-slate-400 italic">
              Super Admin (Protected)
            </span>
          );
        }

        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleActiveMutation.mutate({ id: u._id || u.id!, isActive: !u.isActive })}
              className={`text-xs font-semibold hover:underline ${
                u.isActive !== false ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {u.isActive !== false ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={() => setDeleteId(u._id || u.id!)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  const isLoading = usersLoading || rolesLoading;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage administrative personnel, assign roles, and handle staff credentials
          </p>
        </div>
        <Button size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Add Staff Member
        </Button>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="flex items-center justify-between gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {roleTabs.map((tab) => {
          const isSelected = selectedRole === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedRole(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-[#3760F8] text-white shadow-xs ring-2 ring-[#3760F8]/20'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <Table
        columns={columns}
        data={filteredUsers}
        loading={isLoading}
        rowKey={(u) => u._id || u.id || u.email}
        emptyMessage={`No staff members found for ${roleTabs.find((t) => t.id === selectedRole)?.label || 'this role'}.`}
      />

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Staff Member">
        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Full Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Sarah Jenkins"
            required
          />
          <Input
            label="Email Address *"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="sarah@university.edu"
            required
          />
          <Input
            label="Password *"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="At least 6 characters"
            required
          />
          <Select
            label="Administrative Role"
            value={form.roleId}
            onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
          >
            <option value="">Default Operational Admin</option>
            {roles
              .filter((r) => r.id !== 'student' && r.name.toLowerCase() !== 'student')
              .map((r) => (
                <option key={r._id || r.id} value={r._id || r.id}>
                  {r.name}
                </option>
              ))}
          </Select>
          <div className="flex gap-2.5 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!form.name.trim() || !form.email.trim() || !form.password.trim()}
            >
              Add Staff
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Delete Staff Account"
        message="Are you sure you want to permanently delete this user account? This action cannot be undone."
        confirmLabel="Delete User"
        danger
      />
    </div>
  );
}

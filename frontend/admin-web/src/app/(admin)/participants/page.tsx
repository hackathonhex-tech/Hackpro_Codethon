'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/apiClient';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import {
  Plus,
  UploadCloud,
  Download,
  Trash2,
  Search,
  User,
  Network,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Mail,
} from 'lucide-react';

interface Participant {
  _id: string;
  rollNumber: string;
  name: string;
  email: string;
  department?: string;
  teamName?: string;
}

export default function ParticipantsPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ rollNumber: '', name: '', email: '', department: '', password: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['participants', search, page, limit],
    queryFn: () => participantsApi.list({ search, page, limit }),
  });
  const participants: Participant[] = (data as { data?: Participant[] })?.data || [];
  const pagination = (data as any)?.pagination;

  const createMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      const trimmedPassword = form.password.trim();
      if (trimmedPassword && trimmedPassword.length < 6) {
        throw new Error('Password must be at least 6 characters (or leave blank to auto-assign)');
      }
      return participantsApi.create({
        rollNumber: form.rollNumber.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim() || 'Computer Science',
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants'] });
      setShowCreate(false);
      setForm({ rollNumber: '', name: '', email: '', department: '', password: '' });
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to register candidate'));
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      return participantsApi.importCsv(csvText);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants'] });
      setShowImport(false);
      setCsvText('');
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'CSV Import failed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => participantsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants'] });
      setDeleteId(null);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => participantsApi.deleteAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants'] });
      setShowDeleteAllConfirm(false);
      setPage(1);
    },
    onError: (err: any) => {
      setErrorMsg(getErrorMessage(err, 'Failed to delete all candidates'));
      setShowDeleteAllConfirm(false);
    },
  });

  const handleExport = async () => {
    try {
      const blob = await participantsApi.exportCsv();
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'participants.csv';
      a.click();
    } catch {}
  };

  const openCreate = () => {
    setErrorMsg(null);
    setForm({ rollNumber: '', name: '', email: '', department: '', password: '' });
    setShowCreate(true);
  };

  const openImport = () => {
    setErrorMsg(null);
    setCsvText('');
    setUploadedFileName(null);
    setParsedPreview([]);
    setShowImport(true);
  };

  const downloadSampleTemplate = () => {
    const templateContent = 'Name,Mail ID,Superset ID\nJohn Doe,john.doe@example.com,SUP2026101\nJane Smith,jane.smith@example.com,SUP2026102\n';
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hackpro_candidate_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setErrorMsg(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          setCsvText(csv);

          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
          setParsedPreview(jsonData.slice(0, 5));
        } catch (err: any) {
          setErrorMsg('Failed to parse Excel file. Please ensure valid .xlsx or .xls format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          setCsvText(text);

          // Parse preview from CSV text
          const lines = text.trim().split('\n').filter(Boolean);
          if (lines.length > 1) {
            const headers = lines[0].split(',').map((h) => h.trim());
            const sampleRows = lines.slice(1, 6).map((line) => {
              const vals = line.split(',').map((v) => v.trim());
              const rowObj: any = {};
              headers.forEach((h, i) => {
                rowObj[h] = vals[i] || '';
              });
              return rowObj;
            });
            setParsedPreview(sampleRows);
          }
        } catch (err) {
          setErrorMsg('Failed to read CSV file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const columns = [
    {
      key: 'rollNumber',
      header: 'Superset ID',
      render: (p: Participant) => (
        <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          {p.rollNumber}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Candidate Name',
      render: (p: Participant) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#3760F8]/10 text-[#3760F8] flex items-center justify-center text-xs font-bold shrink-0">
            {p.name ? p.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <span className="font-semibold text-slate-900 tracking-tight text-xs">{p.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email Address',
      render: (p: Participant) => (
        <span className="text-xs text-slate-600 font-mono font-medium">{p.email || '—'}</span>
      ),
    },
    {
      key: 'team',
      header: 'Team Association',
      render: (p: Participant) =>
        p.teamName ? (
          <Badge color="neon">{p.teamName}</Badge>
        ) : (
          <span className="text-xs text-slate-400 italic">Individual</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Participant) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          onClick={() => setDeleteId(p._id)}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Roster</h1>
          <p className="text-xs text-slate-500 mt-1">Manage student identities, single registration, and bulk CSV ingestion</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/invitations">
            <Button variant="outline" size="sm" leftIcon={<Mail className="w-3.5 h-3.5 text-[#3760F8]" />}>
              Send Invitations
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={openImport} leftIcon={<UploadCloud className="w-3.5 h-3.5" />}>
            Bulk CSV
          </Button>
          <Button size="sm" onClick={openCreate} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Candidate
          </Button>
          {participants.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
              onClick={() => setShowDeleteAllConfirm(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            >
              Delete All
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Filter by Superset ID, name, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Table
        columns={columns}
        data={participants}
        loading={isLoading}
        rowKey={(p) => p._id}
        emptyMessage="No candidates registered yet. Click 'Add Candidate' or 'Bulk CSV'."
      />

      {pagination && (
        <Pagination
          page={page}
          totalPages={pagination.totalPages || 1}
          total={pagination.total || 0}
          limit={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Single Candidate">
        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Email Address *"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="student@university.edu"
            required
            helperText="Only email ID is mandatory. Student attends test by entering their email and the contest batch code."
          />
          <Input
            label="Candidate Name (Optional)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. John Doe (auto-derived from email if empty)"
          />
          <Input
            label="Superset ID (Optional)"
            value={form.rollNumber}
            onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))}
            placeholder="e.g. SUP2026001 (auto-generated if empty)"
          />
          <Input
            label="Default Password (Optional)"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Default: Hackpro@2026"
            helperText="Default: 'Hackpro@2026'. Candidates can also log in directly with their email and contest batch code."
          />
          <div className="flex gap-2.5 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!form.email.trim() || !form.email.includes('@')}
            >
              Add Candidate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Bulk Import Candidates (Excel / CSV)" size="lg">
        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Header & Sample Template Download */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Supported Formats:</span> .xlsx, .xls, .csv
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadSampleTemplate}
              leftIcon={<Download className="w-3.5 h-3.5 text-slate-500" />}
            >
              Download Sample Template (.csv)
            </Button>
          </div>

          {/* File Picker Drag & Drop Box */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-[#3760F8] rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-[#EEF2FF]/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#3760F8] group-hover:bg-[#3760F8] group-hover:text-white flex items-center justify-center mx-auto mb-3 transition-colors shadow-2xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#3760F8] transition-colors">
              {uploadedFileName ? uploadedFileName : 'Click to Upload Excel (.xlsx) or CSV File'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {uploadedFileName
                ? 'File ready for verification and batch enrollment'
                : 'Or drag and drop your spreadsheet here'}
            </p>
          </div>

          {/* Preview of Parsed Rows */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-white">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Spreadsheet Preview (First {parsedPreview.length} Candidates)
                </span>
                <span className="text-slate-400 font-normal">
                  Total lines: {csvText.trim().split('\n').filter(Boolean).length - 1}
                </span>
              </div>
              <div className="overflow-x-auto max-h-40">
                <table className="min-w-full divide-y divide-slate-100 text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold">
                      <th className="px-2.5 py-1.5 text-left">Superset ID</th>
                      <th className="px-2.5 py-1.5 text-left">Candidate Name</th>
                      <th className="px-2.5 py-1.5 text-left">Mail ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPreview.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-2.5 py-1 font-mono font-bold text-slate-700">
                          {row.supersetId || row['Superset ID'] || row['super set id'] || row['Super Set ID'] || row['superset id'] || row.employeeId || row['Employee ID'] || row.empId || row.rollNumber || row['Roll Number'] || row['Roll No'] || '—'}
                        </td>
                        <td className="px-2.5 py-1 font-semibold text-slate-900">
                          {row.name || row['Name'] || row['Candidate Name'] || row['candidateName'] || row['Student Name'] || row['Full Name'] || '—'}
                        </td>
                        <td className="px-2.5 py-1 text-slate-600 font-mono">
                          {row.email || row['Email'] || row['Mail ID'] || row['mail id'] || row['MailId'] || row['Mail'] || row['mail'] || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Collapsible / Optional CSV Raw Edit Area */}
          <details className="text-xs">
            <summary className="text-slate-500 hover:text-slate-800 cursor-pointer font-medium select-none">
              View / Edit Raw CSV Data
            </summary>
            <textarea
              className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-[#3760F8] focus:outline-none h-32 bg-slate-50/50"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Name,Mail ID,Superset ID"
            />
          </details>

          <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setShowImport(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => importMutation.mutate()}
              loading={importMutation.isPending}
              disabled={!csvText.trim()}
            >
              {importMutation.isPending ? 'Importing Batch...' : 'Confirm & Import Batch'}
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
        title="Delete Candidate Record"
        message="Are you sure you want to remove this student? All attendance records, submissions, and contest attempts will be erased."
        confirmLabel="Delete Candidate"
        danger
      />

      {/* Delete All Confirmation */}
      <ConfirmDialog
        open={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={() => deleteAllMutation.mutate()}
        loading={deleteAllMutation.isPending}
        title="Delete All Candidates"
        message="Are you sure you want to delete ALL candidates from the roster? This will erase all student accounts, registrations, and attendance records so you can re-import cleanly."
        confirmLabel="Yes, Delete All"
        danger
      />
    </div>
  );
}

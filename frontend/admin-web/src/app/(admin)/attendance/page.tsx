'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { contestsApi } from '@/lib/api';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserCheck, Search, Calendar, Clock, ChevronRight } from 'lucide-react';

interface Contest {
  _id: string;
  id?: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export default function AttendanceHubPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-contests', search],
    queryFn: () => contestsApi.list({ search, limit: 50 }),
  });

  const contests: Contest[] = (data as { data?: Contest[] })?.data || (Array.isArray(data) ? data : []);

  const columns = [
    {
      key: 'title',
      header: 'Contest Name',
      render: (c: Contest) => (
        <div>
          <span className="font-bold text-slate-900 text-xs tracking-tight block">{c.title}</span>
          <span className="text-[11px] font-mono text-slate-400">ID: {(c._id || c.id || '').slice(-6)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Contest) => {
        const isLive = c.status === 'live';
        return (
          <Badge color={isLive ? 'green' : c.status === 'scheduled' ? 'blue' : 'gray'}>
            {c.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'timing',
      header: 'Scheduled Window',
      render: (c: Contest) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <p>Duration: {c.durationMinutes} mins</p>
          <p className="text-[11px] text-slate-400">
            {new Date(c.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Attendance Action',
      render: (c: Contest) => {
        const targetId = c._id || c.id;
        return (
          <Link href={`/attendance/${targetId}`}>
            <Button variant="outline" size="sm" leftIcon={<UserCheck className="w-3.5 h-3.5 text-[#3760F8]" />}>
              View Candidate Attendance
            </Button>
          </Link>
        );
      },
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track candidate presence, start timestamps, submission status, and export verification attendance sheets
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Filter contests by title or session ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={contests}
        loading={isLoading}
        rowKey={(c) => c._id || c.id || ''}
        emptyMessage="No contests available for attendance inspection."
      />
    </div>
  );
}

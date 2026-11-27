import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found.',
  rowKey,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80">
            <thead className="bg-slate-50/80">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${
                      c.className || ''
                    }`}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {Array.from({ length: 7 }, (_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((c, cIdx) => (
                    <td key={c.key} className="px-5 py-4">
                      <div
                        className="h-4 bg-slate-200/80 rounded-md"
                        style={{
                          width: cIdx === 0 ? '70%' : cIdx === columns.length - 1 ? '40%' : '55%',
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200/80">
          <thead className="bg-slate-50/80 backdrop-blur-xs">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${
                    c.className || ''
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50/70 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-3.5 text-sm text-slate-800">
                      {c.render ? c.render(row) : ((row as Record<string, unknown>)[c.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

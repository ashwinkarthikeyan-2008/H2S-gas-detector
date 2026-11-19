import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SkeletonTable } from './Skeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchFilter,
  pageSize = 10,
  emptyTitle = 'No Records Found',
  emptyDescription = 'Try adjusting your search or filters to see results.',
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    if (searchFilter) {
      return data.filter((row) => searchFilter(row, q));
    }
    // Default search against all column values
    return data.filter((row) => {
      return columns.some((col) => {
        const val = col.sortValue ? col.sortValue(row) : (row as any)[col.key];
        return String(val ?? '').toLowerCase().includes(q);
      });
    });
  }, [data, searchQuery, searchFilter, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = col.sortValue ? col.sortValue(a) : (a as any)[sortKey];
      const bVal = col.sortValue ? col.sortValue(b) : (b as any)[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let result = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal;
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, safeCurrentPage, rowsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
    );
  };

  if (loading) {
    return <SkeletonTable rows={pageSize} columns={columns.length} className={className} />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search and count header */}
      {searchable && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-midnight-950/90 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 transition font-sans"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span>
              Showing <strong className="text-white font-semibold">{sortedData.length}</strong> entries
            </span>
          </div>
        </div>
      )}

      {/* Table Surface */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-midnight-900/85 to-midnight-950/90 backdrop-blur-xl overflow-hidden shadow-card-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-midnight-950/90 text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800/90 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                {columns.map((col) => {
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                  return (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-4 py-3.5 font-semibold ${alignClass} ${
                        col.sortable
                          ? 'cursor-pointer hover:text-cyan-400 select-none transition-colors'
                          : ''
                      }`}
                    >
                      <div
                        className={`inline-flex items-center space-x-1.5 ${
                          col.align === 'right' ? 'justify-end' : ''
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.sortable && getSortIcon(col.key)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      onAction={() => setSearchQuery('')}
                      actionText={searchQuery ? 'Clear Search' : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors duration-150 even:bg-white/[0.015] ${
                      onRowClick
                        ? 'cursor-pointer hover:bg-cyan-500/8 hover:text-slate-100'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-slate-300 font-sans ${alignClass}`}
                        >
                          {col.render ? col.render(row) : (row as any)[col.key]}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedData.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-800/80 bg-midnight-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-midnight-900 border border-slate-700/80 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <span>
                Page <strong className="text-white">{safeCurrentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong>
              </span>

              <div className="flex items-center space-x-1">
                <button
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-midnight-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition hover:border-cyan-500/40"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-midnight-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition hover:border-cyan-500/40"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

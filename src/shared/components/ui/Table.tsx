/**
 * Table Component
 * Online MBA - Data table with sorting, pagination, and selection
 */

import React, { memo, useState, useCallback, useMemo, ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================
// Types
// ============================================

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (item: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  /** Table columns configuration */
  columns: Column<T>[];
  /** Data to display */
  data: T[];
  /** Unique key for each row */
  keyExtractor: (item: T) => string;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Enable pagination */
  pagination?: boolean;
  /** Items per page */
  pageSize?: number;
  /** Current page (controlled) */
  currentPage?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Enable striped rows */
  striped?: boolean;
  /** Enable hover effect */
  hoverable?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

// ============================================
// Table Component
// ============================================

function TableComponent<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowClick,
  pagination = false,
  pageSize = 10,
  currentPage: controlledPage,
  onPageChange,
  striped = false,
  hoverable = true,
  compact = false,
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [internalPage, setInternalPage] = useState(1);

  const currentPage = controlledPage ?? internalPage;
  const setCurrentPage = onPageChange ?? setInternalPage;

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    const allKeys = new Set(paginatedData.map(keyExtractor));
    const allSelected = Array.from(allKeys).every((key) => selectedKeys.has(key));

    if (allSelected) {
      const newKeys = new Set(selectedKeys);
      allKeys.forEach((key) => newKeys.delete(key));
      onSelectionChange(newKeys);
    } else {
      const newKeys = new Set(selectedKeys);
      allKeys.forEach((key) => newKeys.add(key));
      onSelectionChange(newKeys);
    }
  }, [paginatedData, keyExtractor, selectedKeys, onSelectionChange]);

  const handleSelectRow = useCallback(
    (key: string) => {
      if (!onSelectionChange) return;

      const newKeys = new Set(selectedKeys);
      if (newKeys.has(key)) {
        newKeys.delete(key);
      } else {
        newKeys.add(key);
      }
      onSelectionChange(newKeys);
    },
    [selectedKeys, onSelectionChange]
  );

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedKeys.has(keyExtractor(item)));
  const someSelected =
    paginatedData.some((item) => selectedKeys.has(keyExtractor(item))) &&
    !allSelected;

  return (
    <div className={cn('overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              {selectable && (
                <th className={cn('w-12', compact ? 'px-3 py-2' : 'px-4 py-3')}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-500 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider',
                    compact ? 'px-3 py-2' : 'px-4 py-3',
                    column.sortable && 'cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-200',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className={cn('flex items-center gap-1', column.align === 'right' && 'justify-end', column.align === 'center' && 'justify-center')}>
                    {column.header}
                    {column.sortable && sortKey === String(column.key) && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {loading ? (
              [...Array(pageSize)].map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className={cn(compact ? 'px-3 py-2' : 'px-4 py-3')}>
                      <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn(compact ? 'px-3 py-2' : 'px-4 py-3')}>
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const key = keyExtractor(item);
                const isSelected = selectedKeys.has(key);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      'bg-white dark:bg-neutral-950',
                      striped && index % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-900/50',
                      hoverable && 'hover:bg-neutral-50 dark:hover:bg-neutral-900',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-primary-50 dark:bg-primary-950/30'
                    )}
                  >
                    {selectable && (
                      <td className={cn(compact ? 'px-3 py-2' : 'px-4 py-3')}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(key)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-500 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'text-sm text-neutral-900 dark:text-neutral-100',
                          compact ? 'px-3 py-2' : 'px-4 py-3',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render
                          ? column.render(item, index)
                          : String((item as Record<string, unknown>)[String(column.key)] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === 1
                  ? 'text-neutral-400 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                      page === currentPage
                        ? 'bg-primary-500 text-white'
                        : 'text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                    )}
                  >
                    {page}
                  </button>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="text-neutral-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPage === totalPages
                  ? 'text-neutral-400 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const Table = memo(TableComponent) as typeof TableComponent;

export default Table;

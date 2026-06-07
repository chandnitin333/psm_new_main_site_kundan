import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Trash2, Eye, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableAction<T> {
  icon: 'edit' | 'delete' | 'view';
  label: string;
  onClick: (row: T) => void;
  className?: string;
  show?: (row: T) => boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: TableAction<T>[];
  pageSize?: number;
  showPagination?: boolean;
  className?: string;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  actions,
  pageSize = 10,
  showPagination = true,
  className = '',
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
  searchable = false,
  searchPlaceholder = 'Search...',
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;

    return data.filter((row) => {
      return columns.some((column) => {
        const value = row[column.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns, searchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = showPagination
    ? sortedData.slice(startIndex, endIndex)
    : sortedData;

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getActionIcon = (iconType: 'edit' | 'delete' | 'view') => {
    switch (iconType) {
      case 'edit':
        return Edit;
      case 'delete':
        return Trash2;
      case 'view':
        return Eye;
      default:
        return Edit;
    }
  };

  // Combine columns with actions column if actions are provided
  const allColumns = useMemo(() => {
    if (!actions || actions.length === 0) return columns;

    return [
      ...columns,
      {
        key: 'actions',
        label: 'Actions',
        width: `${actions.length * 50}px`,
        sortable: false,
        render: (row: T) => (
          <div className="flex gap-2">
            {actions.map((action, index) => {
              const shouldShow = action.show ? action.show(row) : true;
              if (!shouldShow) return null;

              const IconComponent = getActionIcon(action.icon);
              const defaultClassName = action.icon === 'delete'
                ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                : action.icon === 'view'
                ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300';

              return (
                <button
                  key={index}
                  onClick={() => action.onClick(row)}
                  className={`p-1 ${action.className || defaultClassName}`}
                  title={action.label}
                >
                  <IconComponent className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        ),
      },
    ];
  }, [columns, actions]);

  return (
    <div className={`w-full ${className}`}>
      {/* Search Box */}
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {allColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="text-primary-600 dark:text-primary-500">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={allColumns.length}
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${
                    striped && rowIndex % 2 === 1
                      ? 'bg-gray-50 dark:bg-gray-800'
                      : ''
                  } ${hoverable ? 'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : ''}`}
                >
                  {allColumns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 text-sm text-gray-900 dark:text-white"
                    >
                      {column.render
                        ? column.render(row)
                        : row[column.key]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of{' '}
            {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  // Add ellipsis
                  const showEllipsisBefore =
                    index > 0 && page - array[index - 1] > 1;
                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsisBefore && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => goToPage(page)}
                        className={`min-w-[2.5rem] px-3 py-2 rounded-lg border transition-colors ${
                          currentPage === page
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;

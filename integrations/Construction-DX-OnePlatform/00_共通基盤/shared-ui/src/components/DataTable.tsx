import {
  useMemo,
  useState,
  type ReactNode,
  type Key,
} from 'react';
import { ChevronUp, ChevronDown, Search, Inbox } from 'lucide-react';
import { cn } from '../utils/cn';

export interface DataTableColumn<T> {
  /** カラム識別子 (ソート/keyに使用) */
  key: string;
  /** 表示ヘッダー (日本語ラベル) */
  header: ReactNode;
  /** 値抽出 or レンダラ */
  accessor?: (row: T) => ReactNode;
  /** ソート用の比較値 (number/string) */
  sortValue?: (row: T) => number | string | Date;
  /** ソート可能か */
  sortable?: boolean;
  /** カラム幅 (任意) */
  width?: string | number;
  /** 配置 */
  align?: 'left' | 'center' | 'right';
  /** 文字列フィルタ対象に含めるか */
  filterable?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** 各行のユニークキー */
  rowKey: (row: T, index: number) => Key;
  /** ページサイズ (省略で 10) */
  pageSize?: number;
  /** ページネーション無効化 */
  disablePagination?: boolean;
  /** 行クリックハンドラ */
  onRowClick?: (row: T) => void;
  /** 空状態に表示するメッセージ */
  emptyMessage?: ReactNode;
  /** 検索ボックスを表示 */
  searchable?: boolean;
  /** 追加クラス */
  className?: string;
  /** テーブルキャプション (アクセシビリティ用) */
  caption?: string;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

/**
 * 型安全なジェネリック DataTable。
 * - クライアントサイド ソート / 全文フィルタ / ページネーション
 */
export function DataTable<T>(props: DataTableProps<T>): JSX.Element {
  const {
    columns,
    data,
    rowKey,
    pageSize = 10,
    disablePagination = false,
    onRowClick,
    emptyMessage = 'データがありません',
    searchable = true,
    className,
    caption,
  } = props;

  const [sort, setSort] = useState<SortState>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!filter.trim()) return data;
    const q = filter.toLowerCase();
    const filterableCols = columns.filter((c) => c.filterable !== false);
    return data.filter((row) =>
      filterableCols.some((c) => {
        const v = c.accessor ? c.accessor(row) : (row as Record<string, unknown>)[c.key];
        return String(v ?? '')
          .toLowerCase()
          .includes(q);
      }),
    );
  }, [data, filter, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const valueOf = (row: T) => {
      if (col.sortValue) return col.sortValue(row);
      if (col.accessor) return String(col.accessor(row) ?? '');
      return String((row as Record<string, unknown>)[col.key] ?? '');
    };
    const sortedArr = [...filtered].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedArr;
  }, [filtered, sort, columns]);

  const totalPages = disablePagination ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = disablePagination
    ? sorted
    : sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const toggleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  return (
    <div className={cn('w-full', className)}>
      {searchable && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
              placeholder="検索..."
              aria-label="テーブル検索"
              className="cdx-input pl-9"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto cdx-card">
        <table className="w-full text-sm" role="table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'px-3 py-2 font-semibold text-left whitespace-nowrap border-b border-slate-200',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.sortable && 'cursor-pointer select-none hover:bg-slate-100',
                    )}
                    aria-sort={
                      isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                    onClick={() => toggleSort(col.key, col.sortable)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <span aria-hidden="true" className="inline-flex flex-col">
                          {isSorted && sort.dir === 'asc' ? (
                            <ChevronUp size={12} />
                          ) : isSorted && sort.dir === 'desc' ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronDown size={12} className="opacity-30" />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={32} aria-hidden="true" className="text-slate-300" />
                    <div>{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr
                  key={rowKey(row, idx)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-slate-100 last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-slate-50',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-2 align-middle',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                      )}
                    >
                      {col.accessor
                        ? col.accessor(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!disablePagination && sorted.length > 0 && (
        <div className="flex items-center justify-between mt-3 text-sm text-slate-600">
          <div>
            {sorted.length} 件中 {currentPage * pageSize + 1} -{' '}
            {Math.min((currentPage + 1) * pageSize, sorted.length)} 件
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              aria-label="前のページ"
            >
              前へ
            </button>
            <span aria-live="polite">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="次のページ"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

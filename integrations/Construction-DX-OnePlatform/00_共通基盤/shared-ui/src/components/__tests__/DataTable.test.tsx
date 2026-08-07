import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type DataTableColumn } from '../DataTable';

interface Row {
  id: number;
  name: string;
  qty: number;
}

const rows: Row[] = [
  { id: 1, name: '鉄筋', qty: 100 },
  { id: 2, name: 'セメント', qty: 50 },
  { id: 3, name: '砕石', qty: 200 },
];

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: '資材名', accessor: (r) => r.name, sortable: true },
  { key: 'qty', header: '数量', accessor: (r) => r.qty, sortable: true, sortValue: (r) => r.qty },
];

describe('DataTable', () => {
  it('行データを描画し、行クリックハンドラを呼び出す', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    expect(screen.getByText('鉄筋')).toBeInTheDocument();
    expect(screen.getByText('セメント')).toBeInTheDocument();
    fireEvent.click(screen.getByText('鉄筋'));
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it('空状態を表示する', () => {
    render(
      <DataTable columns={columns} data={[]} rowKey={(r) => r.id} emptyMessage="該当なし" />,
    );
    expect(screen.getByText('該当なし')).toBeInTheDocument();
  });
});

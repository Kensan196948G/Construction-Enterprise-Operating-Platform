import type { Meta, StoryObj } from '@storybook/react';
import { DataTable, type DataTableColumn } from '../DataTable';

interface Material {
  id: number;
  name: string;
  qty: number;
  unit: string;
}

const data: Material[] = [
  { id: 1, name: '異形鉄筋 D13', qty: 1200, unit: '本' },
  { id: 2, name: '生コンクリート 24-15-20', qty: 80, unit: 'm³' },
  { id: 3, name: '型枠用合板 t12', qty: 150, unit: '枚' },
  { id: 4, name: 'H形鋼 H-300x300', qty: 24, unit: '本' },
];

const columns: DataTableColumn<Material>[] = [
  { key: 'name', header: '資材名', accessor: (r) => r.name, sortable: true, filterable: true },
  {
    key: 'qty',
    header: '数量',
    accessor: (r) => r.qty,
    sortValue: (r) => r.qty,
    sortable: true,
    align: 'right',
  },
  { key: 'unit', header: '単位', accessor: (r) => r.unit, align: 'center' },
];

// DataTable はジェネリック関数。Storybook の型付けは具体型 (Material) で十分。
const MaterialTable = DataTable as (props: {
  columns: DataTableColumn<Material>[];
  data: Material[];
  rowKey: (row: Material, index: number) => string | number;
  pageSize?: number;
  searchable?: boolean;
  caption?: string;
}) => JSX.Element;

const meta: Meta<typeof MaterialTable> = {
  title: 'Foundation/DataTable',
  component: MaterialTable,
};
export default meta;

type Story = StoryObj<typeof MaterialTable>;

export const Default: Story = {
  args: {
    columns,
    data,
    rowKey: (r: Material) => r.id,
    searchable: true,
    pageSize: 10,
    caption: '資材在庫一覧',
  },
};

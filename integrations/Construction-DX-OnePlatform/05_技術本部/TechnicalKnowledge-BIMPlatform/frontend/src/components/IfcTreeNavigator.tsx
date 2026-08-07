import { useState } from 'react';

export type IfcEntityNode = {
  id: string;
  type: string;
  name?: string;
  children?: IfcEntityNode[];
};

type Props = {
  root?: IfcEntityNode;
  onSelect?: (node: IfcEntityNode) => void;
};

/**
 * IFC エンティティ階層ナビゲータ。
 * 実 IFC ロード後は web-ifc の spatial tree から生成する。骨格では渡された木を再帰表示。
 */
export default function IfcTreeNavigator({ root, onSelect }: Props) {
  const sample: IfcEntityNode = root ?? {
    id: '1',
    type: 'IfcProject',
    name: 'Sample Project',
    children: [
      {
        id: '2',
        type: 'IfcSite',
        name: 'Site',
        children: [
          {
            id: '3',
            type: 'IfcBuilding',
            name: 'Bldg-A',
            children: [
              { id: '4', type: 'IfcBuildingStorey', name: '1F' },
              { id: '5', type: 'IfcBuildingStorey', name: '2F' },
            ],
          },
        ],
      },
    ],
  };
  return (
    <div className="bg-white rounded shadow p-3 text-sm">
      <h3 className="font-semibold mb-2">エンティティ階層</h3>
      <TreeNode node={sample} onSelect={onSelect} />
    </div>
  );
}

function TreeNode({
  node,
  onSelect,
}: {
  node: IfcEntityNode;
  onSelect?: (n: IfcEntityNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="pl-2">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          onSelect?.(node);
        }}
        className="text-left hover:text-tech-primary"
      >
        {hasChildren ? (open ? '▾' : '▸') : '·'} <span className="font-mono">{node.type}</span>
        {node.name ? ` ${node.name}` : ''}
      </button>
      {open &&
        node.children?.map((c) => <TreeNode key={c.id} node={c} onSelect={onSelect} />)}
    </div>
  );
}

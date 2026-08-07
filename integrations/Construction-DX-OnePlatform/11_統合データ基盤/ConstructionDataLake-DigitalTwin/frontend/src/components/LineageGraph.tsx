/**
 * Lineage graph SVG renderer — lightweight; renders nodes as columns by kind
 * and draws arrows between them. Suitable for skeleton-level visualization;
 * swap for cytoscape in a follow-up.
 */
interface LineageNode {
  node_id: string;
  kind: string;
  label: string;
}
interface LineageEdge {
  src: string;
  dst: string;
  op?: string;
}
interface Props {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

const COL_ORDER = ["source", "table", "dataset", "model"];

export default function LineageGraph({ nodes, edges }: Props) {
  const grouped = COL_ORDER.map((kind) => nodes.filter((n) => n.kind === kind));
  const W = 240;
  const H_ROW = 48;
  const positions = new Map<string, { x: number; y: number }>();
  grouped.forEach((col, ci) => {
    col.forEach((n, ri) => {
      positions.set(n.node_id, { x: ci * W + 20, y: ri * H_ROW + 30 });
    });
  });
  const maxRows = Math.max(1, ...grouped.map((c) => c.length));
  const width = COL_ORDER.length * W + 40;
  const height = maxRows * H_ROW + 60;

  return (
    <svg width={width} height={height} className="border border-slate-200 bg-white rounded">
      {edges.map((e, i) => {
        const a = positions.get(e.src);
        const b = positions.get(e.dst);
        if (!a || !b) return null;
        return (
          <g key={i}>
            <line x1={a.x + 180} y1={a.y + 12} x2={b.x} y2={b.y + 12} stroke="#94a3b8" strokeWidth={1.2} />
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = positions.get(n.node_id);
        if (!p) return null;
        return (
          <g key={n.node_id} transform={`translate(${p.x},${p.y})`}>
            <rect width={180} height={28} rx={6} fill="#0EA5E9" opacity={0.85} />
            <text x={8} y={18} fill="#fff" fontSize={11}>
              {n.label}
            </text>
          </g>
        );
      })}
      {COL_ORDER.map((k, i) => (
        <text key={k} x={i * W + 20} y={18} fill="#475569" fontSize={11} fontWeight={600}>
          {k.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

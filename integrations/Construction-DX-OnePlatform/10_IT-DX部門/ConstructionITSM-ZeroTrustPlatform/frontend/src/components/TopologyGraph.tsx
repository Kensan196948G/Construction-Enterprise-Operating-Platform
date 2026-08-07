import { useEffect, useRef } from "react";
import cytoscape, { ElementDefinition } from "cytoscape";
// cytoscape-dagre は型定義を公開していないため ambient 宣言で any 扱い
// @ts-expect-error -- no type declarations available for cytoscape-dagre
import dagre from "cytoscape-dagre";

cytoscape.use(dagre);

export interface TopologyNode {
  id: string;
  label: string;
  type: string;
  status: string;
}
export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface Props {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export default function TopologyGraph({ nodes, edges }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const elements: ElementDefinition[] = [
      ...nodes.map((n) => ({
        data: { id: n.id, label: `${n.label}\n(${n.type})` },
        classes: n.status
      })),
      ...edges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target, label: e.type }
      }))
    ];
    const cy = cytoscape({
      container: ref.current,
      elements,
      layout: { name: "dagre", rankDir: "LR" } as cytoscape.LayoutOptions,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-wrap": "wrap",
            "text-valign": "center",
            "background-color": "#1F6FEB",
            color: "#fff",
            "font-size": 10,
            width: 80,
            height: 40,
            shape: "round-rectangle"
          }
        },
        {
          selector: "node.retired",
          style: { "background-color": "#9CA3AF" }
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            label: "data(label)",
            "font-size": 8,
            "line-color": "#94A3B8",
            "target-arrow-color": "#94A3B8"
          }
        }
      ]
    });
    return () => cy.destroy();
  }, [nodes, edges]);

  return <div ref={ref} className="w-full h-[480px] bg-white border rounded" />;
}

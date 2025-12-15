"use client";

import { useEffect, useState, useRef } from "react";
import cytoscape, { Core, ElementDefinition } from "cytoscape";

interface GraphNode {
  id: string;
  name: string;
  type: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const NODE_COLORS: Record<string, string> = {
  Organization: "#3b82f6",
  Person: "#ef4444",
  Concept: "#8b5cf6",
  Location: "#22c55e",
  Event: "#f59e0b",
  Default: "#6b7280",
};

interface GraphViewProps {
  refreshTrigger?: number;
  sessionId?: string;
  queryId?: string | null;  // For per-lesson filtering
  onStatsUpdate?: (nodes: number, edges: number) => void;
}

export default function GraphView({ refreshTrigger = 0, sessionId, queryId, onStatsUpdate }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [status, setStatus] = useState<"loading" | "empty" | "ready">("loading");
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);

  // Fetch graph data
  useEffect(() => {
    const fetchGraphData = async () => {
      setStatus("loading");
      if (onStatsUpdate) onStatsUpdate(0, 0);

      try {
        // Build URL with filters
        const params = new URLSearchParams();
        if (sessionId) params.append("session_id", sessionId);
        if (queryId) params.append("query_id", queryId);
        const url = `${API_URL}/api/graph?${params.toString()}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch graph");
        const data = await res.json();

        if (data.nodes) {
          if (onStatsUpdate) onStatsUpdate(data.nodes.length, data.edges.length);
        }

        if (!data.nodes?.length) {
          setGraphData(null);
          setStatus("empty");
          return;
        }

        setGraphData(data);
        setStatus("ready");
      } catch (e) {
        console.error("Graph fetch error:", e);
        setStatus("empty");
      }
    };

    fetchGraphData();
  }, [refreshTrigger]);

  // Render graph when data is ready AND container is mounted
  useEffect(() => {
    if (status !== "ready" || !graphData || !containerRef.current) {
      return;
    }

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const elements: ElementDefinition[] = [
      ...graphData.nodes.map((n: GraphNode) => ({
        data: {
          id: n.id,
          label: n.name,
          type: n.type,
          color: NODE_COLORS[n.type] || NODE_COLORS.Default,
        },
      })),
      ...graphData.edges.map((e: GraphEdge) => ({
        data: {
          id: `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.type,
        },
      })),
    ];

    // Create Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            color: "#fff",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "12px",
            "font-weight": 600,
            "text-wrap": "wrap",
            "text-max-width": "100px",
            width: "label",
            height: "label",
            padding: "14px",
            "border-width": 2,
            "border-color": "rgba(255,255,255,0.3)",
            "text-outline-color": "data(color)",
            "text-outline-width": 0,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2.5,
            "line-color": "#94a3b8",
            "target-arrow-color": "#94a3b8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "10px",
            "text-background-color": "#fff",
            "text-background-opacity": 0.9,
            "text-background-padding": "3px",
            "text-border-color": "#e2e8f0",
            "text-border-width": 1,
            "text-border-opacity": 0.5,
            color: "#1e293b",
            "font-weight": 600,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#1e293b",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: true, // Enable animation for better feel
        animationDuration: 1000,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 200, // Longer edges
        nodeRepulsion: 400000, // Much stronger repulsion to prevent overlap
        nodeOverlap: 20,
        edgeElasticity: 50,
        nestingFactor: 1.2,
        gravity: 0.15, // Lower gravity to spread out
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        stop: () => {
          cy.fit();
          cy.center();
        },
      },
      minZoom: 0.2,
      maxZoom: 2,
      wheelSensitivity: 0.2,
    });

    cyRef.current = cy;

    // Cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [status, graphData]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50" style={{ minHeight: "400px" }}>
        <div className="text-gray-500">
          <div className="animate-pulse">Loading graph...</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (status === "empty") {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50" style={{ minHeight: "400px" }}>
        <div className="text-gray-400 text-center">
          <p className="text-sm font-medium text-gray-900">Your Learning Map is empty</p>
          <p className="text-xs mt-2 text-gray-500">Start a lesson to populate your map with concepts!</p>
        </div>
      </div>
    );
  }

  // Graph container - always render when status is "ready"
  return (
    <div
      ref={containerRef}
      className="w-full bg-white"
      style={{ height: "calc(100vh - 120px)", minHeight: "400px" }}
    />
  );
}

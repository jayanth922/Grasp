"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GraphView from "@/components/GraphView";
import { RefreshCw, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { getSessionId } from "../../lib/session";

function ExploreContent() {
    const searchParams = useSearchParams();
    const urlTimestamp = searchParams?.get("t") || "0";
    const queryId = searchParams?.get("query_id") || null;  // Per-lesson filter
    const [refreshTrigger, setRefreshTrigger] = useState(parseInt(urlTimestamp));
    const [stats, setStats] = useState({ nodes: 0, edges: 0 });
    const sessionId = getSessionId();

    const handleClearMap = async () => {
        if (!confirm("Are you sure you want to clear your learning map? This cannot be undone.")) return;

        try {
            await fetch(`${API_URL}/api/graph?session_id=${sessionId}`, {
                method: "DELETE",
            });
            // Force refresh
            setRefreshTrigger(prev => prev + 1);
            setStats({ nodes: 0, edges: 0 });
        } catch (e) {
            console.error("Failed to clear map:", e);
        }
    };

    // Update refreshTrigger when URL timestamp changes (e.g., coming from View Graph button)
    useEffect(() => {
        setRefreshTrigger(parseInt(urlTimestamp));
    }, [urlTimestamp]);

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Toolbar */}
            <div className="border-b border-gray-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-medium text-gray-900">
                            {queryId ? "Lesson Concepts" : "Learning Map Explorer"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {queryId ? "Viewing concepts from this lesson only" : "Visualize your entire learning journey"}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex gap-4 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                {stats.nodes} Concepts
                            </span>
                            <span className="w-px h-4 bg-gray-300"></span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                {stats.edges} Connections
                            </span>
                        </div>

                        {!queryId && (
                            <button
                                onClick={handleClearMap}
                                className="px-4 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 text-sm rounded-md transition-all duration-200 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear Map
                            </button>
                        )}

                        <button
                            onClick={() => setRefreshTrigger((prev) => prev + 1)}
                            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md transition-all duration-200 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh Graph
                        </button>
                    </div>
                </div>
            </div>


            {/* Full-screen Graph */}
            <div className="flex-1 bg-white relative">
                <GraphView
                    refreshTrigger={refreshTrigger}
                    sessionId={queryId ? undefined : sessionId}
                    queryId={queryId}
                    onStatsUpdate={(n, e) => setStats({ nodes: n, edges: e })}
                />
            </div>
        </div>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <ExploreContent />
        </Suspense>
    );
}


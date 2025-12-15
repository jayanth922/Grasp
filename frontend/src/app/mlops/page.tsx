"use client";

import { useEffect, useState } from "react";
import { Cpu, TrendingUp, Database, Zap, ExternalLink, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface HealthStatus {
    status: string;
    services: {
        neo4j: { connected: boolean; nodes?: number; edges?: number; error?: string };
        groq: { configured: boolean; model: string };
        tavily: { configured: boolean };
        langsmith: { configured: boolean; tracing_enabled: boolean };
    };
}

export default function MLOpsPage() {
    const langsmithUrl = "https://smith.langchain.com";
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch(`${API_URL}/api/health`);
                const data = await res.json();
                setHealth(data);
            } catch (error) {
                console.error("Failed to fetch health:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
    }, []);

    const StatusBadge = ({ connected, label }: { connected: boolean; label: string }) => (
        <div className="flex items-center gap-2">
            {connected ? (
                <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-700">{label}</span>
                </>
            ) : (
                <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700">Disconnected</span>
                </>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="text-3xl font-light text-gray-900 mb-2">MLOps & AgentOps</h1>
                    <p className="text-gray-600 mb-8">Production pipeline monitoring and observability</p>
                </motion.div>

                {/* LangSmith Integration */}
                <div className="mb-8">
                    <h2 className="text-xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-gray-600" />
                        LangSmith Tracing
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Status</div>
                                {loading ? (
                                    <div className="text-gray-400 animate-pulse">Checking...</div>
                                ) : (
                                    <StatusBadge
                                        connected={health?.services?.langsmith?.tracing_enabled ?? false}
                                        label={health?.services?.langsmith?.tracing_enabled ? "Tracing Active" : "Tracing Disabled"}
                                    />
                                )}
                            </div>
                            <a
                                href={langsmithUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2"
                            >
                                Open Dashboard
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <AlertCircle className="w-4 h-4 text-gray-500" />
                                <span>View detailed traces and metrics in LangSmith dashboard</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Infrastructure */}
                <div className="mb-8">
                    <h2 className="text-xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-gray-600" />
                        Infrastructure Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Neo4j */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Database className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="font-medium text-gray-900">Neo4j Aura</div>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">Status</div>
                            {loading ? (
                                <div className="text-gray-400 animate-pulse">Checking...</div>
                            ) : (
                                <StatusBadge
                                    connected={health?.services?.neo4j?.connected ?? false}
                                    label="Connected"
                                />
                            )}
                            {health?.services?.neo4j?.connected && (
                                <div className="text-xs text-gray-500 mt-2">
                                    {health.services.neo4j.nodes} nodes, {health.services.neo4j.edges} edges
                                </div>
                            )}
                        </div>

                        {/* Groq */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="font-medium text-gray-900">Groq</div>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">Status</div>
                            {loading ? (
                                <div className="text-gray-400 animate-pulse">Checking...</div>
                            ) : (
                                <StatusBadge
                                    connected={health?.services?.groq?.configured ?? false}
                                    label="Configured"
                                />
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                                {health?.services?.groq?.model || "llama-3.3-70b"}
                            </div>
                        </div>

                        {/* Tavily */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="font-medium text-gray-900">Tavily Search</div>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">Status</div>
                            {loading ? (
                                <div className="text-gray-400 animate-pulse">Checking...</div>
                            ) : (
                                <StatusBadge
                                    connected={health?.services?.tavily?.configured ?? false}
                                    label="Configured"
                                />
                            )}
                            <div className="text-xs text-gray-500 mt-2">Web research API</div>
                        </div>
                    </div>
                </div>

                {/* System Architecture */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h2 className="text-xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-600" />
                        Multi-Agent Pipeline
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                            <div className="px-3 py-2 bg-gray-100 text-gray-900 rounded-md border border-gray-200 text-sm font-medium">
                                1. Planner
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="px-3 py-2 bg-gray-100 text-gray-900 rounded-md border border-gray-200 text-sm font-medium">
                                2. Researcher
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="px-3 py-2 bg-gray-100 text-gray-900 rounded-md border border-gray-200 text-sm font-medium">
                                3. Extractor
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="px-3 py-2 bg-gray-100 text-gray-900 rounded-md border border-gray-200 text-sm font-medium">
                                4. Builder
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="px-3 py-2 bg-gray-100 text-gray-900 rounded-md border border-gray-200 text-sm font-medium">
                                5. Analyst
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Each query flows through the multi-agent workflow orchestrated by LangGraph.
                            View detailed execution traces in LangSmith for performance analysis.
                        </p>
                    </div>
                </motion.div>

                {/* Note about detailed metrics */}
                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-gray-900 mb-1">Production Monitoring</h3>
                            <p className="text-sm text-gray-600">
                                For detailed metrics including agent performance, costs, and traces,
                                access the LangSmith dashboard. All agent executions are automatically logged
                                with full tracing enabled.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

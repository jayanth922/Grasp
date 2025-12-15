"use client";

import { useEffect, useState } from "react";
import { Target, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { getSessionId } from "../../lib/session";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    Cell, Legend
} from "recharts";

interface MetricDetail {
    question: string;
    faithfulness: number;
    relevancy: number;
    context_precision: number;
    answer_correctness: number;
}

interface Metrics {
    ragas: {
        faithfulness: number;
        relevance: number;
        contextPrecision: number;
        answerCorrectness: number;
    };
    graph: {
        nodeCount: number;
        edgeCount: number;
        avgDegree: number;
        density: number;
    };
    performance: {
        avgResponseTime: number;
        queriesProcessed: number;
        successRate: number;
    };
    details?: MetricDetail[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6"];

export default function MetricsPage() {
    const [metrics, setMetrics] = useState<Metrics>({
        ragas: { faithfulness: 0, relevance: 0, contextPrecision: 0, answerCorrectness: 0 },
        graph: { nodeCount: 0, edgeCount: 0, avgDegree: 0, density: 0 },
        performance: { avgResponseTime: 0, queriesProcessed: 0, successRate: 0 },
        details: [],
    });

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const sessionId = getSessionId();
                const res = await fetch(`${API_URL}/api/metrics?session_id=${sessionId}`);
                const data = await res.json();
                setMetrics(data);
            } catch (error) {
                console.error("Failed to fetch metrics:", error);
            }
        };
        fetchMetrics();
    }, []);

    // Prepare data for charts
    const ragasBarData = [
        { name: "Faithfulness", value: metrics.ragas.faithfulness * 100, fill: COLORS[0] },
        { name: "Relevance", value: metrics.ragas.relevance * 100, fill: COLORS[1] },
        { name: "Context Precision", value: metrics.ragas.contextPrecision * 100, fill: COLORS[2] },
        { name: "Answer Correctness", value: metrics.ragas.answerCorrectness * 100, fill: COLORS[3] },
    ];

    const radarData = [
        { metric: "Faithfulness", score: metrics.ragas.faithfulness * 100, fullMark: 100 },
        { metric: "Relevance", score: metrics.ragas.relevance * 100, fullMark: 100 },
        { metric: "Context", score: metrics.ragas.contextPrecision * 100, fullMark: 100 },
        { metric: "Correctness", score: metrics.ragas.answerCorrectness * 100, fullMark: 100 },
    ];

    const perQuestionData = metrics.details?.map((q, idx) => ({
        name: `Q${idx + 1}`,
        score: ((q.faithfulness + q.relevancy + q.context_precision + q.answer_correctness) / 4) * 100,
        question: q.question,
    })) || [];

    const hasRagasScores = ragasBarData.some(m => m.value > 0);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-3xl font-light text-gray-900 mb-2">Evaluation Metrics</h1>
                    <p className="text-gray-600 mb-8">AI tutor quality and performance visualizations</p>
                </motion.div>

                {!hasRagasScores ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Evaluation not yet run</p>
                        <p className="text-sm text-gray-500">
                            Run Ragas evaluation on golden dataset to generate quality charts
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Main Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                            {/* Bar Chart - Ragas Scores */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white border border-gray-200 rounded-lg p-6"
                            >
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Ragas Evaluation Scores</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={ragasBarData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
                                            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {ragasBarData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </motion.div>

                            {/* Radar Chart - Quality Overview */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white border border-gray-200 rounded-lg p-6"
                            >
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Radar</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Radar
                                            name="Score"
                                            dataKey="score"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.3}
                                        />
                                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </motion.div>
                        </div>

                        {/* Per-Question Bar Chart */}
                        {perQuestionData.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white border border-gray-200 rounded-lg p-6 mb-8"
                            >
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Per-Question Score Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={perQuestionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value: number) => [`${value.toFixed(1)}%`, "Avg Score"]}
                                            labelFormatter={(label) => {
                                                const item = perQuestionData.find(d => d.name === label);
                                                return item?.question || label;
                                            }}
                                            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                                        />
                                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                            {perQuestionData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.score >= 80 ? "#10b981" : entry.score >= 60 ? "#f59e0b" : "#ef4444"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-4 mt-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded bg-green-500" />
                                        <span className="text-gray-600">≥80%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded bg-amber-500" />
                                        <span className="text-gray-600">60-79%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded bg-red-500" />
                                        <span className="text-gray-600">&lt;60%</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}

                {/* Graph Quality */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                >
                    <h2 className="text-xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-600" />
                        Knowledge Graph Statistics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Nodes", value: metrics.graph.nodeCount, desc: "Concepts extracted" },
                            { label: "Total Edges", value: metrics.graph.edgeCount, desc: "Relationships found" },
                            { label: "Avg Degree", value: metrics.graph.avgDegree.toFixed(2), desc: "Connections per node" },
                            { label: "Graph Density", value: metrics.graph.density.toFixed(3), desc: "Interconnectedness" },
                        ].map((item) => (
                            <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                                <div className="text-2xl font-light text-gray-900">{item.value}</div>
                                <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-8"
                >
                    <h2 className="text-xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-gray-600" />
                        Performance Metrics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: "Avg Response Time", value: `${metrics.performance.avgResponseTime}s`, desc: "End-to-end latency" },
                            { label: "Queries Processed", value: metrics.performance.queriesProcessed, desc: "Total lessons" },
                            { label: "Success Rate", value: `${(metrics.performance.successRate * 100).toFixed(1)}%`, desc: "Completed without error" },
                        ].map((item) => (
                            <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                                <div className="text-2xl font-light text-gray-900">{item.value}</div>
                                <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Methodology Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-6"
                >
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Evaluation Methodology</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Quality metrics calculated using <strong>Ragas framework</strong> with LLM-as-Judge (Groq Llama-3.3-70B):
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>Faithfulness:</strong> Answer alignment with retrieved context</li>
                        <li>• <strong>Relevance:</strong> Response addresses user's question</li>
                        <li>• <strong>Context Precision:</strong> Retrieved context specificity</li>
                        <li>• <strong>Answer Correctness:</strong> Factual accuracy vs ground truth</li>
                    </ul>
                    <p className="text-sm text-gray-500 mt-4">
                        Golden dataset: 20 educational questions (Science, Biology, Physics, Economics)
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { getSessionId } from "../../../lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface QueryResult {
    id: string;
    query: string;
    analysis: string;
    timestamp: string;
    entities: number;
    edges: number;
}

export default function QueryResultPage() {
    const params = useParams();
    const queryId = params.id as string;

    const [result, setResult] = useState<QueryResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const sessionId = getSessionId();
                const res = await fetch(`${API_URL}/api/history?session_id=${sessionId}`);
                const history = await res.json();
                const found = history.find((item: any) => item.id === queryId);

                if (found) {
                    setResult(found);
                } else {
                    setError("Query not found");
                }
            } catch (err) {
                setError("Failed to load query result");
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [queryId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-500">Loading query result...</div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">{error || "Query not found"}</div>
                    <Link href="/history" className="text-gray-900 hover:underline">
                        ← Back to History
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-8"
                >
                    <Link
                        href="/history"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to History
                    </Link>
                    <h1 className="text-3xl font-light text-gray-900 mb-2">Your Lesson Plan</h1>
                    <p className="text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                    </p>
                </motion.div>

                {/* Query */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-6"
                >
                    <h2 className="text-lg font-medium text-gray-900 mb-3">Learning Topic</h2>
                    <div className="bg-gray-900 text-white p-4 rounded-lg">
                        {result.query}
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-6"
                >
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-500 mb-1">Concepts Learned</div>
                            <div className="text-2xl font-light text-gray-900">{result.entities}</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-500 mb-1">Connections Found</div>
                            <div className="text-2xl font-light text-gray-900">{result.edges}</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-500 mb-1">Lesson ID</div>
                            <div className="text-xs font-mono text-gray-600 break-all">{result.id}</div>
                        </div>
                    </div>
                </motion.div>

                {/* Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-8"
                >
                    <h2 className="text-lg font-medium text-gray-900 mb-3">The Lesson</h2>
                    {result.analysis ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="prose prose-gray max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">{children}</h3>,
                                        p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 mb-4">{children}</ul>,
                                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                    }}
                                >
                                    {result.analysis}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                            No lesson content available
                        </div>
                    )}
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-4"
                >
                    <Link
                        href={`/query?q=${encodeURIComponent(result.query)}`}
                        className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <RotateCw className="w-4 h-4" />
                        Restart Lesson
                    </Link>
                    <Link
                        href={`/explore?query_id=${result.id}`}
                        className="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        View This Lesson's Map
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Network } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { getSessionId } from "../../../lib/session";
import GraphView from "../../../components/GraphView";

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
    const [status, setStatus] = useState<"processing" | "ready" | "error">("processing");
    const [pollCount, setPollCount] = useState(0);

    const fetchResult = useCallback(async () => {
        try {
            const sessionId = getSessionId();
            const res = await fetch(`${API_URL}/api/history?session_id=${sessionId}`);
            const history = await res.json();
            const found = history.find((item: any) => item.id === queryId);

            if (found) {
                setResult(found);
                setStatus("ready");
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to fetch result:", err);
            return false;
        }
    }, [queryId]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let currentPollCount = 0;

        const pollForResult = async () => {
            const found = await fetchResult();
            if (found) {
                return;
            }

            currentPollCount++;
            setPollCount(currentPollCount);

            if (currentPollCount < 30) {
                timeoutId = setTimeout(pollForResult, 2000);
            } else {
                setStatus("error");
            }
        };

        pollForResult();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [fetchResult]);

    if (status === "processing") {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                        <span className="text-lg text-gray-600">Researching and building your lesson...</span>
                    </div>
                    <div className="text-sm text-gray-400">
                        This may take 10-30 seconds
                    </div>
                    <div className="mt-6 flex gap-2 justify-center">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 bg-gray-300 rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    if (status === "error" || !result) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        Query processing timed out or failed.
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Link href="/" className="text-gray-900 hover:underline">
                            ← Try again
                        </Link>
                        <Link href="/history" className="text-gray-600 hover:underline">
                            View History
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <Link
                        href="/history"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to History
                    </Link>
                    <h1 className="text-3xl font-light text-gray-900 mb-2">Your Lesson</h1>
                    <p className="text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-8"
                >
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Your Question
                    </h2>
                    <div className="text-xl text-gray-900">{result.query}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Network className="w-5 h-5 text-gray-600" />
                        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Knowledge Graph
                        </h2>
                        <span className="text-xs text-gray-400">
                            ({result.entities} concepts, {result.edges} relationships)
                        </span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <GraphView queryId={queryId} height="400px" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                        Lesson Explanation
                    </h2>
                    <div className="prose prose-gray max-w-none">
                        <ReactMarkdown>{result.analysis}</ReactMarkdown>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

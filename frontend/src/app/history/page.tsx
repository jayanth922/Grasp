"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Trash2, Eye, Search } from "lucide-react";
import { motion } from "framer-motion";
import { getSessionId } from "../../lib/session";

interface QueryHistory {
    id: string;
    query: string;
    timestamp: string;
    entities: number;
    edges: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HistoryPage() {
    const [history, setHistory] = useState<QueryHistory[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // ... inside component

    // ... inside component

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const sessionId = getSessionId();
                const res = await fetch(`${API_URL}/api/history?session_id=${sessionId}`);
                const data = await res.json();
                setHistory(data);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const deleteQuery = async (id: string) => {
        try {
            const sessionId = getSessionId();
            const res = await fetch(`${API_URL}/api/history/${id}?session_id=${sessionId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setHistory(history.filter(item => item.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete query:", error);
        }
    };

    const filteredHistory = history.filter((item) =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="text-3xl font-light text-gray-900 mb-2">Lesson History</h1>
                    <p className="text-gray-600 mb-8">Review your past lessons and learning progress</p>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-6 relative"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search lessons..."
                        className="w-full bg-white border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    />
                </motion.div>

                {/* History List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-1/3 mx-auto mb-3"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/4 mx-auto"></div>
                            </div>
                            <p className="text-gray-500 mt-4">Loading history...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                            <p className="text-gray-500">No lessons found</p>
                        </div>
                    ) : (
                        filteredHistory.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">{item.query}</h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {new Date(item.timestamp).toLocaleString()}
                                            </div>
                                            <div>{item.entities} concepts</div>
                                            <div>{item.edges} connections</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/query/${item.id}`}
                                            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </Link>
                                        <button
                                            onClick={() => deleteQuery(item.id)}
                                            className="px-4 py-2 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md text-sm font-medium transition-all duration-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Network, Activity, Database, Upload, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { getSessionId } from "../lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HomePage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadMode, setUploadMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const sessionId = getSessionId();
            const res = await fetch(`${API_URL}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery, session_id: sessionId }),
            });
            const data = await res.json();
            if (data.id) {
                router.push(`/query/${data.id}`);
            } else {
                alert("Failed to start lesson. Please try again.");
            }
        } catch (error) {
            console.error("Search failed:", error);
            alert("Connection error. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setSelectedFile(file);
        } else if (file) {
            alert("Please select a PDF file");
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setLoading(true);
        try {
            const sessionId = getSessionId();
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("session_id", sessionId);

            const res = await fetch(`${API_URL}/api/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (data.error) {
                alert(`Upload failed: ${data.error}`);
            } else if (data.id) {
                router.push(`/query/${data.id}`);
            } else {
                alert("Upload failed. Please try again.");
            }
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Connection error. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-6 py-16">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-tight">
                        Grasp
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
                        Your AI-powered study companion that builds interactive learning maps.
                    </p>
                </motion.div>

                {/* Mode Toggle */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex justify-center gap-2 mb-6"
                >
                    <button
                        onClick={() => setUploadMode(false)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!uploadMode
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Ask a Question
                    </button>
                    <button
                        onClick={() => setUploadMode(true)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${uploadMode
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Upload PDF
                    </button>
                </motion.div>

                {/* Search or Upload */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-2xl mx-auto mb-6"
                >
                    {!uploadMode ? (
                        <form onSubmit={handleSearch}>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="What do you want to learn today? (e.g., 'Explain Photosynthesis')"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !searchQuery.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm rounded-md transition-all duration-200 flex items-center gap-2"
                                >
                                    {loading ? "Processing..." : "Start Lesson"}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {selectedFile ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileText className="w-8 h-8 text-gray-600" />
                                        <div className="text-left">
                                            <p className="text-gray-900 font-medium">{selectedFile.name}</p>
                                            <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">Click to upload or drag and drop</p>
                                        <p className="text-sm text-gray-400 mt-1">PDF files only (max 10MB)</p>
                                    </>
                                )}
                            </div>
                            {selectedFile && (
                                <button
                                    onClick={handleUpload}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    {loading ? "Processing PDF..." : "Analyze PDF"}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Example Queries - only show in query mode */}
                {!uploadMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex gap-2 justify-center flex-wrap mb-16"
                    >
                        {[
                            "Explain Photosynthesis",
                            "Teach me about Quantum Entanglement",
                            "History of the Roman Empire",
                        ].map((query) => (
                            <Link
                                key={query}
                                href={`/query?q=${encodeURIComponent(query)}`}
                                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-md transition-all duration-200 border border-gray-200"
                            >
                                {query}
                            </Link>
                        ))}
                    </motion.div>
                )}

                {/* Spacer when in upload mode */}
                {uploadMode && <div className="mb-16" />}

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <Link
                        href="/query"
                        className="group bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="mb-4">
                            <Search className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors duration-200" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Lesson</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Ask questions and get AI-powered lessons with visual learning maps
                        </p>
                    </Link>

                    <Link
                        href="/explore"
                        className="group bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="mb-4">
                            <Network className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors duration-200" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Explore Learning Maps</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Browse the concept graph built from your lessons
                        </p>
                    </Link>

                    <Link
                        href="/metrics"
                        className="group bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="mb-4">
                            <Activity className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors duration-200" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tutor Performance</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            View quality scores and learning metrics
                        </p>
                    </Link>

                    <Link
                        href="/about"
                        className="group bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="mb-4">
                            <Database className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors duration-200" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Documentation</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Model card, architecture, and technical documentation
                        </p>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}

"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { getSessionId } from "../../lib/session";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function QueryContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams?.get("q") || "";

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [pipelineSteps, setPipelineSteps] = useState<any[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const hasSubmittedInitial = useRef(false);

    useEffect(() => {
        if (initialQuery && !hasSubmittedInitial.current) {
            hasSubmittedInitial.current = true;
            submitQuery(initialQuery);
        }
    }, [initialQuery]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const submitQuery = async (queryText: string) => {
        if (!queryText.trim()) return;

        setMessages(prev => [...prev, { role: "user", content: queryText }]);
        setInput("");
        setLoading(true);
        setPipelineSteps([]);

        try {
            const sessionId = getSessionId();
            const res = await fetch(`${API_URL}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: queryText, session_id: sessionId }),
            });

            const data = await res.json();

            if (data.success) {
                setMessages(prev => [
                    ...prev,
                    { role: "assistant", content: data.analysis },
                ]);
                setPipelineSteps(data.reasoning_steps || []);
            }
        } catch (error) {
            console.error("Query error:", error);
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: "Error processing query" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitQuery(input);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-6">
                <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
                    </div>

                    {/* Messages - SIMPLE SCROLLABLE AREA */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <p className="text-lg font-medium">Start a conversation</p>
                                    <p className="text-sm mt-1">Ask about companies, people, or topics</p>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i}>
                                    <div
                                        className={`rounded-lg p-4 ${msg.role === "user"
                                            ? "bg-gray-900 text-white ml-12"
                                            : "bg-gray-50 border border-gray-200 text-gray-900"
                                            }`}
                                    >
                                        {msg.role === "user" ? (
                                            <p className="text-sm">{msg.content}</p>
                                        ) : (
                                            <div className="prose prose-sm max-w-none">
                                                <ReactMarkdown
                                                    components={{
                                                        h2: ({ children }) => <h2 className="text-base font-bold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mt-3 mb-1">{children}</h3>,
                                                        p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700">{children}</ul>,
                                                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                                        code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm text-gray-900">{children}</code>,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Form */}
                    <div className="p-4 border-t border-gray-200">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question..."
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 text-gray-900 bg-white"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Send</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Pipeline Sidebar */}
                <div className="w-96 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Pipeline</h2>
                        <p className="text-xs text-gray-500 mt-1">Agent workflow</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {pipelineSteps.length === 0 ? (
                            <p className="text-sm text-gray-500">No active pipeline</p>
                        ) : (
                            <div className="space-y-3">
                                {pipelineSteps.map((step, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-gray-900">
                                                Step {step.step}
                                            </span>
                                            <span className="text-xs text-gray-600">{step.agent}</span>
                                        </div>
                                        <p className="text-xs text-gray-700 font-medium">{step.action}</p>
                                        <p className="text-xs text-gray-500 mt-1">{step.details}</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Graph Button */}
                    {pipelineSteps.length > 0 && (
                        <div className="p-4 border-t border-gray-200">
                            <a
                                href={`/explore?t=${Date.now()}`}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                View Graph
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function QueryPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <QueryContent />
        </Suspense>
    );
}

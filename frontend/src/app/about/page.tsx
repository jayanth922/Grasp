"use client";

import { FileText, GitBranch, Shield, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="text-3xl font-light text-gray-900 mb-2">About Grasp</h1>
                    <p className="text-gray-600 mb-8">Your AI-powered learning companion</p>
                </motion.div>

                {/* Model Card */}
                <div className="mb-8">
                    <h2 className="text-2xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        How It Works
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">System Overview</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Grasp helps you explore topics by researching them in real-time,
                                extracting key concepts and relationships, and displaying them as a visual
                                knowledge graph you can browse.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Learning Features</h3>
                            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                                <li>Visual concept maps showing how ideas connect</li>
                                <li>Real-time research from web sources via Tavily</li>
                                <li>AI-generated lesson summaries with key takeaways</li>
                                <li>Track your learning journey across sessions</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Best For</h3>
                            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                                <li>Students exploring new subjects</li>
                                <li>Visual learners who prefer graphs over text</li>
                                <li>Quick overviews of unfamiliar topics</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Intended Use</h3>
                            <p className="text-gray-700 text-sm">
                                Educational exploration, concept mapping, and self-directed learning
                                across science, history, technology, and more.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Architecture */}
                <div className="mb-8">
                    <h2 className="text-2xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-gray-600" />
                        System Architecture
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Multi-Agent Pipeline</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                                    <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-md border border-gray-200">Planner</span>
                                    <span>→</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-md border border-gray-200">Researcher</span>
                                    <span>→</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-md border border-gray-200">Extractor</span>
                                    <span>→</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-md border border-gray-200">Builder</span>
                                    <span>→</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-md border border-gray-200">Analyst</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Frontend</h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>• Next.js 16 (App Router)</li>
                                        <li>• Cytoscape.js (Graph visualization)</li>
                                        <li>• TailwindCSS (Styling)</li>
                                        <li>• Framer Motion (Animations)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Backend</h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>• FastAPI (Python)</li>
                                        <li>• LangGraph (Orchestration)</li>
                                        <li>• Groq (LLM API)</li>
                                        <li>• Neo4j (Graph DB)</li>
                                        <li>• Tavily (Web Search)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evaluation */}
                <div className="mb-8">
                    <h2 className="text-2xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-gray-600" />
                        Evaluation Methodology
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <p className="text-sm text-gray-700 mb-4">
                            System quality is evaluated using the Ragas framework for RAG system assessment.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Framework</div>
                                <div className="font-medium text-gray-900">Ragas</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Metrics</div>
                                <div className="font-medium text-gray-900">Faithfulness, Relevance, Context Precision</div>
                            </div>
                        </div>
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-3">
                            <p className="text-xs text-gray-600">
                                Note: Run evaluation on golden dataset to generate scores. View results in Metrics page.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ethical Considerations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h2 className="text-2xl font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-600" />
                        Ethical Considerations
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <ul className="text-sm text-gray-700 space-y-3">
                            <li>
                                <strong className="text-gray-900">Data Privacy:</strong> Session data is stored locally in browser.
                                Graph data is stored in Neo4j with session-based isolation.
                            </li>
                            <li>
                                <strong className="text-gray-900">Source Attribution:</strong> Web search results include
                                source URLs for transparency.
                            </li>
                            <li>
                                <strong className="text-gray-900">Bias Mitigation:</strong> Multiple source aggregation
                                reduces single-source bias.
                            </li>
                            <li>
                                <strong className="text-gray-900">Use Restrictions:</strong> Not intended for medical,
                                legal, or financial advice.
                            </li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

# Grasp - AI Educational Tutor with Knowledge Graphs

## Slide 1: Title
**Grasp**
AI-Powered Learning with Knowledge Graph Visualization

---

## Slide 2: Problem
**Students struggle with complex topics**
- Linear materials miss concept connections
- No visual representation of prerequisites
- Hard to see how ideas relate

---

## Slide 3: Solution
**Grasp builds visual concept maps from any topic**
- Enter a question → AI researches and extracts concepts
- Upload PDF → Extract knowledge from study materials
- Interactive graph shows relationships
- AI explains using the knowledge structure

---

## Slide 4: Architecture
**Multi-Agent LangGraph Pipeline**
- Planner → Researcher → Graph Builder → Analyst
- Groq Llama-3.3-70B for inference
- Tavily API for real-time web research
- Neo4j for knowledge graph storage

---

## Slide 5: Tech Stack
- **AI**: LangGraph, Groq LLM, Structured Output
- **Backend**: FastAPI, Python
- **Frontend**: Next.js, Cytoscape.js
- **Database**: Neo4j Aura
- **Observability**: LangSmith

---

## Slide 6: Evaluation
**Ragas Framework + LLM-as-Judge**
- Golden dataset: 20 educational questions
- Automated scoring with Groq Llama-3.3-70B

| Metric | Score |
|--------|-------|
| Faithfulness | 89.5% |
| Relevance | 96.0% |
| Context Precision | 75.0% |
| Answer Correctness | 74.0% |

---

## Slide 7: MLOps
**Observability & Evaluation Pipeline**
- LangSmith tracing for agent execution
- Automated Ragas evaluation
- Visual metrics dashboard with charts
- Per-question score breakdown

---

## Slide 8: Future Work
- Personalized learning paths
- Multi-modal support (images, diagrams)
- Spaced repetition integration
- Collaborative knowledge graphs

---

## Slide 9: Conclusion
**Grasp transforms learning through visualization**
- Multi-agent AI pipeline for research & extraction
- Knowledge graphs show concept relationships
- Production-quality evaluation (89.5% faithfulness)
- GraphRAG retrieval for grounded answers

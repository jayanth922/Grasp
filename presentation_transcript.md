# Presentation Transcript - Grasp (15 minutes)

---

## Slide 1: Title (1 minute)

"Hello everyone, today I'm presenting Grasp - an AI-powered educational tutor that uses knowledge graphs to help students learn visually.

The core idea is simple: instead of reading linear text, students can see how concepts connect to each other through an interactive graph visualization. Let me walk you through the problem we're solving, our technical approach, and the evaluation results."

---

## Slide 2: Problem (2 minutes)

"So what's the problem we're addressing?

Traditional learning materials present information linearly - you read a textbook page by page. But this misses something crucial: the connections between concepts.

For example, to understand machine learning, you need to first understand linear algebra, calculus, and probability. Textbooks don't visually show these prerequisite relationships.

This is especially challenging for visual learners who need to see how ideas relate to each other to build deep understanding. They're left trying to mentally construct these connections on their own.

Our goal was to build a system that automatically discovers and visualizes these concept relationships."

---

## Slide 3: Solution (2 minutes)

"Grasp solves this by building visual concept maps from any learning topic.

There are two ways to use it:

First, you can ask any question - like 'What is photosynthesis?' The system will research the topic in real-time, extract key concepts like chlorophyll, carbon dioxide, and glucose, and build a graph showing how they relate.

Second, you can upload a PDF of your study materials. The system extracts text, identifies the important concepts, and builds a knowledge graph from your own notes or textbooks.

The result is an interactive graph where you can click on nodes to see definitions, and visually trace the relationships between ideas. The AI tutor then uses this graph structure to explain topics in a grounded way."

---

## Slide 4: Architecture (3 minutes)

"Let me explain the technical architecture.

We use a multi-agent pipeline built with LangGraph. There are four specialized agents that work in sequence:

First, the Planner agent analyzes the user's query and prepares a research strategy.

Second, the Researcher agent executes web searches using the Tavily API. We bias searches toward educational content to get textbook-quality information rather than news articles.

Third, the Graph Builder agent takes that research and extracts structured data. We use Groq's Llama 3.3 70B model with structured output to extract entities like concepts, people, and organizations, plus relationships between them. This gets stored in Neo4j, a graph database.

Finally, the Analyst agent performs what we call GraphRAG retrieval. Instead of just searching documents, it searches the knowledge graph, finds relevant nodes and their neighborhoods, and uses that structured context to generate explanations.

For PDF uploads, we skip the Researcher step and feed the PDF content directly to the Graph Builder. This is implemented as conditional routing in the LangGraph state machine."

---

## Slide 5: Tech Stack (1.5 minutes)

"Quick overview of the technologies:

For AI, we're using LangGraph for agent orchestration, and Groq for fast LLM inference - specifically Llama 3.3 70B which gives us high quality at low latency.

The backend is FastAPI with Python, handling all the API endpoints.

The frontend is Next.js with Cytoscape.js for graph visualization. Users can pan, zoom, and click on nodes to explore the knowledge graph.

We use Neo4j Aura as our cloud graph database - it's designed for storing and querying relationship data efficiently.

For observability, we have LangSmith integration which gives us full traces of every agent execution - useful for debugging and performance monitoring."

---

## Slide 6: Evaluation (2.5 minutes)

"Now for evaluation - this is critical for any ML system.

We implemented the Ragas framework with an LLM-as-Judge approach. This means we use Groq's Llama model to automatically score the quality of our responses, without needing human annotations.

We created a golden dataset of 20 educational questions covering biology, physics, chemistry, and economics - things like 'What is photosynthesis?', 'Explain Newton's laws', 'What causes earthquakes'.

For each question, we measure four metrics:

Faithfulness - does the answer align with the retrieved context? We scored 89.5%, meaning our answers are well-grounded.

Relevance - does the response actually address what the user asked? 96% - very high.

Context Precision - is the retrieved context specifically relevant? 75%.

Answer Correctness - is it factually accurate compared to ground truth? 74%.

These are production-quality scores. 17 out of 20 questions scored above 75% average."

---

## Slide 7: MLOps (1.5 minutes)

"For MLOps and observability:

We have LangSmith integration that traces every agent execution. You can see exactly how long each step took, what the LLM inputs and outputs were, and track down errors.

The evaluation pipeline is automated - you run a script, it processes all 20 golden questions, and generates a JSON file with per-question scores.

On the frontend, we built a metrics dashboard using Recharts that visualizes these results. There's a bar chart showing the four Ragas metrics, a radar chart for the overall quality profile, and a per-question distribution showing which questions performed well or poorly.

This gives stakeholders visibility into system quality without needing to dig through logs."

---

## Slide 8: Future Work (1 minute)

"Looking ahead, there are several natural extensions:

First, personalized learning paths - we already store prerequisite relationships in the graph, so we could suggest what to learn next based on what you know.

Second, multi-modal support - handling diagrams and images in PDFs, not just text.

Third, spaced repetition integration - using the graph to schedule review of concepts you're likely to forget.

And fourth, collaborative graphs - letting students build shared knowledge bases together."

---

## Slide 9: Conclusion (1.5 minutes)

"To summarize:

Grasp transforms learning by making knowledge visual and connected.

We built a multi-agent AI pipeline that researches topics, extracts structured knowledge, and stores it in a graph database.

The knowledge graph visualization helps students see how concepts relate - which prerequisites lead to which advanced topics.

We achieved production-quality evaluation scores - 89.5% faithfulness and 96% relevance - using an automated Ragas pipeline.

And the GraphRAG retrieval approach ensures our AI tutor gives answers grounded in the actual knowledge structure, not hallucinations.

Thank you for listening. I'm happy to take any questions."

---

## Total Time: ~15 minutes

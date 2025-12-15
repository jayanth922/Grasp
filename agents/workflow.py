"""
LangGraph Workflow for Nexus

Orchestrates the multi-agent pipeline:
Planner → Researcher → Graph Builder → Analyst
"""

from typing import TypedDict, Annotated, List
import operator
from langgraph.graph import StateGraph, END

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from agents.research_agent import search_web, extract_content
from agents.graph_agent import update_graph_from_extraction
from graph.db import NexusGraph

import os
import logging
from dotenv import load_dotenv

load_dotenv()

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
LLM_MODEL = "llama-3.3-70b-versatile"
llm = ChatGroq(temperature=0.1, model_name=LLM_MODEL)

# ============================================================================
# STATE DEFINITION
# ============================================================================

class AgentState(TypedDict):
    query: str
    messages: Annotated[List[BaseMessage], operator.add]
    research_data: str
    graph_context: str
    analysis: str
    steps_taken: int
    session_id: str
    query_id: str  # Unique ID for per-query graph isolation

# ============================================================================
# AGENT NODES
# ============================================================================

def planner_node(state: AgentState):
    """
    Planner: Analyzes the query and prepares the research strategy.
    """
    logger.info(f"--- Planning: {state['query']} ---")
    return {
        "steps_taken": state.get("steps_taken", 0) + 1,
        "messages": [SystemMessage(content=f"Planning investigation for: {state['query']}")]
    }

def researcher_node(state: AgentState):
    """
    Researcher: Executes web search and returns raw content.
    """
    logger.info("--- Researching ---")
    query = state["query"]
    
    raw_content = search_web(query)
    
    return {
        "research_data": raw_content,
        "messages": [SystemMessage(content=f"Found {len(raw_content)} chars of research data.")]
    }

def graph_builder_node(state: AgentState):
    """
    Graph Builder: Extracts entities from research and updates Neo4j.
    ONLY extracts entities relevant to the user's query.
    """
    logger.info("--- Building Graph ---")
    content = state["research_data"]
    query = state["query"]  # Get the user's query
    session_id = state.get("session_id", "default")
    query_id = state.get("query_id")  # Per-query isolation
    
    if not content:
        logger.warning("No research data to process")
        return {"messages": [SystemMessage(content="No data found to process.")]}
    
    # Extract structured data - PASS QUERY for focused extraction
    structured_data = extract_content(content, query=query)
    
    # Write to Neo4j - PASS QUERY_ID for per-query filtering
    update_graph_from_extraction(structured_data, session_id, query_id)
    
    return {
        "messages": [SystemMessage(content=f"Graph updated: {structured_data.summary}")]
    }

def analyst_node(state: AgentState):
    """
    Analyst: Smart GraphRAG Retrieval & Answering.
    1. Extract Keywords -> 2. Search Anchor Nodes -> 3. Expand Neighborhood -> 4. Answer
    """
    logger.info("--- Analyzing (Smart GraphRAG) ---")
    query = state["query"]
    session_id = state.get("session_id", "default")
    
    # 1. Keyword Extraction
    extraction_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a precise search query generator. Extract 2-3 specific entity names or key terms from the user's question to query a knowledge graph."),
        ("user", "Return ONLY a comma-separated list of keywords. Question: {query}")
    ])
    
    try:
        # Use a temporary chain for extraction
        kw_chain = extraction_prompt | llm
        kw_response = kw_chain.invoke({"query": query})
        keywords = [k.strip() for k in kw_response.content.split(",") if k.strip()]
        logger.info(f"Graph Retrieval Keywords: {keywords}")
    except Exception as e:
        logger.error(f"Keyword extraction failed: {e}")
        keywords = [query]

    # 2. Search & Retrieval
    try:
        db = NexusGraph()
        
        # Search for anchor nodes
        anchor_nodes = []
        seen_ids = set()
        for kw in keywords:
            # Fuzzy search for nodes matching keyword
            results = db.search_nodes(kw, session_id, limit=3)
            for node in results:
                if node['id'] not in seen_ids:
                    anchor_nodes.append(node)
                    seen_ids.add(node['id'])
        
        # Retrieve neighborhood (relationships) for context
        node_ids = [n['id'] for n in anchor_nodes]
        relationships = db.get_neighborhood(node_ids, session_id, limit=50)
        
        # Build Context String
        context_parts = []
        
        if anchor_nodes:
            context_parts.append("**Relevant Entities:**")
            for n in anchor_nodes:
                labels = n.get('labels', ['Entity'])
                label = labels[0] if labels else 'Entity'
                desc = f": {n['description']}" if n.get('description') else ""
                context_parts.append(f"- {n['name']} ({label}){desc}")
        
        if relationships:
            context_parts.append("\n**Key Relationships:**")
            for r in relationships:
                context_parts.append(f"- {r['source']} --[{r['relationship']}]--> {r['target']}")
                if r.get('evidence'):
                     context_parts.append(f"  (Evidence: {r['evidence'][:100]}...)")
        
        if not context_parts:
             graph_context = "No direct matches found in knowledge graph for these keywords."
        else:
             graph_context = "\n".join(context_parts)
             
        logger.info(f"Retrieved Context Size: {len(graph_context)} chars")

    except Exception as e:
        logger.error(f"Graph retrieval error: {e}")
        graph_context = f"Error retrieving context: {e}"
    
    # 3. Generate Analysis (Tutor Mode)
    analysis_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert **Tutor** helping a student learn a new topic.

        **YOUR GOAL**: Teach the user the concept simply and clearly using the provided Knowledge Graph.

        **TEACHING STYLE**:
        1. **Simple Language**: Avoid jargon unless you define it.
        2. **Analogies**: Use "Think of X like Y..." to explain complex ideas.
        3. **Structure**: Start with the definition, then explain how things connect.
        4. **Visuals**: Mention "As you can see in the learning map..." when referencing connections.

        **CRITICAL INSTRUCTION**:
        - Use the "Knowledge Graph Data" as your lesson plan.
        - If the graph shows "Photosynthesis --[REQUIRES]--> Sunlight", explain "Photosynthesis needs sunlight to work..."
        - Do NOT say "The node X is connected to node Y". Say "X leads to Y".

        Format your lesson in Markdown:
        ## Concept Summary
        [Simple definition]

        ## The Breakdown
        [Step-by-step explanation using the graph relationships]

        ## Analogies & Examples
        [Use 'IS_EXAMPLE_OF' data or create analogies]

        ## Prerequisites
        [Mention any 'IS_PREREQUISITE_FOR' nodes found]
        """),
        ("user", """Student's Question: {query}

        Learning Map Data (Graph):
        {graph_context}

        Background Research:
        {research_summary}

        Teach the lesson:""")
    ])
    
    try:
        research_summary = state.get("research_data", "")[:1500] # Expanded context
        
        chain = analysis_prompt | llm
        response = chain.invoke({
            "query": query,
            "graph_context": graph_context,
            "research_summary": research_summary
        })
        
        analysis = response.content
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        analysis = f"Analysis failed: {e}"
    
    return {
        "graph_context": graph_context,
        "analysis": analysis,
        "messages": [AIMessage(content=analysis)]
    }

# ============================================================================
# WORKFLOW DEFINITION
# ============================================================================

workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("planner", planner_node)
workflow.add_node("researcher", researcher_node)
workflow.add_node("graph_builder", graph_builder_node)
workflow.add_node("analyst", analyst_node)

# Set entry point
workflow.set_entry_point("planner")

# Conditional routing: skip researcher if research_data is pre-populated (PDF upload)
def should_research(state: AgentState) -> str:
    """Decide whether to research or skip to graph building."""
    if state.get("research_data", "").strip():
        # PDF content provided, skip research
        logger.info("--- Skipping research (PDF content provided) ---")
        return "graph_builder"
    else:
        # Need to do web research
        return "researcher"

# Define edges with conditional routing
workflow.add_conditional_edges(
    "planner",
    should_research,
    {
        "researcher": "researcher",
        "graph_builder": "graph_builder"
    }
)
workflow.add_edge("researcher", "graph_builder")
workflow.add_edge("graph_builder", "analyst")
workflow.add_edge("analyst", END)

# Compile
app = workflow.compile()

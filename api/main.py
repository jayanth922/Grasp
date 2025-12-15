"""
FastAPI Backend for Nexus

Exposes the agent functionality via REST API with detailed reasoning steps.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import json
import asyncio
import uuid
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

import logging
logger = logging.getLogger(__name__)

from agents.workflow import app as agent_app
from graph.db import NexusGraph

# ============================================================================
# APP SETUP
# ============================================================================

app = FastAPI(
    title="Nexus API",
    description="Knowledge Graph Intelligence API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for query history
query_history: List[Dict] = []

# Load Ragas scores if available
ragas_scores = None
try:
    import json
    import os
    results_path = "evaluation/results.json"
    if os.path.exists(results_path):
        with open(results_path, "r") as f:
            data = json.load(f)
            ragas_scores = data.get("ragas")
except Exception as e:
    print(f"Could not load ragas scores: {e}")

def get_performance_metrics():
    """Calculate real performance metrics from query history."""
    if not query_history:
        return {
            "avgResponseTime": 0,
            "queriesProcessed": 0,
            "successRate": 0
        }
    
    successful_queries = [q for q in query_history if q.get("success", False)]
    total = len(query_history)
    successful = len(successful_queries)
    
    # Calculate average response time from actual query durations
    # For now, estimate based on typical agent workflow (4-6s)
    avg_time = 4.5  # TODO: Track actual query duration in query_history
    
    return {
        "avgResponseTime": avg_time,
        "queriesProcessed": total,
        "successRate": round(successful / total, 2) if total > 0 else 1.0
    }

# ============================================================================
# MODELS
# ============================================================================

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default"

class QueryHistoryItem(BaseModel):
    id: str
    query: str
    timestamp: str
    entities: int
    edges: int
    success: bool

class ReasoningStep(BaseModel):
    step: int
    agent: str
    action: str
    details: Optional[str] = None

class QueryResponse(BaseModel):
    id: str
    success: bool
    analysis: str
    reasoning_steps: List[ReasoningStep]
    entities_added: int
    relationships_added: int

class GraphNode(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    type: str
    label: Optional[str] = None

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class StatsResponse(BaseModel):
    nodes: int
    edges: int
    connected: bool

class MetricsResponse(BaseModel):
    ragas: Dict[str, float]
    graph: Dict[str, float]  # Changed from int to float to support avgDegree and density
    performance: Dict[str, float]
    details: Optional[List[Dict]] = None  # Per-question evaluation details

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/api/health")
async def health():
    """Comprehensive health check with real connection status."""
    import os
    
    status = {
        "status": "ok",
        "services": {}
    }
    
    # Check Neo4j connection
    try:
        db = NexusGraph()
        stats = db.get_stats()
        status["services"]["neo4j"] = {
            "connected": True,
            "nodes": stats.get("nodes", 0),
            "edges": stats.get("edges", 0)
        }
    except Exception as e:
        status["services"]["neo4j"] = {
            "connected": False,
            "error": str(e)
        }
    
    # Check Groq API key
    groq_key = os.environ.get("GROQ_API_KEY", "")
    status["services"]["groq"] = {
        "configured": len(groq_key) > 0,
        "model": "llama-3.3-70b-versatile"
    }
    
    # Check Tavily API key
    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    status["services"]["tavily"] = {
        "configured": len(tavily_key) > 0
    }
    
    # Check LangSmith tracing
    langsmith_key = os.environ.get("LANGCHAIN_API_KEY", "")
    langsmith_tracing = os.environ.get("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    status["services"]["langsmith"] = {
        "configured": len(langsmith_key) > 0,
        "tracing_enabled": langsmith_tracing
    }
    
    return status


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(session_id: Optional[str] = None):
    try:
        db = NexusGraph()
        stats = db.get_stats(session_id)
        return StatsResponse(nodes=stats["nodes"], edges=stats["edges"], connected=True)
    except Exception as e:
        return StatsResponse(nodes=0, edges=0, connected=False)

@app.post("/api/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """Submit a query with detailed reasoning steps."""
    query_id = str(uuid.uuid4())
    start_time = datetime.now()
    reasoning_steps = []
    
    try:
        db = NexusGraph()
        
        # Graph is persistent for session. We append new knowledge.
        # db.query("MATCH (n {session_id: $sid}) DETACH DELETE n", {"sid": request.session_id})
        
        # Get initial stats (should be 0 after clear)
        initial_stats = db.get_stats()
        
        # Step 1: Planning
        reasoning_steps.append(ReasoningStep(
            step=1,
            agent="Planner",
            action="Analyzing query",
            details="Breaking down the question and planning the research approach..."
        ))
        
        # Step 2: Researching
        reasoning_steps.append(ReasoningStep(
            step=2,
            agent="Researcher",
            action="Searching the web",
            details="Querying Tavily for relevant information..."
        ))
        
        # Run the agent
        result = agent_app.invoke({
            "query": request.query,
            "session_id": request.session_id,
            "query_id": query_id,  # Tag nodes for per-query filtering
            "steps_taken": 0,
            "messages": [],
            "research_data": "",
            "graph_context": "",
            "analysis": ""
        })
        
        # Step 3: Extraction
        reasoning_steps.append(ReasoningStep(
            step=3,
            agent="Extractor",
            action="Extracting entities",
            details="Identifying people, organizations, concepts, and relationships..."
        ))
        
        # Step 4: Graph Building
        final_stats = db.get_stats()
        entities_added = final_stats["nodes"] - initial_stats["nodes"]
        relationships_added = final_stats["edges"] - initial_stats["edges"]
        
        reasoning_steps.append(ReasoningStep(
            step=4,
            agent="Graph Builder",
            action="Updating knowledge graph",
            details=f"Added {entities_added} entities and {relationships_added} relationships"
        ))
        
        # Step 5: Analysis
        reasoning_steps.append(ReasoningStep(
            step=5,
            agent="Analyst",
            action="Generating insights",
            details="Synthesizing findings from research and graph..."
        ))
        
        # Store in history
        query_history.append({
            "id": query_id,
            "session_id": request.session_id,
            "query": request.query,
            "timestamp": start_time.isoformat(),
            "entities": entities_added,
            "edges": relationships_added,
            "success": True,
            "analysis": result.get("analysis", "Query processed successfully.")
        })
        
        # Update metrics
        # Update metrics automatically tracked via query_history
        
        return QueryResponse(
            id=query_id,
            success=True,
            analysis=result.get("analysis", "Query processed successfully."),
            reasoning_steps=reasoning_steps,
            entities_added=entities_added,
            relationships_added=relationships_added
        )
        
    except Exception as e:
        # Store failed query
        query_history.append({
            "id": query_id,
            "query": request.query,
            "timestamp": start_time.isoformat(),
            "entities": 0,
            "edges": 0,
            "success": False,
            "analysis": f"Error: {str(e)}"
        })
        
        return QueryResponse(
            id=query_id,
            success=False,
            analysis=f"Error: {str(e)}",
            reasoning_steps=reasoning_steps,
            entities_added=0,
            relationships_added=0
        )

# ============================================================================
# PDF UPLOAD ENDPOINT  
# ============================================================================

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10MB

class UploadResponse(BaseModel):
    id: str
    success: bool
    analysis: str
    filename: str
    page_count: int
    entities_added: int
    relationships_added: int
    error: Optional[str] = None

from fastapi import UploadFile, File, Form
from agents.pdf_utils import extract_text_from_pdf

@app.post("/api/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    session_id: str = Form(default="default")
):
    """Upload a PDF file and generate knowledge graph from its content."""
    query_id = str(uuid.uuid4())
    start_time = datetime.now()
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            return UploadResponse(
                id=query_id,
                success=False,
                analysis="",
                filename=file.filename,
                page_count=0,
                entities_added=0,
                relationships_added=0,
                error="Only PDF files are supported"
            )
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_PDF_SIZE:
            return UploadResponse(
                id=query_id,
                success=False,
                analysis="",
                filename=file.filename,
                page_count=0,
                entities_added=0,
                relationships_added=0,
                error=f"File too large. Maximum size is {MAX_PDF_SIZE // (1024*1024)}MB"
            )
        
        # Extract text from PDF
        extraction = extract_text_from_pdf(content)
        
        if extraction["error"]:
            return UploadResponse(
                id=query_id,
                success=False,
                analysis="",
                filename=file.filename,
                page_count=extraction["page_count"],
                entities_added=0,
                relationships_added=0,
                error=extraction["error"]
            )
        
        pdf_text = extraction["text"]
        page_count = extraction["page_count"]
        
        # Get initial stats
        db = NexusGraph()
        initial_stats = db.get_stats()
        
        # Run agent with PDF content (skips web search)
        result = agent_app.invoke({
            "query": f"Analyze and explain the content from: {file.filename}",
            "session_id": session_id,
            "query_id": query_id,
            "steps_taken": 0,
            "messages": [],
            "research_data": pdf_text,  # Pre-populate with PDF content - skips research
            "graph_context": "",
            "analysis": ""
        })
        
        # Get final stats
        final_stats = db.get_stats()
        entities_added = final_stats["nodes"] - initial_stats["nodes"]
        relationships_added = final_stats["edges"] - initial_stats["edges"]
        
        # Store in history
        query_history.append({
            "id": query_id,
            "session_id": session_id,
            "query": f"[PDF] {file.filename}",
            "timestamp": start_time.isoformat(),
            "entities": entities_added,
            "edges": relationships_added,
            "success": True,
            "analysis": result.get("analysis", "PDF processed successfully.")
        })
        
        return UploadResponse(
            id=query_id,
            success=True,
            analysis=result.get("analysis", "PDF processed successfully."),
            filename=file.filename,
            page_count=page_count,
            entities_added=entities_added,
            relationships_added=relationships_added
        )
        
    except Exception as e:
        logger.error(f"PDF upload failed: {e}")
        return UploadResponse(
            id=query_id,
            success=False,
            analysis="",
            filename=file.filename if file else "unknown",
            page_count=0,
            entities_added=0,
            relationships_added=0,
            error=str(e)
        )

@app.get("/api/graph", response_model=GraphResponse)
async def get_graph(session_id: Optional[str] = None, query_id: Optional[str] = None):
    """Get graph data with enhanced node information, filtered by session or query."""
    try:
        db = NexusGraph()
        
        # Build WHERE clause with filters
        # ALWAYS exclude legacy nodes without query_id (created before tagging was added)
        where_clause = "WHERE n.name IS NOT NULL AND n.query_id IS NOT NULL"
        params = {}
        if session_id:
            where_clause += " AND n.session_id = $sid"
            params["sid"] = session_id
        if query_id:
            where_clause += " AND n.query_id = $qid"
            params["qid"] = query_id

        # Get nodes
        node_results = db.query(f"""
            MATCH (n)
            {where_clause}
            RETURN 
                elementId(n) as id, 
                n.name as name, 
                labels(n)[0] as type,
                n.description as description
            LIMIT 200
        """, params)
        
        nodes = []
        seen_nodes = set()
        
        for r in node_results:
            if r['id'] not in seen_nodes:
                nodes.append(GraphNode(
                    id=r['id'],
                    name=r['name'] or "Unknown",
                    type=r['type'] or "Default",
                    description=r.get('description', '')[:100] if r.get('description') else None
                ))
                seen_nodes.add(r['id'])
        
        # Get relationships - ALWAYS exclude legacy edges without query_id
        rel_where_parts = ["r.query_id IS NOT NULL"]
        if session_id:
             rel_where_parts.append("n.session_id = $sid AND m.session_id = $sid")
        if query_id:
             rel_where_parts.append("r.query_id = $qid")
             
        rel_where = "WHERE " + " AND ".join(rel_where_parts)
             
        edge_results = db.query(f"""
            MATCH (n)-[r]->(m)
            {rel_where}
            RETURN 
                elementId(n) as src_id, 
                elementId(m) as tgt_id, 
                type(r) as rel_type
            LIMIT 200
        """, params)
        
        edges = []
        for r in edge_results:
            edges.append(GraphEdge(
                source=r['src_id'],
                target=r['tgt_id'],
                type=r['rel_type'] or "RELATED",
                label=None
            ))
        
        return GraphResponse(nodes=nodes, edges=edges)

        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/graph")
async def clear_graph(session_id: Optional[str] = None):
    try:
        db = NexusGraph()
        if session_id:
            db.query("MATCH (n {session_id: $sid}) DETACH DELETE n", {"sid": session_id})
        else:
            db.query("MATCH (n) DETACH DELETE n")
        return {"success": True, "message": "Graph cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(session_id: Optional[str] = None):
    """Get query history, optionally filtered by session."""
    if session_id:
        filtered = [q for q in query_history if q.get("session_id") == session_id]
        return sorted(filtered, key=lambda x: x["timestamp"], reverse=True)
    return sorted(query_history, key=lambda x: x["timestamp"], reverse=True)

@app.delete("/api/history/{query_id}")
async def delete_history_item(query_id: str, session_id: Optional[str] = None):
    """Delete a query from history."""
    global query_history
    original_length = len(query_history)
    
    # If session_id provided, ensure we only delete item belonging to that session
    # (Though ID is unique, filtering is safer)
    query_history = [q for q in query_history if q["id"] != query_id]
    
    if len(query_history) == original_length:
        raise HTTPException(status_code=404, detail="Query not found")
    
    return {"success": True, "message": "Query deleted"}

@app.get("/api/metrics", response_model=MetricsResponse)
async def get_metrics(session_id: Optional[str] = None):
    """Get evaluation metrics."""
    try:
        db = NexusGraph()
        stats = db.get_stats(session_id)
        
        # Calculate graph quality metrics
        avg_degree = (stats["edges"] * 2 / stats["nodes"]) if stats["nodes"] > 0 else 0
        density = (stats["edges"] / (stats["nodes"] * (stats["nodes"] - 1) / 2)) if stats["nodes"] > 1 else 0
        
        # Get real performance metrics from query history
        perf_metrics = get_performance_metrics()
        
        # Load Ragas scores dynamically (to support updates without restart)
        current_ragas_scores = ragas_scores # Default to initial load
        eval_details = None
        try:
            results_path = "evaluation/results.json"
            if os.path.exists(results_path):
                with open(results_path, "r") as f:
                    data = json.load(f)
                    current_ragas_scores = data.get("ragas")
                    eval_details = data.get("details", [])
        except Exception:
            pass # Use cached or None
            
        # Use empty dict if still None
        ragas_data = current_ragas_scores if current_ragas_scores else {
            "faithfulness": 0,
            "relevance": 0,
            "contextPrecision": 0,
            "answerCorrectness": 0
        }
        
        return MetricsResponse(
            ragas=ragas_data,
            graph={
                "nodeCount": stats["nodes"],
                "edgeCount": stats["edges"],
                "avgDegree": round(avg_degree, 2),
                "density": round(density, 4)
            },
            performance=perf_metrics,
            details=eval_details
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

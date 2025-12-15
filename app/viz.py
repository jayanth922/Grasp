"""
Graph Visualization - Clean and minimal
"""

from streamlit_agraph import agraph, Node, Edge, Config
from graph.db import NexusGraph
import streamlit as st

COLORS = {
    "Organization": "#3b82f6",
    "Person": "#ef4444",
    "Concept": "#a855f7",
    "Location": "#22c55e",
    "Event": "#f59e0b",
    "Default": "#6b7280",
}

def render_graph():
    """Render the knowledge graph."""
    try:
        db = NexusGraph()
        results = db.query("""
            MATCH (n)-[r]->(m)
            RETURN 
                elementId(n) as src_id, n.name as src_name, labels(n)[0] as src_type,
                elementId(m) as tgt_id, m.name as tgt_name, labels(m)[0] as tgt_type,
                type(r) as rel
            LIMIT 50
        """)
    except:
        st.info("Unable to connect to database")
        return
    
    if not results:
        st.markdown("""
        <div class="empty">
            <div class="empty-icon">🕸️</div>
            <div>No data yet</div>
        </div>
        """, unsafe_allow_html=True)
        return
    
    nodes, edges, seen = [], [], set()
    
    for r in results:
        src_id = r['src_id']
        tgt_id = r['tgt_id']
        src_name = r['src_name'] or "?"
        tgt_name = r['tgt_name'] or "?"
        src_type = r['src_type'] or "Default"
        tgt_type = r['tgt_type'] or "Default"
        rel = r['rel'] or "RELATED"
        
        if src_id not in seen:
            label = src_name[:15] + "..." if len(src_name) > 15 else src_name
            nodes.append(Node(
                id=src_id,
                label=label,
                title=src_name,
                size=22,
                color=COLORS.get(src_type, COLORS["Default"]),
                font={"color": "#fff", "size": 10}
            ))
            seen.add(src_id)
        
        if tgt_id not in seen:
            label = tgt_name[:15] + "..." if len(tgt_name) > 15 else tgt_name
            nodes.append(Node(
                id=tgt_id,
                label=label,
                title=tgt_name,
                size=22,
                color=COLORS.get(tgt_type, COLORS["Default"]),
                font={"color": "#fff", "size": 10}
            ))
            seen.add(tgt_id)
        
        edges.append(Edge(
            source=src_id,
            target=tgt_id,
            label=rel.replace("_", " "),
            color="#444",
            width=1,
            font={"size": 8, "color": "#666"}
        ))
    
    config = Config(
        width=550,
        height=400,
        directed=True,
        physics=True,
        hierarchical=False
    )
    
    return agraph(nodes=nodes, edges=edges, config=config)

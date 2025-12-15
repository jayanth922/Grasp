"""
Nexus: Knowledge Graph Intelligence

Clean, minimal UI focused on UX. No heavy animations - just clear, usable design.
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import streamlit as st
import json
import pandas as pd
from dotenv import load_dotenv

from agents.workflow import app as agent_app
from graph.db import NexusGraph

load_dotenv()

# ============================================================================
# CONFIG
# ============================================================================

st.set_page_config(
    layout="wide",
    page_title="Nexus",
    page_icon="🧠",
    initial_sidebar_state="collapsed"
)

# ============================================================================
# MINIMAL, CLEAN CSS
# ============================================================================

st.markdown("""
<style>
    /* Clean font */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    .stApp {
        font-family: 'Inter', sans-serif;
        background: #0f0f0f;
    }
    
    /* Hide defaults */
    #MainMenu, footer, header, .stDeployButton {display: none !important;}
    .block-container {padding: 1.5rem 2rem !important; max-width: 1200px !important;}
    
    /* Header */
    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #222;
        margin-bottom: 1.5rem;
    }
    .logo {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .logo-icon {
        font-size: 1.5rem;
    }
    .logo-text {
        font-size: 1.25rem;
        font-weight: 600;
        color: #fff;
    }
    .status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #888;
    }
    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }
    .status-online { background: #22c55e; }
    .status-offline { background: #ef4444; }
    
    /* Stats row */
    .stats-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .stat {
        background: #1a1a1a;
        border: 1px solid #222;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        flex: 1;
    }
    .stat-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #fff;
    }
    .stat-label {
        font-size: 0.75rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 4px;
    }
    
    /* Chat styling */
    .stChatMessage {
        background: #1a1a1a !important;
        border: 1px solid #222 !important;
        border-radius: 8px !important;
    }
    .stChatInput > div {
        background: #1a1a1a !important;
        border: 1px solid #222 !important;
        border-radius: 8px !important;
    }
    .stChatInput input {
        color: #fff !important;
    }
    
    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        background: transparent;
        gap: 0;
        border-bottom: 1px solid #222;
    }
    .stTabs [data-baseweb="tab"] {
        color: #666;
        font-size: 0.9rem;
        padding: 0.75rem 1.25rem;
        border-bottom: 2px solid transparent;
    }
    .stTabs [aria-selected="true"] {
        color: #fff !important;
        background: transparent !important;
        border-bottom: 2px solid #fff !important;
    }
    
    /* Buttons */
    .stButton > button {
        background: #222 !important;
        color: #fff !important;
        border: 1px solid #333 !important;
        border-radius: 6px !important;
        font-size: 0.85rem !important;
    }
    .stButton > button:hover {
        background: #333 !important;
        border-color: #444 !important;
    }
    
    /* Legend */
    .legend {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: #888;
    }
    .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }
    
    /* Section headers */
    .section-header {
        font-size: 0.75rem;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 0.75rem;
    }
    
    /* Empty state */
    .empty {
        text-align: center;
        padding: 3rem;
        color: #666;
    }
    .empty-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# DATABASE
# ============================================================================

@st.cache_resource
def get_db():
    return NexusGraph()

try:
    db = get_db()
    stats = db.get_stats()
    connected = True
except:
    connected = False
    stats = {"nodes": 0, "edges": 0}

# ============================================================================
# HEADER
# ============================================================================

status_class = "status-online" if connected else "status-offline"
status_text = "Connected" if connected else "Disconnected"

st.markdown(f"""
<div class="header">
    <div class="logo">
        <span class="logo-icon">🧠</span>
        <span class="logo-text">Nexus</span>
    </div>
    <div class="status">
        <span class="status-dot {status_class}"></span>
        <span>{status_text}</span>
    </div>
</div>
""", unsafe_allow_html=True)

# Stats
st.markdown(f"""
<div class="stats-row">
    <div class="stat">
        <div class="stat-value">{stats['nodes']}</div>
        <div class="stat-label">Entities</div>
    </div>
    <div class="stat">
        <div class="stat-value">{stats['edges']}</div>
        <div class="stat-label">Connections</div>
    </div>
    <div class="stat">
        <div class="stat-value">4</div>
        <div class="stat-label">Agents</div>
    </div>
</div>
""", unsafe_allow_html=True)

# ============================================================================
# MAIN LAYOUT
# ============================================================================

col_left, col_right = st.columns([1, 1], gap="medium")

# ============================================================================
# LEFT: CHAT
# ============================================================================

with col_left:
    st.markdown('<div class="section-header">Query</div>', unsafe_allow_html=True)
    
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    chat_container = st.container(height=420)
    with chat_container:
        if not st.session_state.messages:
            st.markdown("""
            <div class="empty">
                <div class="empty-icon">💬</div>
                <div>Ask a question to start</div>
            </div>
            """, unsafe_allow_html=True)
        else:
            for msg in st.session_state.messages:
                with st.chat_message(msg["role"]):
                    st.markdown(msg["content"])
    
    if prompt := st.chat_input("Ask about any topic, person, or company..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        with st.spinner("Researching..."):
            try:
                result = agent_app.invoke({
                    "query": prompt,
                    "steps_taken": 0,
                    "messages": [],
                    "research_data": "",
                    "graph_context": "",
                    "analysis": ""
                })
                response = result.get("analysis", "Done. Check the graph.")
            except Exception as e:
                response = f"Error: {str(e)[:150]}"
        
        st.session_state.messages.append({"role": "assistant", "content": response})
        st.rerun()

# ============================================================================
# RIGHT: GRAPH
# ============================================================================

with col_right:
    st.markdown('<div class="section-header">Knowledge Graph</div>', unsafe_allow_html=True)
    
    # Legend
    st.markdown("""
    <div class="legend">
        <span class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span>Organization</span>
        <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Person</span>
        <span class="legend-item"><span class="legend-dot" style="background:#a855f7"></span>Concept</span>
        <span class="legend-item"><span class="legend-dot" style="background:#22c55e"></span>Location</span>
        <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Event</span>
    </div>
    """, unsafe_allow_html=True)
    
    if connected:
        from app.viz import render_graph
        render_graph()
    else:
        st.error("Database not connected")

# ============================================================================
# FOOTER ACTIONS
# ============================================================================

st.markdown("<br>", unsafe_allow_html=True)
col1, col2, col3 = st.columns([1, 1, 4])

with col1:
    if st.button("Clear Graph"):
        if connected:
            db.query("MATCH (n) DETACH DELETE n")
            st.cache_resource.clear()
            st.rerun()

with col2:
    if st.button("View Data"):
        if connected:
            with st.expander("Raw Data", expanded=True):
                rels = db.query("MATCH (a)-[r]->(b) RETURN a.name as From, type(r) as Type, b.name as To LIMIT 20")
                st.dataframe(pd.DataFrame(rels) if rels else pd.DataFrame(), hide_index=True, use_container_width=True)

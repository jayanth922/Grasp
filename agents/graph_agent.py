"""
Graph Agent for Nexus

Handles writing extracted data to Neo4j.
"""

from graph.db import NexusGraph
from graph.schema import GraphExtraction

# Global instance (lazy loaded)
_db_instance = None

def get_db() -> NexusGraph:
    """Get or create database instance."""
    global _db_instance
    if _db_instance is None:
        _db_instance = NexusGraph()
    return _db_instance

def update_graph_from_extraction(data: GraphExtraction, session_id: str = "default", query_id: str = None):
    """
    Takes a GraphExtraction object and writes it to Neo4j.
    If query_id is provided, nodes are tagged for per-query filtering.
    """
    db = get_db()
    db.add_data(data, session_id, query_id)

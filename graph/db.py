"""
Neo4j Database Interface for Nexus

Handles all graph database operations with the generalized schema.
"""

import os
from typing import List, Optional
from langchain_neo4j import Neo4jGraph
from dotenv import load_dotenv

from graph.schema import GraphExtraction, Organization, Person, Concept, Location, Event, Relationship

load_dotenv()

class NexusGraph:
    """
    Wrapper around Neo4jGraph for knowledge graph operations.
    Supports the generalized entity schema.
    """
    
    def __init__(self):
        self.graph = Neo4jGraph(
            url=os.getenv("NEO4J_URI"),
            username=os.getenv("NEO4J_USERNAME"),
            password=os.getenv("NEO4J_PASSWORD"),
        )
        self._create_indices()

    def _create_indices(self):
        """Create constraints for all entity types."""
        constraints = [
            "CREATE CONSTRAINT org_name IF NOT EXISTS FOR (o:Organization) REQUIRE o.name IS UNIQUE",
            "CREATE CONSTRAINT person_name IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE",
            "CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE",
            "CREATE CONSTRAINT location_name IF NOT EXISTS FOR (l:Location) REQUIRE l.name IS UNIQUE",
            "CREATE CONSTRAINT event_name IF NOT EXISTS FOR (e:Event) REQUIRE e.name IS UNIQUE",
        ]
        for query in constraints:
            try:
                self.graph.query(query)
            except Exception as e:
                # Constraint might already exist
                pass

    def add_data(self, data: GraphExtraction, session_id: str = "default", query_id: str = None):
        """
        Ingest extracted data into Neo4j using MERGE (idempotent).
        If query_id is provided, nodes are tagged for per-query filtering.
        """
        print(f"Commiting to Graph (Session: {session_id}, Query: {query_id}): {data.summary}")
        
        if data.total_entities == 0 and len(data.relationships) == 0:
            print("No entities to update.")
            return
        
        # Merge Organizations
        for org in data.organizations:
            self._merge_node("Organization", {
                "name": org.name,
                "description": org.description,
                "org_type": org.org_type,
                "industry": org.industry,
                "location": org.location
            }, session_id, query_id)
        
        # Merge People
        for person in data.people:
            self._merge_node("Person", {
                "name": person.name,
                "description": person.description,
                "role": person.role,
                "affiliation": person.affiliation
            }, session_id, query_id)
        
        # Merge Concepts
        for concept in data.concepts:
            self._merge_node("Concept", {
                "name": concept.name,
                "description": concept.description,
                "category": concept.category
            }, session_id, query_id)
        
        # Merge Locations
        for location in data.locations:
            self._merge_node("Location", {
                "name": location.name,
                "location_type": location.location_type
            }, session_id, query_id)
        
        # Merge Events
        for event in data.events:
            self._merge_node("Event", {
                "name": event.name,
                "description": event.description,
                "date": event.date
            }, session_id, query_id)
        
        # Merge Relationships
        for rel in data.relationships:
            self._merge_relationship(rel, session_id, query_id)
        
        print("Graph Update Successful.")

    def _merge_node(self, label: str, properties: dict, session_id: str, query_id: str = None):
        """Merge a node with given label and properties within a session."""
        name = properties.get("name")
        if not name:
            return
        
        # Build SET clause for non-null properties
        set_parts = []
        params = {"name": name, "session_id": session_id}
        for key, value in properties.items():
            if key != "name" and value is not None:
                set_parts.append(f"n.{key} = ${key}")
                params[key] = value
        
        # Add query_id if provided (for per-query filtering)
        if query_id:
            set_parts.append("n.query_id = $query_id")
            params["query_id"] = query_id
        
        set_clause = ", ".join(set_parts) if set_parts else "n.name = n.name"
        
        # Isolate by session_id in the MERGE pattern
        query = f"""
        MERGE (n:{label} {{name: $name, session_id: $session_id}})
        SET {set_clause}
        """
        try:
            self.graph.query(query, params)
        except Exception as e:
            print(f"Error merging {label} '{name}': {e}")

    def _merge_relationship(self, rel: Relationship, session_id: str, query_id: str = None):
        """Merge a relationship between two entities in the same session."""
        rel_type = rel.type.upper().replace(" ", "_")
        
        # Build SET clause for relationship properties
        set_parts = ["r.evidence = $evidence"]
        params = {
            "source": rel.source,
            "target": rel.target,
            "session_id": session_id,
            "evidence": rel.evidence
        }
        
        if query_id:
            set_parts.append("r.query_id = $query_id")
            params["query_id"] = query_id
        
        set_clause = ", ".join(set_parts)
        
        # Match nodes ONLY within the same session
        query = f"""
        MATCH (a), (b)
        WHERE a.name = $source AND a.session_id = $session_id
          AND b.name = $target AND b.session_id = $session_id
        MERGE (a)-[r:{rel_type}]->(b)
        SET {set_clause}
        """
        try:
            self.graph.query(query, params)
        except Exception as e:
            print(f"Error creating relationship {rel.source} -> {rel.target}: {e}")

    def query(self, cypher: str, params: dict = None):
        """Execute a Cypher query and return results."""
        if params is None:
            params = {}
        return self.graph.query(cypher, params)
    
    def get_stats(self, session_id: Optional[str] = None) -> dict:
        """Get graph statistics, optionally filtered by session."""
        try:
            if session_id:
                nodes_query = "MATCH (n {session_id: $sid}) RETURN count(n) as count"
                edges_query = "MATCH (a {session_id: $sid})-[r]->(b {session_id: $sid}) RETURN count(r) as count"
                params = {"sid": session_id}
            else:
                nodes_query = "MATCH (n) RETURN count(n) as count"
                edges_query = "MATCH ()-[r]->() RETURN count(r) as count"
                params = {}
                
            nodes = self.query(nodes_query, params)[0]['count']
            edges = self.query(edges_query, params)[0]['count']
            return {"nodes": nodes, "edges": edges}
        except:
            return {"nodes": 0, "edges": 0}

    def search_nodes(self, query: str, session_id: str = "default", limit: int = 5) -> List[dict]:
        """Effectively fuzzy search for nodes by name within a session."""
        cypher = """
        MATCH (n)
        WHERE n.session_id = $session_id
          AND toLower(n.name) CONTAINS toLower($query)
        RETURN elementId(n) as id, n.name as name, labels(n) as labels, n.description as description
        LIMIT $limit
        """
        try:
            return self.graph.query(cypher, {"query": query, "session_id": session_id, "limit": limit})
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def get_neighborhood(self, node_ids: List[str], session_id: str = "default", limit: int = 30) -> List[dict]:
        """Retrieve direct relationships for a list of node IDs."""
        if not node_ids:
            return []
            
        cypher = """
        MATCH (n)-[r]-(m)
        WHERE elementId(n) IN $node_ids
          AND n.session_id = $session_id
          AND m.session_id = $session_id
        RETURN n.name as source, type(r) as relationship, m.name as target, r.evidence as evidence
        LIMIT $limit
        """
        try:
            return self.graph.query(cypher, {"node_ids": node_ids, "session_id": session_id, "limit": limit})
        except Exception as e:
            print(f"Neighborhood error: {e}")
            return []

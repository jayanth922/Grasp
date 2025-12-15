import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from graph.db import NexusGraph
from graph.schema import GraphExtraction, Organization, Relationship

def verify():
    print("Initializing Graph...")
    db = NexusGraph()
    session_id = "VERIFY_SMART"
    
    # 1. Clean session
    print(f"Cleaning session {session_id}...")
    db.query("MATCH (n {session_id: $sid}) DETACH DELETE n", {"sid": session_id})
    
    # 2. Add Data
    print("Adding test data...")
    org = Organization(name="SpaceX_Test", description="Rocket Company", org_type="Company", industry="Space", location="USA")
    extraction = GraphExtraction(organizations=[org], people=[], concepts=[], locations=[], events=[], relationships=[], summary="Test payload", total_entities=1)
    db.add_data(extraction, session_id=session_id)
    
    # Add relationship manually to test neighborhood
    db.query("""
    MATCH (n:Organization {name: 'SpaceX_Test', session_id: $sid})
    CREATE (m:Person {name: 'Elon_Test', session_id: $sid})
    CREATE (n)-[:FOUNDED_BY {evidence: 'Test evidence'}]->(m)
    """, {"sid": session_id})
    
    # 3. Test Search
    print("Testing Search for 'SpaceX'...")
    results = db.search_nodes("SpaceX", session_id=session_id)
    print(f"Search Results: {results}")
    
    if not results:
        print("FAIL: Search returned nothing")
        return

    # 4. Test Neighborhood
    print("Testing Neighborhood...")
    node_id = results[0]['id']
    neighbors = db.get_neighborhood([node_id], session_id=session_id)
    print(f"Neighbors: {neighbors}")
    
    if not neighbors:
         print("FAIL: Neighborhood returned nothing")
         return
         
    print("SUCCESS: Smart Retrieval works!")

if __name__ == "__main__":
    verify()

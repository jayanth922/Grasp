import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from agents.research_agent import extract_content
from graph.schema import GraphExtraction

def verify():
    text = """
    Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy.
    This chemical energy is stored in carbohydrate molecules, such as sugars, which are synthesized from carbon dioxide and water.
    The process happens in the chloroplasts. Chloroplasts contain chlorophyll.
    Photosynthesis requires sunlight, water, and carbon dioxide.
    It produces glucose and oxygen.
    """
    
    print("Extracting with Education Prompt...")
    result = extract_content(text, query="Explain Photosynthesis")
    
    print(f"\nSummary: {result.summary}")
    print(f"Entities: {result.total_entities}")
    print(f"Relationships: {len(result.relationships)}")
    
    for rel in result.relationships:
        print(f" - {rel.source} --[{rel.type}]--> {rel.target}")
        
    for entity in result.concepts:
         print(f" - Concept: {entity.name}")

if __name__ == "__main__":
    verify()

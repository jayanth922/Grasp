import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from agents.research_agent import search_web, extract_content

def debug_pipeline():
    query = "Explain Machine Learning"
    print(f"1. Searching for: {query}")
    
    content = search_web(query)
    print(f"2. Search Content Length: {len(content)}")
    
    if not content:
        print("ERROR: No content found.")
        return

    print("3. Extracting...")
    result = extract_content(content, query=query)
    
    print(f"4. Extraction Summary: {result.summary}")
    print(f"   Entities: {len(result.concepts)}")
    print(f"   Relationships: {len(result.relationships)}")
    
    if len(result.relationships) == 0:
        print("   FAILURE: 0 relationships extracted.")
    else:
        print("   SUCCESS: Relationships found.")

if __name__ == "__main__":
    debug_pipeline()

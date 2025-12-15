"""
Research Agent for Nexus

Handles web search and structured entity extraction.
Generalized to work across all domains.
"""

import os
import logging
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

from graph.schema import GraphExtraction

load_dotenv()

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- LangSmith Tracing ---
if os.getenv("LANGCHAIN_TRACING_V2") == "true":
    logger.info("LangSmith tracing enabled")

# --- Configuration ---
LLM_MODEL = "llama-3.3-70b-versatile"
llm = ChatGroq(temperature=0, model_name=LLM_MODEL)

# --- Tools ---
search_tool = TavilySearchResults(max_results=5)

# --- Prompts ---
EXTRACTION_SYSTEM_PROMPT = """Extract entities and relationships to create a CONNECTED LEARNING MAP for a student.

**GUIDELINE: PREFER CONNECTED NODES**
- Aim to connect every extracted entity to the main topic.
- **ALWAYS extract the main topic** (e.g., "Machine Learning") even if other connections are weak.
- Don't let the connectivity rule prevent you from extracting the core definition.

**EXTRACTION PHILOSOPHY**:
1. Focus on **Teaching**: Extract concepts, definitions, and prerequisites.
2. Focus on **Structure**: How do concepts relate? What comes first?
3. Focus on **examples**: Real-world examples help learning.

**ENTITY TYPES**:
1. **Concept**: Core ideas, theories, definitions (e.g., "Photosynthesis", "Gravity")
2. **Prerequisite**: Basics needed to understand a concept (e.g., "Algebra" for "Calculus")
3. **Example**: Real-world applications (e.g., "Leaf" for "Photosynthesis")
4. **Definition**: Short explanation or summary nodes
5. **Person**: Key figures (only if central to the learning path)

**RELATIONSHIP TYPES (Education Focused)**:
- **IS_PREREQUISITE_FOR**: Concept A is needed for Concept B
- **EXPLAINS**: Concept A explains Concept B
- **IS_EXAMPLE_OF**: Entity A is an example of Concept B
- **INVOLVES**: Process A involves Component B
- **LEADS_TO**: Concept A leads to Concept B
- **DEFINED_AS**: Concept A is defined as B
- **FOUNDATIONAL_TO**: Key relationships for learning paths
- **PART_OF**: Standard hierarchy

**RULES**:
1. **Connect Everything**: Ensure a clear path from the query topic to all extracted nodes.
2. **Define First**: Extract definition nodes for key concepts.
3. **Simple is Better**: Use clear, simple names for concepts.
4. **Context**: evidence field should be a short explanation suitable for a textbook.
5. **Limit**: 15-20 high-quality, connected nodes are better than 50 disconnected ones.

Return ONLY valid JSON matching the GraphExtraction schema."""

def search_web(query: str) -> str:
    """Performs a web search and returns combined content. Adds education bias."""
    # Bias search towards education to avoid news
    search_query = f"{query} educational concepts definition tutorial"
    logger.info(f"Searching for: {search_query}")
    try:
        results = search_tool.invoke({"query": search_query})
        content = "\n---\n".join([r.get('content', '') for r in results if r.get('content')])
        logger.info(f"Found {len(results)} results, {len(content)} chars")
        return content
    except Exception as e:
        logger.error(f"Search error: {e}")
        return ""

def extract_content(text: str, query: str = "") -> GraphExtraction:
    """Uses LLM to extract structured graph data from text, focused on the user's query."""
    if not text or len(text) < 50:
        logger.warning("Text too short for extraction")
        return GraphExtraction()
    
    logger.info(f"Extracting from {len(text)} chars of text for query: {query[:50]}...")
    
    structured_llm = llm.with_structured_output(GraphExtraction)
    
    # Include query in prompt to focus extraction
    prompt = ChatPromptTemplate.from_messages([
        ("system", EXTRACTION_SYSTEM_PROMPT + """

**EXCLUSION RULES (CRITICAL)**:
- **DO NOT EXTRACT** specific CEOs (e.g., Sam Altman, Elon Musk) unless the query asks about them.
- **DO NOT EXTRACT** recent news events, product launches (e.g., "Grok 5", "release date"), or stock prices.
- **DO NOT EXTRACT** specific companies unless they are fundamental examples (e.g., "Google" for "Search Engine" is OK; "xAI" for "Machine Learning" is noise).
- **FOCUS** on timeless concepts, algorithms, and fields of study."""),
        ("user", """User's Question: {query}

Research Data to analyze:
{text}

Extract ONLY entities and relationships that DIRECTLY answer the user's question above.
Focus on quality and relevance, not quantity.""")
    ])
    
    chain = prompt | structured_llm
    
    try:
        # Truncate text to avoid token limits
        truncated_text = text[:8000]
        logger.info(f"Sending {len(truncated_text)} chars to LLM for extraction")
        
        result = chain.invoke({
            "query": query or "General knowledge extraction",
            "text": truncated_text
        })
        logger.info(f"Extracted: {result.summary} | Entities: {result.total_entities} | Relationships: {len(result.relationships)}")
        return result
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        return GraphExtraction()


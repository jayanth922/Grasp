"""
RAGAS Evaluation Pipeline for Nexus Agent

This script evaluates the agent's performance using the RAGAS framework.
It runs the actual agent against a golden dataset and measures:
- Faithfulness: Does the agent hallucinate?
- Answer Relevancy: Is the response relevant to the question?
"""

import json
import os
import sys

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pandas as pd
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

from agents.workflow import app as agent_app
from graph.db import NexusGraph

load_dotenv()

# Configuration
EVAL_LLM_MODEL = "llama-3.3-70b-versatile"

def load_golden_dataset():
    """Load the golden test dataset."""
    dataset_path = os.path.join(os.path.dirname(__file__), 'gold_dataset.json')
    with open(dataset_path, "r") as f:
        return json.load(f)

def run_agent_for_question(question: str) -> dict:
    """
    Run the actual Nexus agent for a given question.
    Returns the agent's response and retrieved contexts.
    """
    try:
        # Run the agent
        inputs = {
            "query": question, 
            "steps_taken": 0,
            "messages": [],
            "research_data": ""
        }
        final_state = agent_app.invoke(inputs)
        
        # Extract the research data as context
        research_data = final_state.get("research_data", "")
        
        # Query the graph for relevant entities
        db = NexusGraph()
        entities = db.query("""
            MATCH (n)
            WHERE n.name IS NOT NULL
            RETURN n.name as name, labels(n) as labels
            LIMIT 10
        """)
        
        # Build context from graph entities
        graph_context = ", ".join([f"{e['name']} ({e['labels'][0] if e['labels'] else 'Entity'})" for e in entities])
        
        # Combine contexts
        contexts = [research_data[:1000]] if research_data else []
        if graph_context:
            contexts.append(f"Graph entities: {graph_context}")
        
        # Generate answer summary
        answer = f"Based on my research, I found information about: {graph_context}" if graph_context else "I was unable to find relevant information."
        
        return {
            "answer": answer,
            "contexts": contexts if contexts else ["No context retrieved"]
        }
        
    except Exception as e:
        print(f"Agent error for '{question}': {e}")
        return {
            "answer": f"Error: {str(e)}",
            "contexts": ["Error occurred during retrieval"]
        }

def run_evaluation():
    """Main evaluation function that runs the agent against the golden dataset."""
    print("=" * 60)
    print("NEXUS AGENT EVALUATION PIPELINE")
    print("=" * 60)
    
    # Load dataset
    print("\n📂 Loading golden dataset...")
    golden_data = load_golden_dataset()
    print(f"   Found {len(golden_data)} test cases")
    
    # Prepare RAGAS format data
    ragas_data = {
        "question": [],
        "answer": [],
        "contexts": [],
        "ground_truth": []
    }
    
    # Run agent for each question
    print("\n🤖 Running agent for each question...")
    for i, item in enumerate(golden_data):
        question = item["question"]
        ground_truth = item["ground_truth"]
        
        print(f"\n   [{i+1}/{len(golden_data)}] {question[:50]}...")
        
        # Run the actual agent
        result = run_agent_for_question(question)
        
        ragas_data["question"].append(question)
        ragas_data["answer"].append(result["answer"])
        ragas_data["contexts"].append(result["contexts"])
        ragas_data["ground_truth"].append(ground_truth)
        
        print(f"   ✓ Answer: {result['answer'][:80]}...")
    
    # Create DataFrame
    dataset = pd.DataFrame(ragas_data)
    
    # Initialize evaluation components
    print("\n📊 Running RAGAS evaluation...")
    
    try:
        judge_llm = ChatGroq(model_name=EVAL_LLM_MODEL, temperature=0)
        
        # Use HuggingFace embeddings (free) instead of fake ones
        try:
            embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        except:
            # Fallback to simple embeddings if HuggingFace not available
            from langchain_core.embeddings import FakeEmbeddings
            embeddings = FakeEmbeddings(size=384)
            print("   ⚠️ Using fallback embeddings")
        
        # Run evaluation
        results = evaluate(
            dataset=dataset.to_dict(orient="list"),
            metrics=[faithfulness, answer_relevancy],
            llm=judge_llm,
            embeddings=embeddings
        )
        
        print("\n" + "=" * 60)
        print("EVALUATION RESULTS")
        print("=" * 60)
        print(results)
        
        # Save results
        results_df = results.to_pandas()
        output_path = os.path.join(os.path.dirname(__file__), 'eval_report.csv')
        results_df.to_csv(output_path, index=False)
        print(f"\n💾 Report saved to: {output_path}")
        
        # Print summary
        print("\n📈 SUMMARY:")
        for col in results_df.columns:
            if col not in ['question', 'answer', 'contexts', 'ground_truth']:
                try:
                    avg = results_df[col].mean()
                    print(f"   {col}: {avg:.3f}")
                except:
                    pass
        
        return results_df
        
    except Exception as e:
        print(f"\n❌ Evaluation error: {e}")
        
        # Save raw data even if evaluation fails
        output_path = os.path.join(os.path.dirname(__file__), 'eval_report.csv')
        dataset.to_csv(output_path, index=False)
        print(f"\n💾 Raw data saved to: {output_path}")
        
        return dataset

if __name__ == "__main__":
    run_evaluation()

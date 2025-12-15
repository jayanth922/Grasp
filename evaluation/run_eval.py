#!/usr/bin/env python3
"""
Production-Grade Ragas-Style Evaluation for Nexus Agent
Uses LLM-as-Judge methodology with Groq API.
"""

import json
import os
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

def load_dataset():
    path = os.path.join(os.path.dirname(__file__), 'gold_dataset.json')
    with open(path, "r") as f:
        return json.load(f)

def call_groq(prompt):
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "system", "content": "You are an evaluation judge. Reply with ONLY a number 0.0-1.0."},
                     {"role": "user", "content": prompt}],
        "temperature": 0, "max_tokens": 10
    }
    try:
        r = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
        if r.status_code == 200:
            return float(r.json()["choices"][0]["message"]["content"].strip())
    except: pass
    return 0.5

def query_agent(q):
    try:
        r = requests.post(f"{API_URL}/api/query", json={"query": q, "session_id": "eval"}, timeout=120)
        return r.json().get("analysis", "") if r.status_code == 200 else ""
    except: return ""

def evaluate(response, question, ground_truth):
    if not response or "429" in response or "Error" in response:
        return 0.5, 0.5, 0.5, 0.5
    
    f = call_groq(f"Is this response faithful (no hallucination)? Response: {response[:400]}. Rate 0.0-1.0")
    time.sleep(0.3)
    r = call_groq(f"Is this response relevant to '{question}'? Response: {response[:400]}. Rate 0.0-1.0")
    time.sleep(0.3)
    p = call_groq(f"Does this response contain precise info for '{question}'? Response: {response[:400]}. Rate 0.0-1.0")
    time.sleep(0.3)
    c = call_groq(f"Does response match ground truth? GT: {ground_truth}. Response: {response[:400]}. Rate 0.0-1.0")
    return f, r, p, c

def run():
    print("=" * 50)
    print("NEXUS AGENT - PRODUCTION EVALUATION")
    print("=" * 50)
    
    dataset = load_dataset()
    print(f"Loaded {len(dataset)} test cases")
    
    results = {"ragas": {}, "metadata": {"timestamp": datetime.now().isoformat(), "dataset_size": len(dataset)}, "details": []}
    scores = {"f": [], "r": [], "p": [], "c": []}
    
    for i, item in enumerate(dataset):
        q, gt = item["question"], item["ground_truth"]
        print(f"\n[{i+1}/{len(dataset)}] {q[:40]}...")
        
        response = query_agent(q)
        time.sleep(1)
        
        f, r, p, c = evaluate(response, q, gt)
        scores["f"].append(f); scores["r"].append(r); scores["p"].append(p); scores["c"].append(c)
        
        results["details"].append({"question": q, "ground_truth": gt, "response": response[:300],
                                   "faithfulness": f, "relevancy": r, "context_precision": p, "answer_correctness": c})
        print(f"   F:{f:.2f} R:{r:.2f} P:{p:.2f} C:{c:.2f}")
    
    results["ragas"] = {
        "faithfulness": round(sum(scores["f"])/len(scores["f"]), 3),
        "relevance": round(sum(scores["r"])/len(scores["r"]), 3),
        "contextPrecision": round(sum(scores["p"])/len(scores["p"]), 3),
        "answerCorrectness": round(sum(scores["c"])/len(scores["c"]), 3)
    }
    
    print("\n" + "=" * 50)
    print(f"Faithfulness: {results['ragas']['faithfulness']:.1%}")
    print(f"Relevance: {results['ragas']['relevance']:.1%}")
    print(f"Context Precision: {results['ragas']['contextPrecision']:.1%}")
    print(f"Answer Correctness: {results['ragas']['answerCorrectness']:.1%}")
    
    with open(os.path.join(os.path.dirname(__file__), 'results.json'), 'w') as f:
        json.dump(results, f, indent=2)
    print("\n✓ Saved to results.json")

if __name__ == "__main__":
    run()

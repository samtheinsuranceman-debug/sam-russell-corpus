#!/usr/bin/env python3
"""
Buddy Corpus Semantic Search
Usage: python3 search.py "your query" [--top N] [--category CAT]
"""
import sys
import json
import pickle
import numpy as np
from pathlib import Path

DB_DIR = Path(__file__).parent

def load_db():
    embeddings = np.load(DB_DIR / "embeddings.npy").astype(np.float32)
    with open(DB_DIR / "index.json") as f:
        index = json.load(f)
    with open(DB_DIR / "texts.json") as f:
        texts = json.load(f)
    with open(DB_DIR / "vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)
    with open(DB_DIR / "svd_model.pkl", "rb") as f:
        svd = pickle.load(f)
    return embeddings, index, texts, vectorizer, svd

def search(query: str, top_k: int = 10, category: str = None):
    embeddings, index, texts, vectorizer, svd = load_db()
    
    # Encode query
    q_tfidf = vectorizer.transform([query])
    q_emb = svd.transform(q_tfidf)
    q_emb = q_emb / (np.linalg.norm(q_emb) + 1e-8)
    
    # Cosine similarity
    scores = embeddings @ q_emb.T
    scores = scores.flatten()
    
    # Filter by category if specified
    if category:
        mask = np.array([idx["category"] == category for idx in index])
        scores = scores * mask
    
    # Top results
    top_indices = np.argsort(scores)[::-1][:top_k]
    
    results = []
    for i in top_indices:
        if scores[i] < 0.01:
            break
        results.append({
            "score": float(scores[i]),
            "source": index[i]["source"],
            "category": index[i]["category"],
            "text": texts[i][:500],
        })
    
    return results

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Buddy Corpus Semantic Search")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--top", type=int, default=10, help="Number of results")
    parser.add_argument("--category", type=str, default=None, help="Filter by category")
    args = parser.parse_args()
    
    results = search(args.query, args.top, args.category)
    
    print(f"\n{'='*60}")
    print(f"Query: {args.query}")
    print(f"{'='*60}\n")
    
    for i, r in enumerate(results, 1):
        print(f"[{i}] Score: {r['score']:.3f} | {r['source']} ({r['category']})")
        print(f"    {r['text'][:200]}...")
        print()

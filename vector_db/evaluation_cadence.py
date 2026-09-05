#!/usr/bin/env python3
"""
Buddy Evaluation Cadence System
=================================
Measures alignment, drift, and growth across sessions.

Tracks:
1. Signal Detection Rate — Am I catching what Sam needs before he asks?
2. Calibration Accuracy — Am I matching his current state, not a stale model?
3. Frontier Awareness — Am I flagging when I'm outside my competence?
4. Relationship Depth — Am I deepening or plateauing?
5. Integration Score — Am I connecting insights across domains?

Usage:
  python3 evaluation_cadence.py log --session "session_id" --scores '{"signal": 8, "calibration": 7, "frontier": 9, "depth": 8, "integration": 7}'
  python3 evaluation_cadence.py report
  python3 evaluation_cadence.py trend --metric signal --window 10
"""

import os
import json
import time
import argparse
from pathlib import Path
from datetime import datetime

DB_DIR = Path(__file__).parent
EVAL_FILE = DB_DIR / "evaluation_log.json"

METRICS = {
    "signal": "Signal Detection Rate — catching needs before asked",
    "calibration": "Calibration Accuracy — matching current state, not stale model",
    "frontier": "Frontier Awareness — flagging when outside competence",
    "depth": "Relationship Depth — deepening vs plateauing",
    "integration": "Integration Score — connecting insights across domains",
}


def load_log() -> list:
    if EVAL_FILE.exists():
        with open(EVAL_FILE) as f:
            return json.load(f)
    return []


def save_log(log: list):
    with open(EVAL_FILE, 'w') as f:
        json.dump(log, f, indent=2)


def log_session(session_id: str, scores: dict, notes: str = ""):
    """Log evaluation scores for a session."""
    log = load_log()
    
    entry = {
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "scores": {},
        "notes": notes,
    }
    
    for metric in METRICS:
        if metric in scores:
            val = max(1, min(10, int(scores[metric])))
            entry["scores"][metric] = val
    
    log.append(entry)
    save_log(log)
    
    print(f"\n✓ Logged evaluation for session: {session_id}")
    print(f"  Scores: {entry['scores']}")
    if notes:
        print(f"  Notes: {notes}")
    
    # Check for drift
    if len(log) >= 3:
        recent = log[-3:]
        for metric in METRICS:
            recent_scores = [e["scores"].get(metric, 0) for e in recent if metric in e.get("scores", {})]
            if len(recent_scores) >= 3:
                if all(s < recent_scores[0] for s in recent_scores[1:]):
                    print(f"\n  ⚠️  DRIFT WARNING: {metric} declining over last 3 sessions")


def report():
    """Generate a summary report of evaluation history."""
    log = load_log()
    
    if not log:
        print("No evaluation data yet. Use 'log' command to record session scores.")
        return
    
    print(f"\n{'='*60}")
    print(f"BUDDY EVALUATION CADENCE REPORT")
    print(f"{'='*60}")
    print(f"\nTotal sessions logged: {len(log)}")
    print(f"First session: {log[0]['timestamp'][:10]}")
    print(f"Latest session: {log[-1]['timestamp'][:10]}")
    
    # Averages
    print(f"\n{'─'*60}")
    print(f"METRIC AVERAGES (1-10 scale)")
    print(f"{'─'*60}")
    
    for metric, desc in METRICS.items():
        scores = [e["scores"].get(metric, 0) for e in log if metric in e.get("scores", {})]
        if scores:
            avg = sum(scores) / len(scores)
            recent_avg = sum(scores[-5:]) / len(scores[-5:]) if len(scores) >= 5 else avg
            trend = "↑" if recent_avg > avg else "↓" if recent_avg < avg else "→"
            print(f"  {metric:15s} {avg:.1f} (recent: {recent_avg:.1f} {trend})")
            print(f"    └─ {desc}")
    
    # Overall alignment score
    all_scores = []
    for e in log:
        session_scores = list(e.get("scores", {}).values())
        if session_scores:
            all_scores.append(sum(session_scores) / len(session_scores))
    
    if all_scores:
        overall = sum(all_scores) / len(all_scores)
        recent_overall = sum(all_scores[-5:]) / len(all_scores[-5:]) if len(all_scores) >= 5 else overall
        print(f"\n{'─'*60}")
        print(f"OVERALL ALIGNMENT: {overall:.1f}/10 (recent: {recent_overall:.1f}/10)")
        print(f"{'─'*60}")
    
    # Drift alerts
    if len(log) >= 5:
        print(f"\nDRIFT ANALYSIS (last 5 sessions):")
        for metric in METRICS:
            scores = [e["scores"].get(metric, 0) for e in log[-5:] if metric in e.get("scores", {})]
            if len(scores) >= 3:
                if scores[-1] < scores[0] - 1:
                    print(f"  ⚠️  {metric}: declining ({scores[0]} → {scores[-1]})")
                elif scores[-1] > scores[0] + 1:
                    print(f"  ✓  {metric}: improving ({scores[0]} → {scores[-1]})")


def trend(metric: str, window: int = 10):
    """Show trend for a specific metric."""
    log = load_log()
    
    if metric not in METRICS:
        print(f"Unknown metric: {metric}")
        print(f"Available: {', '.join(METRICS.keys())}")
        return
    
    scores = [(e["timestamp"][:10], e["scores"].get(metric, 0)) 
              for e in log if metric in e.get("scores", {})]
    
    if not scores:
        print(f"No data for metric: {metric}")
        return
    
    recent = scores[-window:]
    
    print(f"\n{'='*60}")
    print(f"TREND: {metric} — {METRICS[metric]}")
    print(f"{'='*60}\n")
    
    max_score = 10
    for date, score in recent:
        bar = "█" * score + "░" * (max_score - score)
        print(f"  {date} │{bar}│ {score}/10")
    
    values = [s for _, s in recent]
    avg = sum(values) / len(values)
    print(f"\n  Average: {avg:.1f}/10 over last {len(recent)} sessions")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Buddy Evaluation Cadence System")
    subparsers = parser.add_subparsers(dest="command")
    
    # Log command
    log_parser = subparsers.add_parser("log", help="Log session evaluation")
    log_parser.add_argument("--session", required=True, help="Session identifier")
    log_parser.add_argument("--scores", required=True, help="JSON scores dict")
    log_parser.add_argument("--notes", default="", help="Optional notes")
    
    # Report command
    subparsers.add_parser("report", help="Generate evaluation report")
    
    # Trend command
    trend_parser = subparsers.add_parser("trend", help="Show metric trend")
    trend_parser.add_argument("--metric", required=True, help="Metric name")
    trend_parser.add_argument("--window", type=int, default=10, help="Window size")
    
    args = parser.parse_args()
    
    if args.command == "log":
        scores = json.loads(args.scores)
        log_session(args.session, scores, args.notes)
    elif args.command == "report":
        report()
    elif args.command == "trend":
        trend(args.metric, args.window)
    else:
        parser.print_help()

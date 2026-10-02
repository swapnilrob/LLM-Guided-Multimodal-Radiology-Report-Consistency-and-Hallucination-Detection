"""
Compare pipeline results against ground truth.
Outputs precision, recall, F1 and a confusion matrix.
"""

import pandas as pd
import json
from pathlib import Path

SUBSET_DIR = Path("data/subset")
GT_FILE = SUBSET_DIR / "ground_truth.csv"
RESULTS_FILE = SUBSET_DIR / "pipeline_results.json"

# ── Load data ───────────────────────────────────────────────────────

gt = pd.read_csv(GT_FILE)

with open(RESULTS_FILE) as f:
    results = json.load(f)

print(f"Ground truth: {len(gt)} samples")
print(f"Pipeline results: {len(results)} samples")

completed = {k: v for k, v in results.items() if v.get("status") == "complete"}
failed = {k: v for k, v in results.items() if v.get("status") != "complete"}
print(f"Completed: {len(completed)}, Failed: {len(failed)}")

if failed:
    print(f"\nFailed samples: {list(failed.keys())[:10]}...")

# ── Report-level hallucination detection ────────────────────────────

print("\n" + "=" * 60)
print("REPORT-LEVEL HALLUCINATION DETECTION")
print("=" * 60)
print("Question: Can the system tell corrupted reports from clean ones?")
print()

tp = 0  # corrupted report, pipeline flagged hallucination     (correct catch)
fp = 0  # clean report, pipeline flagged hallucination          (false alarm)
tn = 0  # clean report, pipeline flagged nothing                (correct pass)
fn = 0  # corrupted report, pipeline flagged nothing            (missed)

details = []

for _, row in gt.iterrows():
    sid = row["sample_id"]
    if sid not in completed:
        continue
    
    r = completed[sid]
    is_corrupted = row["is_corrupted"]
    corruption_type = row["corruption_type"]
    
    # Did the pipeline flag any hallucination?
    has_hallucination = r["num_hallucinated"] > 0
    # Did it find consistency violations?
    has_violation = r["num_violations"] > 0
    
    # For contradiction-type corruptions, count a violation as a detection too
    if corruption_type == "contradiction":
        pipeline_flagged = has_hallucination or has_violation
    else:
        pipeline_flagged = has_hallucination
    
    if is_corrupted and pipeline_flagged:
        tp += 1
        outcome = "TP"
    elif is_corrupted and not pipeline_flagged:
        fn += 1
        outcome = "FN"
    elif not is_corrupted and pipeline_flagged:
        fp += 1
        outcome = "FP"
    else:
        tn += 1
        outcome = "TN"
    
    details.append({
        "sample_id": sid,
        "is_corrupted": is_corrupted,
        "corruption_type": corruption_type,
        "pipeline_flagged": pipeline_flagged,
        "num_hallucinated": r["num_hallucinated"],
        "num_violations": r["num_violations"],
        "reliability_score": r["reliability_score"],
        "outcome": outcome,
    })

# Compute metrics
precision = tp / (tp + fp) if (tp + fp) > 0 else 0
recall = tp / (tp + fn) if (tp + fn) > 0 else 0
f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
accuracy = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0

print("Confusion Matrix:")
print(f"                    Pipeline says     Pipeline says")
print(f"                    HALLUCINATED      CLEAN")
print(f"  Actually corrupt    TP = {tp:<6}       FN = {fn}")
print(f"  Actually clean      FP = {fp:<6}       TN = {tn}")
print()
print(f"  Precision:  {precision:.4f}  ({tp}/{tp+fp})")
print(f"  Recall:     {recall:.4f}  ({tp}/{tp+fn})")
print(f"  F1 Score:   {f1:.4f}")
print(f"  Accuracy:   {accuracy:.4f}")

# ── Breakdown by corruption type ────────────────────────────────────

print("\n" + "=" * 60)
print("DETECTION RATE BY CORRUPTION TYPE")
print("=" * 60)

df = pd.DataFrame(details)
corrupted_df = df[df["is_corrupted"] == True]

for ctype in ["negation", "anatomy_swap", "fabrication", "contradiction"]:
    subset = corrupted_df[corrupted_df["corruption_type"] == ctype]
    if len(subset) == 0:
        continue
    detected = len(subset[subset["outcome"] == "TP"])
    total = len(subset)
    rate = detected / total if total > 0 else 0
    print(f"  {ctype:<20} {detected}/{total} detected  ({rate:.0%})")

# ── Clean report false alarm rate ───────────────────────────────────

print("\n" + "=" * 60)
print("FALSE ALARM RATE ON CLEAN REPORTS")
print("=" * 60)

clean_df = df[df["is_corrupted"] == False]
false_alarms = len(clean_df[clean_df["outcome"] == "FP"])
total_clean = len(clean_df)
print(f"  {false_alarms}/{total_clean} clean reports falsely flagged ({false_alarms/total_clean:.0%})")

# ── Reliability score comparison ────────────────────────────────────

print("\n" + "=" * 60)
print("RELIABILITY SCORE COMPARISON")
print("=" * 60)

corrupted_scores = df[df["is_corrupted"] == True]["reliability_score"].dropna()
clean_scores = df[df["is_corrupted"] == False]["reliability_score"].dropna()

if len(corrupted_scores) > 0 and len(clean_scores) > 0:
    print(f"  Corrupted reports — avg score: {corrupted_scores.mean():.1f}, "
          f"median: {corrupted_scores.median():.1f}")
    print(f"  Clean reports     — avg score: {clean_scores.mean():.1f}, "
          f"median: {clean_scores.median():.1f}")
    print(f"  Score gap: {clean_scores.mean() - corrupted_scores.mean():.1f} points")

# ── Save detailed results ──────────────────────────────────────────

df.to_csv(SUBSET_DIR / "evaluation_results.csv", index=False)
print(f"\nDetailed results saved to {SUBSET_DIR / 'evaluation_results.csv'}")

# ── Summary for thesis ──────────────────────────────────────────────

print("\n" + "=" * 60)
print("COPY THESE NUMBERS INTO YOUR THESIS")
print("=" * 60)
print(f"  Dataset: IU-Xray (Indiana University Chest X-ray)")
print(f"  Test set size: {len(df)} reports ({len(corrupted_df)} corrupted, {len(clean_df)} clean)")
print(f"  Model: google/gemma-4-31b-it via OpenRouter")
print(f"  Report-level Precision: {precision:.4f}")
print(f"  Report-level Recall:    {recall:.4f}")
print(f"  Report-level F1:        {f1:.4f}")
print(f"  Report-level Accuracy:  {accuracy:.4f}")
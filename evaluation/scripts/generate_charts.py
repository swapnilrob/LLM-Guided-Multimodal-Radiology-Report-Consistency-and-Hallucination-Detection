"""
Generate thesis charts from evaluation results.
Run from: evaluation/ directory
Output: evaluation/charts/ folder
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')

from pathlib import Path

SUBSET_DIR = Path("data/subset")
CHARTS_DIR = Path("charts")
CHARTS_DIR.mkdir(exist_ok=True)

# Load data
df = pd.read_csv(SUBSET_DIR / "evaluation_results.csv")

# ── 1. Confusion Matrix Heatmap ──────────────────────────────────────

fig, ax = plt.subplots(figsize=(6, 5))

tp = len(df[(df["is_corrupted"] == True) & (df["outcome"] == "TP")])
fn = len(df[(df["is_corrupted"] == True) & (df["outcome"] == "FN")])
fp = len(df[(df["is_corrupted"] == False) & (df["outcome"] == "FP")])
tn = len(df[(df["is_corrupted"] == False) & (df["outcome"] == "TN")])

cm = np.array([[tp, fn], [fp, tn]])
im = ax.imshow(cm, cmap="Blues", aspect="auto")

ax.set_xticks([0, 1])
ax.set_yticks([0, 1])
ax.set_xticklabels(["Flagged\n(Predicted Positive)", "Not Flagged\n(Predicted Negative)"], fontsize=11)
ax.set_yticklabels(["Corrupted\n(Actual Positive)", "Clean\n(Actual Negative)"], fontsize=11)
ax.set_xlabel("Pipeline Prediction", fontsize=12, fontweight="bold", labelpad=10)
ax.set_ylabel("Ground Truth", fontsize=12, fontweight="bold", labelpad=10)
ax.set_title("Confusion Matrix — Report-Level Hallucination Detection", fontsize=13, fontweight="bold", pad=15)

labels = [["TP", "FN"], ["FP", "TN"]]
for i in range(2):
    for j in range(2):
        val = cm[i, j]
        color = "white" if val > cm.max() * 0.5 else "black"
        ax.text(j, i, f"{labels[i][j]}\n{val}", ha="center", va="center",
                fontsize=16, fontweight="bold", color=color)

plt.colorbar(im, ax=ax, shrink=0.8)
plt.tight_layout()
plt.savefig(CHARTS_DIR / "confusion_matrix.png", dpi=300, bbox_inches="tight")
plt.close()
print("1/4 — Confusion matrix saved")

# ── 2. Detection Rate by Corruption Type ─────────────────────────────

fig, ax = plt.subplots(figsize=(8, 5))

corrupted_df = df[df["is_corrupted"] == True]
types = ["fabrication", "negation", "contradiction", "anatomy_swap"]
type_labels = ["Fabrication", "Negation", "Contradiction", "Anatomy Swap"]
detected = []
totals = []
rates = []

for ctype in types:
    subset = corrupted_df[corrupted_df["corruption_type"] == ctype]
    d = len(subset[subset["outcome"] == "TP"])
    t = len(subset)
    detected.append(d)
    totals.append(t)
    rates.append(d / t * 100 if t > 0 else 0)

colors = ["#388E3C", "#00838F", "#D32F2F", "#EF6C00"]
bars = ax.bar(type_labels, rates, color=colors, edgecolor="white", linewidth=1.5, width=0.6)

for bar, d, t, r in zip(bars, detected, totals, rates):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 2,
            f"{d}/{t}\n({r:.0f}%)", ha="center", va="bottom", fontsize=11, fontweight="bold")

ax.set_ylim(0, 115)
ax.set_ylabel("Detection Rate (%)", fontsize=12, fontweight="bold")
ax.set_title("Hallucination Detection Rate by Corruption Type", fontsize=13, fontweight="bold", pad=15)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.axhline(y=50, color="gray", linestyle="--", alpha=0.4, linewidth=0.8)

plt.tight_layout()
plt.savefig(CHARTS_DIR / "detection_by_type.png", dpi=300, bbox_inches="tight")
plt.close()
print("2/4 — Detection by type saved")

# ── 3. Reliability Score Distribution ─────────────────────────────────

fig, ax = plt.subplots(figsize=(8, 5))

clean_scores = df[df["is_corrupted"] == False]["reliability_score"].dropna()
corrupted_scores = df[df["is_corrupted"] == True]["reliability_score"].dropna()

bins = np.arange(0, 110, 10)
ax.hist(clean_scores, bins=bins, alpha=0.7, color="#388E3C", label=f"Clean (n={len(clean_scores)}, avg={clean_scores.mean():.1f})", edgecolor="white")
ax.hist(corrupted_scores, bins=bins, alpha=0.7, color="#D32F2F", label=f"Corrupted (n={len(corrupted_scores)}, avg={corrupted_scores.mean():.1f})", edgecolor="white")

ax.axvline(clean_scores.mean(), color="#388E3C", linestyle="--", linewidth=2, alpha=0.8)
ax.axvline(corrupted_scores.mean(), color="#D32F2F", linestyle="--", linewidth=2, alpha=0.8)

ax.set_xlabel("Reliability Score", fontsize=12, fontweight="bold")
ax.set_ylabel("Number of Reports", fontsize=12, fontweight="bold")
ax.set_title("Reliability Score Distribution — Clean vs Corrupted Reports", fontsize=13, fontweight="bold", pad=15)
ax.legend(fontsize=10, loc="upper left")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

plt.tight_layout()
plt.savefig(CHARTS_DIR / "reliability_distribution.png", dpi=300, bbox_inches="tight")
plt.close()
print("3/4 — Reliability distribution saved")

# ── 4. Overall Metrics Bar Chart ──────────────────────────────────────

fig, ax = plt.subplots(figsize=(7, 5))

precision = tp / (tp + fp) if (tp + fp) > 0 else 0
recall = tp / (tp + fn) if (tp + fn) > 0 else 0
f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
accuracy = (tp + tn) / (tp + tn + fp + fn)

metrics = ["Precision", "Recall", "F1 Score", "Accuracy"]
values = [precision * 100, recall * 100, f1 * 100, accuracy * 100]
colors = ["#004D40", "#00695C", "#00838F", "#00ACC1"]

bars = ax.bar(metrics, values, color=colors, edgecolor="white", linewidth=1.5, width=0.55)

for bar, v in zip(bars, values):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1.5,
            f"{v:.1f}%", ha="center", va="bottom", fontsize=13, fontweight="bold")

ax.set_ylim(0, 105)
ax.set_ylabel("Score (%)", fontsize=12, fontweight="bold")
ax.set_title("Report-Level Hallucination Detection — Overall Metrics", fontsize=13, fontweight="bold", pad=15)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

plt.tight_layout()
plt.savefig(CHARTS_DIR / "overall_metrics.png", dpi=300, bbox_inches="tight")
plt.close()
print("4/4 — Overall metrics saved")

print(f"\nAll charts saved to: {CHARTS_DIR.resolve()}")
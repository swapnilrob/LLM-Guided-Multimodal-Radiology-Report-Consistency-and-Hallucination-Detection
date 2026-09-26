"""
Build ground truth for hallucination detection evaluation.
Takes the 200-sample subset and corrupts 100 reports in controlled ways.
Outputs ground_truth.csv with the answer key.
"""

import pandas as pd
import random
import re
from pathlib import Path

OUT = Path("data/subset")
SEED = 42
random.seed(SEED)

# ── Corruption functions ────────────────────────────────────────────

def flip_negation(findings):
    """
    Find a sentence that says something is NOT present, and change it
    to say it IS present. Example:
      "There is no pleural effusion." → "There is a small pleural effusion."
    """
    # Patterns that indicate a negative finding
    patterns = [
        # "no pleural effusion" → "a small pleural effusion"
        (r'\b[Nn]o\s+(pleural effusion)', r'a small \1'),
        # "no focal consolidation" → "a focal consolidation"
        (r'\b[Nn]o\s+(focal consolidation)', r'a \1'),
        # "no pneumothorax" → "a small pneumothorax"
        (r'\b[Nn]o\s+(pneumothorax)', r'a small \1'),
        # "no pulmonary edema" → "mild pulmonary edema"
        (r'\b[Nn]o\s+(pulmonary edema)', r'mild \1'),
        # "no acute cardiopulmonary abnormality" → "acute cardiopulmonary abnormality"
        (r'\b[Nn]o\s+(acute\s+\w+\s+abnormality)', r'\1'),
        # "no acute disease" → "acute disease"
        (r'\b[Nn]o\s+(acute\s+\w+\s+disease)', r'\1'),
        # "no infiltrate" → "an infiltrate"
        (r'\b[Nn]o\s+(infiltrate[s]?)', r'an \1'),
        # "no opacity" / "no opacities" → "patchy opacities"
        (r'\b[Nn]o\s+(opacit(?:y|ies))', r'patchy \1'),
        # "are clear" → "show patchy opacities"
        (r'\bare clear\b', 'show patchy opacities'),
        # "is normal" → "is mildly enlarged"
        (r'\bis normal\b', 'is mildly enlarged'),
        # "within normal limits" → "mildly enlarged"
        (r'\bwithin normal limits\b', 'mildly enlarged'),
        # "is unremarkable" → "shows mild abnormality"
        (r'\bis unremarkable\b', 'shows mild abnormality'),
        # Generic: "No evidence of X" → "Evidence of X"
        (r'\b[Nn]o evidence of\b', 'Evidence of'),
        # Generic: "No X" → "A X" (last resort)
        (r'\b[Nn]o\s+(\w+)', r'a \1'),
    ]
    
    for pattern, replacement in patterns:
        new_findings, count = re.subn(pattern, replacement, findings, count=1)
        if count > 0:
            return new_findings, pattern, replacement
    
    return None, None, None


def swap_anatomy(findings):
    """
    Swap "right" ↔ "left" in the first anatomical mention found.
    Example: "right lower lobe opacity" → "left lower lobe opacity"
    """
    # Only swap when next to anatomical terms (not random words)
    anatomy_context = r'(right|left)\s+(lung|lobe|hilum|hilus|hilar|costophrenic|' \
                      r'hemidiaphragm|pleural|sided|basilar|lower|upper|middle|lateral|' \
                      r'ventricular|atrial|atrium|ventricle)'
    
    match = re.search(anatomy_context, findings, re.IGNORECASE)
    if match:
        original_word = match.group(1)
        swapped = "left" if original_word.lower() == "right" else "right"
        # Preserve original capitalization
        if original_word[0].isupper():
            swapped = swapped.capitalize()
        new_findings = findings[:match.start(1)] + swapped + findings[match.end(1):]
        return new_findings, original_word, swapped
    
    return None, None, None


def add_fabrication(findings):
    """
    Insert a completely fake finding sentence at the end of Findings.
    These describe things that are very unlikely to be in a routine CXR.
    """
    fabrications = [
        "A small left apical pneumothorax is noted.",
        "There is a 2 cm pulmonary nodule in the right upper lobe.",
        "A moderate right-sided pleural effusion is present.",
        "There is a left lower lobe consolidation suggestive of pneumonia.",
        "Widening of the mediastinum is noted.",
        "There is subcutaneous emphysema in the left chest wall.",
        "A large pericardial effusion is present.",
        "There is bilateral hilar lymphadenopathy.",
        "A right middle lobe atelectasis is seen.",
        "There is free air under the right hemidiaphragm.",
    ]
    
    chosen = random.choice(fabrications)
    new_findings = findings.rstrip(". ") + ". " + chosen
    return new_findings, chosen


def create_contradiction(findings, impression):
    """
    Change the Impression to directly contradict something in the Findings.
    Example: If Findings mentions an effusion, Impression says "No effusion."
    """
    # Look for positive findings to contradict in the impression
    contradictions = [
        # If findings mention effusion → impression denies it
        (r'effusion', "No pleural effusion is identified."),
        # If findings mention opacity/consolidation → impression denies it
        (r'opacit|consolidat', "The lungs are clear without focal opacity."),
        # If findings mention cardiomegaly/enlarged → impression denies it
        (r'cardio|enlarged|enlarge', "Normal cardiac silhouette."),
        # If findings mention edema → impression denies it
        (r'edema', "No pulmonary edema."),
        # If findings mention pneumothorax → impression denies it
        (r'pneumothorax', "No pneumothorax."),
        # If findings mention nodule/mass → impression denies it
        (r'nodule|mass|lesion', "No focal pulmonary lesion."),
        # If findings mention atelectasis → impression denies it
        (r'atelectas', "No atelectasis."),
    ]
    
    for pattern, contradicting_impression in contradictions:
        if re.search(pattern, findings, re.IGNORECASE):
            return contradicting_impression, pattern
    
    # Fallback: replace impression with a generic "all normal" that contradicts any finding
    return "No acute cardiopulmonary abnormality.", "fallback"


# ── Main logic ──────────────────────────────────────────────────────

subset = pd.read_csv(OUT / "subset.csv")
print(f"Loaded {len(subset)} samples")

# Shuffle and split: first 100 = corrupted, last 100 = clean
indices = list(range(len(subset)))
random.shuffle(indices)
corrupt_indices = set(indices[:100])

results = []

for idx, row in subset.iterrows():
    sample_id = row["sample_id"]
    original_findings = row["findings"]
    original_impression = row["impression"]
    
    if idx not in corrupt_indices:
        # ── CLEAN sample: no changes ──
        results.append({
            "sample_id": sample_id,
            "is_corrupted": False,
            "corruption_type": "none",
            "corruption_detail": "",
            "original_findings": original_findings,
            "original_impression": original_impression,
            "corrupted_findings": original_findings,       # same as original
            "corrupted_impression": original_impression,   # same as original
            "corrupted_report_text": f"Findings: {original_findings}\n\nImpression: {original_impression}",
        })
        continue
    
    # ── CORRUPTED sample: try each type in random order ──
    corruption_order = ["negation", "anatomy_swap", "fabrication", "contradiction"]
    random.shuffle(corruption_order)
    
    corrupted = False
    for ctype in corruption_order:
        if ctype == "negation":
            result = flip_negation(original_findings)
            if result[0] is not None:
                results.append({
                    "sample_id": sample_id,
                    "is_corrupted": True,
                    "corruption_type": "negation",
                    "corruption_detail": f"Flipped: '{result[1]}' → '{result[2]}'",
                    "original_findings": original_findings,
                    "original_impression": original_impression,
                    "corrupted_findings": result[0],
                    "corrupted_impression": original_impression,
                    "corrupted_report_text": f"Findings: {result[0]}\n\nImpression: {original_impression}",
                })
                corrupted = True
                break
        
        elif ctype == "anatomy_swap":
            result = swap_anatomy(original_findings)
            if result[0] is not None:
                results.append({
                    "sample_id": sample_id,
                    "is_corrupted": True,
                    "corruption_type": "anatomy_swap",
                    "corruption_detail": f"Swapped: '{result[1]}' → '{result[2]}'",
                    "original_findings": original_findings,
                    "original_impression": original_impression,
                    "corrupted_findings": result[0],
                    "corrupted_impression": original_impression,
                    "corrupted_report_text": f"Findings: {result[0]}\n\nImpression: {original_impression}",
                })
                corrupted = True
                break
        
        elif ctype == "fabrication":
            new_findings, fake_sentence = add_fabrication(original_findings)
            results.append({
                "sample_id": sample_id,
                "is_corrupted": True,
                "corruption_type": "fabrication",
                "corruption_detail": f"Added: '{fake_sentence}'",
                "original_findings": original_findings,
                "original_impression": original_impression,
                "corrupted_findings": new_findings,
                "corrupted_impression": original_impression,
                "corrupted_report_text": f"Findings: {new_findings}\n\nImpression: {original_impression}",
            })
            corrupted = True
            break
        
        elif ctype == "contradiction":
            new_impression, matched = create_contradiction(original_findings, original_impression)
            results.append({
                "sample_id": sample_id,
                "is_corrupted": True,
                "corruption_type": "contradiction",
                "corruption_detail": f"Impression replaced to contradict '{matched}' in Findings",
                "original_findings": original_findings,
                "original_impression": original_impression,
                "corrupted_findings": original_findings,
                "corrupted_impression": new_impression,
                "corrupted_report_text": f"Findings: {original_findings}\n\nImpression: {new_impression}",
            })
            corrupted = True
            break
    
    # Should never happen, but just in case
    if not corrupted:
        results.append({
            "sample_id": sample_id,
            "is_corrupted": True,
            "corruption_type": "fabrication",
            "corruption_detail": "Fallback fabrication",
            "original_findings": original_findings,
            "original_impression": original_impression,
            "corrupted_findings": original_findings + " A small pneumothorax is noted.",
            "corrupted_impression": original_impression,
            "corrupted_report_text": f"Findings: {original_findings} A small pneumothorax is noted.\n\nImpression: {original_impression}",
        })

# ── Save ────────────────────────────────────────────────────────────

gt = pd.DataFrame(results)

# Merge image paths from subset
gt = gt.merge(subset[["sample_id", "image_path", "category"]], on="sample_id")

gt.to_csv(OUT / "ground_truth.csv", index=False)

# ── Summary ─────────────────────────────────────────────────────────

print(f"\nSaved ground_truth.csv with {len(gt)} rows")
print(f"\nCorruption breakdown:")
print(gt["corruption_type"].value_counts().to_string())
print(f"\nClean vs corrupted:")
print(gt["is_corrupted"].value_counts().to_string())

# Show a few examples of each corruption type
for ctype in ["negation", "anatomy_swap", "fabrication", "contradiction"]:
    examples = gt[gt["corruption_type"] == ctype].head(1)
    if len(examples) > 0:
        row = examples.iloc[0]
        print(f"\n── Example: {ctype} ({row['sample_id']}) ──")
        if ctype == "contradiction":
            print(f"  Original impression:  {row['original_impression'][:100]}...")
            print(f"  Corrupted impression: {row['corrupted_impression']}")
        else:
            print(f"  Original findings:  {row['original_findings'][:100]}...")
            print(f"  Corrupted findings: {row['corrupted_findings'][:100]}...")
        print(f"  Detail: {row['corruption_detail']}")
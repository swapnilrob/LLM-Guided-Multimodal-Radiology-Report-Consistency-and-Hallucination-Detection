import pandas as pd
from pathlib import Path

RAW = Path("data/raw")
OUT = Path("data/subset")
SEED = 42
N_PER_GROUP = 100

reports = pd.read_csv(RAW / "indiana_reports.csv")
proj = pd.read_csv(RAW / "indiana_projections.csv")
print("Starting reports:", len(reports))

# 1. Need both Findings and Impression
for col in ["findings", "impression"]:
    reports[col] = reports[col].fillna("").astype(str).str.strip()
reports = reports[(reports["findings"] != "") & (reports["impression"] != "")]
print("After requiring Findings + Impression:", len(reports))

# 2. Remove de-identification placeholders (like the XXXX you saw)
has_x = reports["findings"].str.contains("XXXX") | reports["impression"].str.contains("XXXX")
reports = reports[~has_x]
print("After removing XXXX placeholders:", len(reports))

# 3. Findings must be at least 5 words (too short = useless for claim extraction)
reports = reports[reports["findings"].str.split().str.len() >= 5]
print("After removing very short reports:", len(reports))

# 4. Attach one frontal image per report
frontal = proj[proj["projection"] == "Frontal"].drop_duplicates(subset="uid", keep="first")
df = reports.merge(frontal[["uid", "filename"]], on="uid", how="inner")
print("After requiring a frontal image:", len(df))

# 5. Confirm the image file actually exists on disk
image_index = {p.name: p for p in RAW.rglob("*.png")}
df = df[df["filename"].isin(image_index)]
df["source_path"] = df["filename"].map(lambda f: str(image_index[f]))
print("After confirming image files exist:", len(df))

# 6. Label normal vs abnormal
df["category"] = df["Problems"].fillna("").str.strip().str.lower().apply(
    lambda p: "normal" if p == "normal" else "abnormal"
)
print("\nAvailable pool:")
print(df["category"].value_counts())

# 7. Balanced random sample
normal = df[df["category"] == "normal"].sample(n=N_PER_GROUP, random_state=SEED)
abnormal = df[df["category"] == "abnormal"].sample(n=N_PER_GROUP, random_state=SEED)
subset = pd.concat([normal, abnormal]).sample(frac=1, random_state=SEED).reset_index(drop=True)

# 8. Clean IDs: IU-0001 through IU-0200
subset["sample_id"] = [f"IU-{i:04d}" for i in range(1, len(subset) + 1)]

# 9. Build the report text in the format your pipeline expects
subset["report_text"] = (
    "Findings: " + subset["findings"] + "\n\nImpression: " + subset["impression"]
)

cols = ["sample_id", "uid", "category", "Problems", "findings",
        "impression", "report_text", "filename", "source_path"]
subset[cols].to_csv(OUT / "subset.csv", index=False)
print(f"\nSaved {len(subset)} samples to {OUT / 'subset.csv'}")
print(subset["category"].value_counts())
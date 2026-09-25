import pandas as pd
from pathlib import Path

RAW = Path("data/raw")

# Load the two CSV files
reports = pd.read_csv(RAW / "indiana_reports.csv")
proj = pd.read_csv(RAW / "indiana_projections.csv")

# Show report table info
print("=== REPORTS TABLE ===")
print("Total reports:", len(reports))
print("Column names:", reports.columns.tolist())
print()
print("Missing values per column:")
print(reports.isna().sum())

print()

# Show projections table info
print("=== PROJECTIONS TABLE ===")
print("Total rows:", len(proj))
print("Column names:", proj.columns.tolist())
print()
print("Image views:")
print(proj["projection"].value_counts())

print()

# Show one example report so you can see what the text looks like
print("=== EXAMPLE REPORT ===")
example = reports.dropna(subset=["findings", "impression"]).iloc[0]
print("UID:", example["uid"])
print()
print("FINDINGS:", example["findings"])
print()
print("IMPRESSION:", example["impression"])
print()
print("PROBLEMS:", example["Problems"])

print()

# Count images on disk
images = list(RAW.rglob("*.png"))
print("=== IMAGES ON DISK ===")
print("Total PNG files found:", len(images))
if images:
    print("Example file:", images[0])
    
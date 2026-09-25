import pandas as pd
from pathlib import Path
from PIL import Image
from tqdm import tqdm

OUT = Path("data/subset")
IMG_DIR = OUT / "images"
MAX_SIDE = 1024

subset = pd.read_csv(OUT / "subset.csv")
sizes = []

for _, row in tqdm(subset.iterrows(), total=len(subset)):
    img = Image.open(row["source_path"]).convert("L")
    img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    out_path = IMG_DIR / f"{row['sample_id']}.png"
    img.save(out_path, optimize=True)
    sizes.append((img.width, img.height, out_path.stat().st_size))

subset["image_path"] = [str(IMG_DIR / f"{sid}.png") for sid in subset["sample_id"]]
subset.to_csv(OUT / "subset.csv", index=False)

w = [s[0] for s in sizes]
h = [s[1] for s in sizes]
b = [s[2] for s in sizes]
print(f"\nDone. {len(sizes)} images saved to {IMG_DIR}")
print(f"Width  range: {min(w)}-{max(w)} px")
print(f"Height range: {min(h)}-{max(h)} px")
print(f"Average file size: {sum(b)/len(b)/1024:.0f} KB")
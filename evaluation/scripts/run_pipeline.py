"""
Send all 200 samples through the backend API and save raw results.
Saves after every sample so progress is never lost.
Can resume from where it stopped if interrupted.
"""

import pandas as pd
import requests
import json
import time
import sys
from pathlib import Path
from datetime import datetime

# ── Configuration ───────────────────────────────────────────────────

API_BASE = "http://localhost:5000/api"
AI_SERVICE = "http://localhost:8000"

# Your login credentials (the account you test with)
EMAIL = "swapnilrob.32@gmail.com"
PASSWORD = "swapnilrob"

# Timing
DELAY_BETWEEN_SAMPLES = 5          # seconds between submissions
POLL_INTERVAL = 10                 # seconds between status checks
MAX_POLL_ATTEMPTS = 150            # give up after 150 × 10s = 30 minutes per sample

# Files
SUBSET_DIR = Path("data/subset")
GT_FILE = SUBSET_DIR / "ground_truth.csv"
RESULTS_FILE = SUBSET_DIR / "pipeline_results.json"

# ── Helper functions ────────────────────────────────────────────────

class TokenManager:
    """Manages JWT token with automatic refresh on 401."""
    def __init__(self, email, password):
        self.email = email
        self.password = password
        self.token = None
        self.login()

    def login(self):
        """Log in and store the access token."""
        print("Logging in...")
        resp = requests.post(f"{API_BASE}/auth/login", json={
            "email": self.email,
            "password": self.password
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code}")
            print(resp.text)
            sys.exit(1)

        data = resp.json()
        token = data.get("accessToken") or data.get("token") or data.get("access_token")
        if not token:
            print(f"Login succeeded but no token found. Keys: {list(data.keys())}")
            sys.exit(1)

        self.token = token
        print("Login successful")

    def get_headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    def refresh(self):
        """Force a token refresh."""
        print("  Refreshing token...")
        self.login()


def submit_analysis(token_mgr, image_path, report_text):
    """Submit an image + report. Auto-retries once on 401."""
    for attempt in range(2):
        with open(image_path, "rb") as img_file:
            files = {"image": (Path(image_path).name, img_file, "image/png")}
            data = {"reportText": report_text}
            resp = requests.post(
                f"{API_BASE}/analyses",
                headers=token_mgr.get_headers(),
                files=files,
                data=data
            )

        if resp.status_code == 401 and attempt == 0:
            token_mgr.refresh()
            continue

        if resp.status_code not in [200, 201]:
            return None, f"Submit failed: {resp.status_code} — {resp.text[:200]}"

        result = resp.json()
        analysis_id = result.get("analysisId") or result.get("_id") or result.get("id")
        if not analysis_id:
            if "analysis" in result:
                analysis_id = result["analysis"].get("_id") or result["analysis"].get("id")

        if not analysis_id:
            return None, f"No analysis ID in response. Keys: {list(result.keys())}"

        return str(analysis_id), None

    return None, "Submit failed after token refresh"


def poll_until_done(token_mgr, analysis_id):
    """Poll the analysis endpoint until status is 'complete' or 'failed'."""
    url = f"{API_BASE}/analyses/{analysis_id}"

    for attempt in range(MAX_POLL_ATTEMPTS):
        resp = requests.get(url, headers=token_mgr.get_headers())

        if resp.status_code == 401:
            token_mgr.refresh()
            resp = requests.get(url, headers=token_mgr.get_headers())
            if resp.status_code != 200:
                return None, f"Poll failed after refresh: {resp.status_code}"

        if resp.status_code != 200:
            return None, f"Poll failed: {resp.status_code}"

        data = resp.json()
        analysis = data.get("analysis", data)
        status = analysis.get("status", "unknown")

        if status in ("complete", "completed"):
            return analysis, None
        elif status == "failed":
            error_msg = analysis.get("errorMessage", analysis.get("error", "Unknown error"))
            return None, f"Pipeline failed: {error_msg}"

        if attempt % 6 == 0:
            print(f"    ...still processing (status: {status}, {attempt * POLL_INTERVAL}s elapsed)")
        time.sleep(POLL_INTERVAL)

    return None, f"Timed out after {MAX_POLL_ATTEMPTS * POLL_INTERVAL}s"


def extract_verdicts(analysis):
    """Pull the relevant fields from a completed analysis."""
    claims = analysis.get("claims", [])

    claim_data = []
    for c in claims:
        claim_data.append({
            "claim_text": c.get("text", c.get("claimText", "")),
            "verdict": c.get("verdict", "unknown"),
            "risk_score": c.get("riskScore", c.get("risk_score", None)),
            "explanation": c.get("explanation", ""),
            "region": c.get("anatomicalRegion", c.get("region", "")),
        })

    consistency = analysis.get("consistencyViolations",
                    analysis.get("consistency_violations",
                    analysis.get("violations", [])))

    return {
        "claims": claim_data,
        "num_claims": len(claim_data),
        "num_hallucinated": sum(1 for c in claim_data if c["verdict"].lower() == "hallucinated"),
        "num_uncertain": sum(1 for c in claim_data if c["verdict"].lower() == "uncertain"),
        "num_supported": sum(1 for c in claim_data if c["verdict"].lower() in ["supported", "verified"]),
        "consistency_violations": consistency,
        "num_violations": len(consistency) if isinstance(consistency, list) else 0,
        "reliability_score": analysis.get("reliabilityScore",
                              analysis.get("reliability_score", None)),
    }


# ── Load / save progress ──────────────────────────────────────────

def load_progress():
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE) as f:
            return json.load(f)
    return {}

def save_progress(results):
    with open(RESULTS_FILE, "w") as f:
        json.dump(results, f, indent=2)


# ── Main ────────────────────────────────────────────────────────────

def main():
    gt = pd.read_csv(GT_FILE)
    print(f"Loaded {len(gt)} samples from ground_truth.csv")

    # Check services are up
    try:
        requests.get(f"{API_BASE}/health", timeout=5)
    except:
        print(f"ERROR: Backend not reachable at {API_BASE}")
        sys.exit(1)

    try:
        requests.get(f"{AI_SERVICE}/health", timeout=5)
    except:
        print(f"ERROR: AI service not reachable at {AI_SERVICE}")
        sys.exit(1)

    print("Both services are running ✓")

    # Token manager handles auto-refresh
    token_mgr = TokenManager(EMAIL, PASSWORD)

    # Load any existing progress
    results = load_progress()
    already_done = len(results)
    if already_done > 0:
        print(f"Resuming: {already_done} samples already completed")

    start_time = datetime.now()
    total = len(gt)

    for i, row in gt.iterrows():
        sample_id = row["sample_id"]

        if sample_id in results:
            continue

        progress = len(results) + 1
        print(f"\n[{progress}/{total}] {sample_id} "
              f"(corrupted={row['is_corrupted']}, type={row['corruption_type']})")

        # Submit
        analysis_id, error = submit_analysis(
            token_mgr,
            row["image_path"],
            row["corrupted_report_text"]
        )

        if error:
            print(f"  ERROR submitting: {error}")
            results[sample_id] = {"error": error, "status": "submit_failed"}
            save_progress(results)
            time.sleep(DELAY_BETWEEN_SAMPLES)
            continue

        print(f"  Submitted → analysis ID: {analysis_id}")

        # Poll until done
        analysis, error = poll_until_done(token_mgr, analysis_id)

        if error:
            print(f"  ERROR: {error}")
            results[sample_id] = {"error": error, "status": "poll_failed",
                                  "analysis_id": analysis_id}
            save_progress(results)
            time.sleep(DELAY_BETWEEN_SAMPLES)
            continue

        # Extract verdicts
        verdicts = extract_verdicts(analysis)
        verdicts["status"] = "complete"
        verdicts["analysis_id"] = analysis_id
        results[sample_id] = verdicts
        save_progress(results)

        print(f"  ✓ Done — {verdicts['num_claims']} claims, "
              f"{verdicts['num_hallucinated']} hallucinated, "
              f"{verdicts['num_violations']} violations, "
              f"reliability={verdicts['reliability_score']}")

        time.sleep(DELAY_BETWEEN_SAMPLES)

    # Summary
    elapsed = datetime.now() - start_time
    completed = sum(1 for r in results.values() if r.get("status") == "complete")
    failed = sum(1 for r in results.values() if r.get("status") != "complete")

    print(f"\n{'='*60}")
    print(f"FINISHED")
    print(f"Total time: {elapsed}")
    print(f"Completed: {completed}/{total}")
    print(f"Failed: {failed}")
    print(f"Results saved to: {RESULTS_FILE}")


if __name__ == "__main__":
    main()
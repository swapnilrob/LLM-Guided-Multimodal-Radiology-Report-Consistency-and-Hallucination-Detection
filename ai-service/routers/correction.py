from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from routers.gemini_client import get_client, get_model
import json
import re

router = APIRouter(prefix="/correction", tags=["Report Correction"])


class FlaggedClaim(BaseModel):
    text: str
    verdict: str
    explanation: str


class ConsistencyViolation(BaseModel):
    findings_sentence: str
    impression_sentence: str
    explanation: str


class CorrectionRequest(BaseModel):
    original_report: str
    flagged_claims: list[FlaggedClaim]
    consistency_violations: list[ConsistencyViolation]


class CorrectionResponse(BaseModel):
    corrected_report: str
    changes_made: list[str]


CORRECTION_PROMPT = """
You are a radiology report editor. You will be given:
1. An original radiology report
2. A list of claims that were flagged as hallucinated or uncertain
3. A list of consistency violations between Findings and Impression

Your task is to produce a CORRECTED version of the report that:
- Removes or revises hallucinated claims (claims not supported by the image)
- Resolves consistency violations between Findings and Impression
- Preserves all supported/accurate claims exactly as written
- Maintains proper radiology report format and professional language
- Does NOT add new findings that were not in the original report

Also provide a list of specific changes you made.

Return ONLY a valid JSON object in this exact format, with no additional text:
{
  "corrected_report": "The full corrected report text here...",
  "changes_made": [
    "Removed claim about clear lungs — image shows bilateral opacities",
    "Updated Impression to reflect pleural effusion noted in Findings"
  ]
}
"""


@router.post("/correct", response_model=CorrectionResponse)
async def correct_report(request: CorrectionRequest):
    try:
        client = get_client()
        model = get_model()

        # Build context about flagged issues
        flagged_text = "\n".join(
            [f"- \"{c.text}\" — Verdict: {c.verdict}, Reason: {c.explanation}"
             for c in request.flagged_claims]
        )

        violations_text = "\n".join(
            [f"- Findings: \"{v.findings_sentence}\" vs Impression: \"{v.impression_sentence}\" — {v.explanation}"
             for v in request.consistency_violations]
        )

        user_message = f"""Original Report:
{request.original_report}

Flagged Claims:
{flagged_text if flagged_text else "None"}

Consistency Violations:
{violations_text if violations_text else "None"}"""

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": CORRECTION_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,
        )

        raw_text = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        raw_text = re.sub(r'^```(?:json)?\n?', '', raw_text)
        raw_text = re.sub(r'\n?```$', '', raw_text)
        raw_text = raw_text.strip()

        parsed = json.loads(raw_text)

        return CorrectionResponse(
            corrected_report=parsed.get("corrected_report", ""),
            changes_made=parsed.get("changes_made", []),
        )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response as JSON: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Report correction failed: {str(e)}"
        )
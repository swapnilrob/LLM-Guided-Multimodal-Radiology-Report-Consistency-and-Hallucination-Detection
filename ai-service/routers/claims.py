from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from routers.gemini_client import get_client, get_model
import json
import re

router = APIRouter(prefix="/claims", tags=["Claims"])


class ClaimExtractionRequest(BaseModel):
    report_text: str


class Claim(BaseModel):
    text: str
    anatomical_region: str | None = None


class ClaimExtractionResponse(BaseModel):
    claims: list[Claim]
    total_count: int


CLAIM_EXTRACTION_PROMPT = """
You are a radiology report analysis expert. Your task is to extract discrete, 
independently verifiable clinical claims from the provided radiology report.

A claim is a single, atomic statement that:
- Describes a specific finding, observation, or conclusion
- Can be independently verified against an X-ray image
- Is stated as a fact (not a recommendation or procedural note)

Instructions:
1. Extract EVERY distinct clinical claim from both the Findings and Impression sections
2. Each claim must be a single, complete sentence
3. Identify the anatomical region referenced in each claim (if any)
4. Do NOT merge multiple findings into one claim
5. Do NOT include recommendations (e.g., "clinical correlation suggested")

Return ONLY a valid JSON object in this exact format, with no additional text:
{
  "claims": [
    {
      "text": "The lungs are clear bilaterally without focal consolidation.",
      "anatomical_region": "lungs"
    },
    {
      "text": "No pleural effusion is identified.",
      "anatomical_region": "pleural space"
    }
  ]
}
"""


@router.post("/extract", response_model=ClaimExtractionResponse)
async def extract_claims(request: ClaimExtractionRequest):
    try:
        client = get_client()
        model = get_model()

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": CLAIM_EXTRACTION_PROMPT},
                {"role": "user", "content": f"Radiology Report:\n{request.report_text}"}
            ],
            temperature=0.2,
        )

        raw_text = response.choices[0].message.content.strip()

        # Strip markdown code fences if present (```json ... ```)
        raw_text = re.sub(r'^```(?:json)?\n?', '', raw_text)
        raw_text = re.sub(r'\n?```$', '', raw_text)
        raw_text = raw_text.strip()

        parsed = json.loads(raw_text)
        claims = parsed.get("claims", [])

        return ClaimExtractionResponse(
            claims=[Claim(**c) for c in claims],
            total_count=len(claims)
        )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response as JSON: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Claim extraction failed: {str(e)}"
        )
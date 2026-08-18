from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from routers.gemini_client import get_client, get_model
import json
import re

router = APIRouter(prefix="/hallucination", tags=["Hallucination Detection"])


class ClaimInput(BaseModel):
    text: str
    anatomical_region: str | None = None


class HallucinationRequest(BaseModel):
    image_url: str
    claims: list[ClaimInput]


class ClaimVerdict(BaseModel):
    text: str
    anatomical_region: str | None = None
    verdict: str  # supported, uncertain, hallucinated
    risk_score: int  # 0–100
    explanation: str
    bounding_box: dict | None = None


class HallucinationResponse(BaseModel):
    verdicts: list[ClaimVerdict]
    total_claims: int
    hallucinated_count: int
    supported_count: int
    uncertain_count: int


HALLUCINATION_DETECTION_PROMPT = """
You are a radiology image analysis expert. You will be given a chest X-ray image 
and a list of clinical claims extracted from a radiology report about that image.

For EACH claim, you must:
1. Examine the X-ray image carefully
2. Determine whether the image SUPPORTS, makes UNCERTAIN, or CONTRADICTS the claim
3. Assign a risk score from 0 to 100:
   - 0 = fully supported by the image
   - 50 = uncertain, cannot confirm or deny from the image
   - 100 = clearly hallucinated / contradicted by the image
4. Provide a clear, concise explanation of your reasoning
5. If possible, describe the approximate bounding box of the relevant region 
   as percentages of image dimensions (x, y, width, height from 0 to 100)

Return ONLY a valid JSON object in this exact format, with no additional text:
{
  "verdicts": [
    {
      "text": "The exact claim text",
      "anatomical_region": "lungs",
      "verdict": "supported",
      "risk_score": 5,
      "explanation": "The lungs appear clear bilaterally with no visible opacities or consolidation.",
      "bounding_box": {"x": 10, "y": 15, "width": 80, "height": 60}
    },
    {
      "text": "Another claim",
      "anatomical_region": "pleural space",
      "verdict": "hallucinated",
      "risk_score": 90,
      "explanation": "A small left-sided pleural effusion is visible, contradicting the claim of no effusion.",
      "bounding_box": {"x": 60, "y": 70, "width": 30, "height": 25}
    }
  ]
}

IMPORTANT:
- verdict must be exactly one of: "supported", "uncertain", "hallucinated"
- risk_score must be an integer from 0 to 100
- Be conservative: if you cannot clearly see evidence, use "uncertain" not "supported"
- bounding_box values are percentages (0-100) of image width/height
"""


@router.post("/detect", response_model=HallucinationResponse)
async def detect_hallucinations(request: HallucinationRequest):
    try:
        client = get_client()
        model = get_model()

        # Build the claims list as text for the prompt
        claims_text = "\n".join(
            [f"- Claim: \"{c.text}\" (Region: {c.anatomical_region or 'not specified'})"
             for c in request.claims]
        )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": HALLUCINATION_DETECTION_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": request.image_url}
                        },
                        {
                            "type": "text",
                            "text": f"Here are the claims to verify against this chest X-ray:\n{claims_text}"
                        }
                    ]
                }
            ],
            temperature=0.2,
        )

        raw_text = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        raw_text = re.sub(r'^```(?:json)?\n?', '', raw_text)
        raw_text = re.sub(r'\n?```$', '', raw_text)
        raw_text = raw_text.strip()

        parsed = json.loads(raw_text)
        verdicts = parsed.get("verdicts", [])

        # Count each verdict type
        hallucinated = sum(1 for v in verdicts if v.get("verdict") == "hallucinated")
        supported = sum(1 for v in verdicts if v.get("verdict") == "supported")
        uncertain = sum(1 for v in verdicts if v.get("verdict") == "uncertain")

        return HallucinationResponse(
            verdicts=[ClaimVerdict(**v) for v in verdicts],
            total_claims=len(verdicts),
            hallucinated_count=hallucinated,
            supported_count=supported,
            uncertain_count=uncertain,
        )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response as JSON: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Hallucination detection failed: {str(e)}"
        )
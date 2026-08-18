from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from routers.gemini_client import get_client, get_model
import json
import re

router = APIRouter(prefix="/consistency", tags=["Consistency Checking"])


class ConsistencyRequest(BaseModel):
    report_text: str


class Violation(BaseModel):
    findings_sentence: str
    impression_sentence: str
    explanation: str


class ConsistencyResponse(BaseModel):
    is_consistent: bool
    violations: list[Violation]
    violation_count: int


CONSISTENCY_PROMPT = """
You are a radiology report quality expert. You will be given a radiology report 
containing Findings and Impression sections.

Your task is to identify LOGICAL CONTRADICTIONS between the Findings and Impression 
sections. A contradiction occurs when:
- A finding is mentioned in Findings but omitted or contradicted in Impression
- Impression states something not supported by the Findings
- Severity or laterality differs between the two sections
- A condition is described in one section but negated in the other

Do NOT flag:
- Impression being a shorter summary of Findings (that is normal)
- Minor wording differences that don't change clinical meaning
- Findings containing more detail than Impression (expected behavior)

Return ONLY a valid JSON object in this exact format, with no additional text:
{
  "is_consistent": false,
  "violations": [
    {
      "findings_sentence": "The exact sentence from Findings",
      "impression_sentence": "The exact sentence from Impression that contradicts it",
      "explanation": "Clear explanation of the contradiction"
    }
  ]
}

If the report is consistent (no contradictions), return:
{
  "is_consistent": true,
  "violations": []
}
"""


@router.post("/check", response_model=ConsistencyResponse)
async def check_consistency(request: ConsistencyRequest):
    try:
        client = get_client()
        model = get_model()

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": CONSISTENCY_PROMPT},
                {"role": "user", "content": f"Radiology Report:\n{request.report_text}"}
            ],
            temperature=0.2,
        )

        raw_text = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        raw_text = re.sub(r'^```(?:json)?\n?', '', raw_text)
        raw_text = re.sub(r'\n?```$', '', raw_text)
        raw_text = raw_text.strip()

        parsed = json.loads(raw_text)
        violations = parsed.get("violations", [])

        return ConsistencyResponse(
            is_consistent=parsed.get("is_consistent", len(violations) == 0),
            violations=[Violation(**v) for v in violations],
            violation_count=len(violations),
        )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response as JSON: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Consistency check failed: {str(e)}"
        )
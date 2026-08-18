const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callAIService = async (endpoint, body, retries = 50) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    // Wait 3 seconds before every attempt (except the first)
    if (attempt > 1) {
      console.log(
        `Retry ${attempt}/${retries} for ${endpoint} — waiting 4s....`
      );
      await sleep(4000);
    }

    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // If rate limited, loop back and retry
    if (response.status === 500) {
      const error = await response.json().catch(() => ({}));
      const detail = error.detail || '';

      if (detail.includes('429') && attempt < retries) {
        continue;
      }

      throw new Error(`AI service error (${response.status}): ${detail}`);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `AI service error (${response.status}): ${error.detail || 'Unknown error'}`
      );
    }

    return response.json();
  }

  throw new Error(`AI service failed after ${retries} retries on ${endpoint}`);
};

const extractClaims = async (reportText) => {
  return callAIService('/claims/extract', { report_text: reportText });
};

const detectHallucinations = async (imageUrl, claims) => {
  return callAIService('/hallucination/detect', {
    image_url: imageUrl,
    claims,
  });
};

const checkConsistency = async (reportText) => {
  return callAIService('/consistency/check', { report_text: reportText });
};

const correctReport = async (originalReport, flaggedClaims, consistencyViolations) => {
  return callAIService('/correction/correct', {
    original_report: originalReport,
    flagged_claims: flaggedClaims,
    consistency_violations: consistencyViolations,
  });
};

module.exports = {
  extractClaims,
  detectHallucinations,
  checkConsistency,
  correctReport,
};
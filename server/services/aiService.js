const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 50;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class RateLimitExhaustedError extends Error {
  constructor(endpoint, retries) {
    super(`Rate limit: all ${retries} retries exhausted for ${endpoint}`);
    this.name = 'RateLimitExhaustedError';
    this.endpoint = endpoint;
  }
}

const callAIService = async (endpoint, body, retries = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    if (attempt > 1) {
      console.log(
        `Retry ${attempt}/${retries} for ${endpoint} — waiting ${RETRY_DELAY_MS / 1000}s...`
      );
      await sleep(RETRY_DELAY_MS);
    }

    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.status === 500) {
      const error = await response.json().catch(() => ({}));
      const detail = error.detail || '';

      if (detail.includes('429') && attempt < retries) {
        continue;
      }

      if (detail.includes('429')) {
        throw new RateLimitExhaustedError(endpoint, retries);
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

  throw new RateLimitExhaustedError(endpoint, retries);
};

const extractClaims = async (reportText) => {
  return callAIService('/claims/extract', { report_text: reportText });
};

const detectHallucinations = async (imageUrl, claims) => {
  return callAIService('/hallucination/detect', { image_url: imageUrl, claims });
};

const checkConsistency = async (reportText) => {
  return callAIService('/consistency/check', { report_text: reportText });
};

const correctReport = async (reportText, flaggedClaims, violations) => {
  const safeViolations = (violations || []).map((v) => ({
    findings_sentence: v.findings_sentence || v.findingsSentence || '',
    impression_sentence: v.impression_sentence || v.impressionSentence || '',
    explanation: v.explanation || '',
  }));

  const safeClaims = (flaggedClaims || []).map((c) => ({
    text: c.text || '',
    verdict: c.verdict || '',
    explanation: c.explanation || '',
  }));

  return callAIService('/correction/correct', {
    original_report: reportText,
    flagged_claims: safeClaims,
    consistency_violations: safeViolations,
  });
};

module.exports = {
  extractClaims,
  detectHallucinations,
  checkConsistency,
  correctReport,
  RateLimitExhaustedError,
};
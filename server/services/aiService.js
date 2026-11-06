const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const RETRY_DELAY_MS = 3000; // 3-second wait between retries
const MAX_RETRIES = 50;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Custom error class so the pipeline can distinguish rate-limit exhaustion
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

// --- Wrapper functions for each AI pipeline step ---

const extractClaims = async (reportText) => {
  return callAIService('/extract-claims', { report_text: reportText });
};

const detectHallucinations = async (claims, imageUrl) => {
  return callAIService('/detect-hallucinations', { claims, image_url: imageUrl });
};

const checkConsistency = async (reportText) => {
  return callAIService('/check-consistency', { report_text: reportText });
};

const correctReport = async (reportText, hallucinations, consistencyViolations) => {
  return callAIService('/generate-correction', {
    report_text: reportText,
    hallucinations,
    consistency_violations: consistencyViolations,
  });
};

module.exports = {
  extractClaims,
  detectHallucinations,
  checkConsistency,
  correctReport,
  RateLimitExhaustedError,
};
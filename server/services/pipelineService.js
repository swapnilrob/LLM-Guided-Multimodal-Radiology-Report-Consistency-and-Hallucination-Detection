const Analysis = require('../models/Analysis');
const { decrypt } = require('../utils/encryption');
const {
  extractClaims,
  detectHallucinations,
  checkConsistency,
  correctReport,
  RateLimitExhaustedError,
} = require('./aiService');

const STEP_RESTART_DELAY_MS = 5000; // wait 5s before restarting a step
const MAX_STEP_RESTARTS = 3;        // max times a single step can restart

/**
 * Runs a pipeline step with automatic restart on rate-limit exhaustion.
 * If all retries inside callAIService are exhausted due to 429s,
 * this wrapper waits and restarts that same step from scratch.
 */
const runWithRestart = async (stepName, fn) => {
  for (let restart = 1; restart <= MAX_STEP_RESTARTS; restart++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitExhaustedError && restart < MAX_STEP_RESTARTS) {
        console.log(
          `[Pipeline] Rate limit exhausted on "${stepName}" — restarting step (attempt ${restart + 1}/${MAX_STEP_RESTARTS}) in ${STEP_RESTART_DELAY_MS / 1000}s...`
        );
        await new Promise((r) => setTimeout(r, STEP_RESTART_DELAY_MS));
        continue;
      }
      throw error;
    }
  }
};

/**
 * Computes a 0–100 reliability score based on claim verdicts
 * and consistency violations.
 *
 * Formula:
 *   base = (supported * 100 + uncertain * 50 + hallucinated * 0) / totalClaims
 *   penalty = min(violationCount * 10, 30)
 *   score = max(base - penalty, 0)
 */
const computeReliabilityScore = (verdicts, violationCount) => {
  if (!verdicts || verdicts.length === 0) return null;

  const supported = verdicts.filter((v) => v.verdict === 'supported').length;
  const uncertain = verdicts.filter((v) => v.verdict === 'uncertain').length;
  const hallucinated = verdicts.filter((v) => v.verdict === 'hallucinated').length;
  const total = verdicts.length;

  const base = (supported * 100 + uncertain * 50 + hallucinated * 0) / total;
  const penalty = Math.min(violationCount * 10, 30);
  const score = Math.max(Math.round(base - penalty), 0);

  return score;
};

/**
 * Runs the full analysis pipeline on a given Analysis document.
 * Updates the document's status at each stage.
 */
const runPipeline = async (analysisId) => {
  let analysis;

  try {
    analysis = await Analysis.findById(analysisId);
    if (!analysis) throw new Error('Analysis not found');

    // --- Step 1: Extract claims ---
    analysis.status = 'extracting_claims';
    await analysis.save();

    const reportText = decrypt(analysis.originalReportText);
    const claimsResult = await runWithRestart('extractClaims', () =>
      extractClaims(reportText)
    );

    // --- Step 2: Detect hallucinations ---
    analysis.status = 'detecting_hallucinations';
    await analysis.save();

    const hallucinationResult = await runWithRestart('detectHallucinations', () =>
      detectHallucinations(analysis.imageUrl, claimsResult.claims)
    );

    // Map verdicts to the claim schema format
    analysis.claims = hallucinationResult.verdicts.map((v) => ({
      text: v.text,
      anatomicalRegion: v.anatomical_region || null,
      verdict: v.verdict,
      riskScore: v.risk_score,
      confidenceInterval: null,
      explanation: v.explanation,
      boundingBox: v.bounding_box
        ? {
            x: v.bounding_box.x,
            y: v.bounding_box.y,
            width: v.bounding_box.width,
            height: v.bounding_box.height,
          }
        : { x: null, y: null, width: null, height: null },
    }));
    await analysis.save();

    // --- Step 3: Check consistency ---
    analysis.status = 'checking_consistency';
    await analysis.save();

    const consistencyResult = await runWithRestart('checkConsistency', () =>
      checkConsistency(reportText)
    );

    analysis.consistencyViolations = consistencyResult.violations.map((v) => ({
      findingsSentence: v.findings_sentence,
      impressionSentence: v.impression_sentence,
      explanation: v.explanation,
    }));
    await analysis.save();

    // --- Step 4: Compute reliability score ---
    analysis.reliabilityScore = computeReliabilityScore(
      hallucinationResult.verdicts,
      consistencyResult.violation_count
    );
    await analysis.save();

    // --- Step 5: Generate corrected report ---
    const flaggedClaims = hallucinationResult.verdicts
      .filter((v) => v.verdict !== 'supported')
      .map((v) => ({
        text: v.text,
        verdict: v.verdict,
        explanation: v.explanation,
      }));

    if (flaggedClaims.length > 0 || consistencyResult.violation_count > 0) {
      const correctionResult = await runWithRestart('correctReport', () =>
        correctReport(reportText, flaggedClaims, consistencyResult.violations)
      );
      analysis.correctedReportText = correctionResult.corrected_report;
    }

    // --- Done ---
    analysis.status = 'complete';
    await analysis.save();

    console.log(`Pipeline complete for analysis ${analysisId}`);
    return analysis;
  } catch (error) {
    console.error(`Pipeline failed for analysis ${analysisId}:`, error.message);

    if (analysis) {
      analysis.status = 'failed';
      analysis.errorMessage = error.message;
      await analysis.save();
    }

    throw error;
  }
};

module.exports = { runPipeline, computeReliabilityScore };
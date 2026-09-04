export function exportAnalysisPdf(analysis) {
  const claims = analysis.claims || [];
  const violations = analysis.consistencyViolations || [];
  const reportText = analysis.reportText || analysis.report || '';
  const correctedReport = analysis.correctedReport || '';
  const score = analysis.reliabilityScore ?? 0;
  const date = analysis.createdAt
    ? new Date(analysis.createdAt).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown date';

  // Count verdicts
  const supported = claims.filter((c) => c.verdict === 'supported').length;
  const hallucinated = claims.filter((c) => c.verdict === 'hallucinated').length;
  const uncertain = claims.filter((c) => c.verdict === 'uncertain').length;

  // Score colour
  const scoreColor = score <= 35 ? '#D32F2F' : score <= 65 ? '#EF6C00' : '#388E3C';

  // Build claims HTML
  const claimsHtml = claims.length > 0
    ? claims.map((c, i) => {
        const id = `C-${String(i + 1).padStart(2, '0')}`;
        const verdictColor =
          c.verdict === 'hallucinated' ? '#D32F2F' :
          c.verdict === 'supported' ? '#388E3C' : '#FBC02D';
        const verdictLabel =
          c.verdict === 'hallucinated' ? 'HALLUCINATED' :
          c.verdict === 'supported' ? 'VERIFIED' : 'UNCERTAIN';

        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #E0E0E0;font-family:monospace;font-size:12px;color:#616161;">${id}</td>
            <td style="padding:8px;border-bottom:1px solid #E0E0E0;font-size:13px;">${c.claimText || c.text || c.claim || 'N/A'}</td>
            <td style="padding:8px;border-bottom:1px solid #E0E0E0;text-align:center;font-weight:bold;font-size:12px;">${c.riskScore !== undefined ? c.riskScore + '%' : '—'}</td>
            <td style="padding:8px;border-bottom:1px solid #E0E0E0;text-align:center;">
              <span style="background:${verdictColor};color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;">${verdictLabel}</span>
            </td>
          </tr>
          ${c.explanation ? `
          <tr>
            <td></td>
            <td colspan="3" style="padding:4px 8px 12px;font-size:12px;color:#616161;border-bottom:1px solid #E0E0E0;">
              <em>Explanation:</em> ${c.explanation}
            </td>
          </tr>` : ''}
        `;
      }).join('')
    : '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9E9E9E;">No claims extracted.</td></tr>';

  // Build violations HTML
  const violationsHtml = violations.length > 0
    ? violations.map((v, i) => `
        <div style="margin-bottom:12px;padding:10px;border:1px solid #E0E0E0;border-radius:4px;">
          <strong style="font-size:12px;color:#EF6C00;">Violation ${i + 1}</strong>
          <div style="display:flex;gap:12px;margin-top:8px;">
            <div style="flex:1;background:#FFF3E0;padding:8px;border-radius:4px;font-size:12px;">
              <strong>Findings:</strong> ${v.findingsText || v.findings || 'N/A'}
            </div>
            <div style="flex:1;background:#FBE9E7;padding:8px;border-radius:4px;font-size:12px;">
              <strong>Impression:</strong> ${v.impressionText || v.impression || 'N/A'}
            </div>
          </div>
          ${v.explanation ? `<p style="font-size:11px;color:#616161;margin-top:6px;">${v.explanation}</p>` : ''}
        </div>
      `).join('')
    : '<p style="color:#9E9E9E;font-size:13px;">No consistency violations detected.</p>';

  // Full HTML document
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analysis Report — ${date}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #212121; margin: 40px; line-height: 1.5; }
        h1 { color: #004D40; font-size: 20px; margin-bottom: 4px; }
        h2 { color: #00695C; font-size: 15px; margin-top: 28px; margin-bottom: 8px; border-bottom: 2px solid #004D40; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #004D40; color: white; padding: 8px; font-size: 12px; text-align: left; }
        .disclaimer { margin-top: 32px; padding: 12px; background: #F5F5F5; border-radius: 4px; font-size: 11px; color: #9E9E9E; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <h1>Radiology Report Analysis</h1>
      <p style="font-size:13px;color:#616161;">Generated on ${date}</p>

      <h2>Reliability Score</h2>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:36px;font-weight:bold;color:${scoreColor};">${score}</span>
        <span style="font-size:14px;color:#616161;">/ 100</span>
      </div>

      <h2>Summary</h2>
      <table>
        <tr><td style="padding:4px 0;font-size:13px;">Total Claims</td><td style="font-weight:bold;">${claims.length}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#388E3C;">Supported</td><td style="font-weight:bold;color:#388E3C;">${supported}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#D32F2F;">Hallucinated</td><td style="font-weight:bold;color:#D32F2F;">${hallucinated}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#FBC02D;">Uncertain</td><td style="font-weight:bold;color:#FBC02D;">${uncertain}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;">Consistency Violations</td><td style="font-weight:bold;color:${violations.length > 0 ? '#EF6C00' : '#388E3C'};">${violations.length}</td></tr>
      </table>

      <h2>Original Report</h2>
      <div style="background:#F5F5F5;padding:12px;border-radius:4px;font-size:13px;white-space:pre-wrap;">${reportText || 'N/A'}</div>

      <h2>Claim Verification</h2>
      <table>
        <thead>
          <tr>
            <th style="width:60px;">ID</th>
            <th>Claim</th>
            <th style="width:60px;text-align:center;">Risk</th>
            <th style="width:120px;text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${claimsHtml}
        </tbody>
      </table>

      <h2>Consistency Violations</h2>
      ${violationsHtml}

      ${correctedReport ? `
        <h2>AI Corrected Report</h2>
        <div style="background:#E0F2F1;padding:12px;border-radius:4px;border-left:4px solid #00838F;font-size:13px;white-space:pre-wrap;">${correctedReport}</div>
      ` : ''}

      <div class="disclaimer">
        <strong>Clinical Disclaimer:</strong> This analysis was generated by an AI research prototype and is not a substitute for professional clinical judgment.
        The system is designed to assist in identifying potential issues in radiology reports, not to provide medical diagnoses.
        All findings should be reviewed by a qualified radiologist before any clinical action is taken.
      </div>
    </body>
    </html>
  `;

  // Open in a new window and trigger print
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    printWindow.print();
  };
} 
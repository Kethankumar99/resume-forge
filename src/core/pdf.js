/* ============================================================
   pdf.js — Native Print-to-PDF Engine with 4-Side Strict Equal Margins
   ============================================================ */

import { log } from "./store.js";

/**
 * exportResumePdf(profile, aiJson, companyName)
 * Triggers native browser print dialog with strict A4 4-side equal margins.
 */
export async function exportResumePdf(profile, aiJson, companyName = "Company") {
  const { buildResumeHtml } = await import("./template.js");
  const html = buildResumeHtml(profile, aiJson, "default");

  // Create a hidden print iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

  iframeDoc.open();
  iframeDoc.write(`
    <html>
      <head>
        <title>${companyName}_Resume</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm; /* Forces equal 4-side margins natively across all pages */
          }
          @media print {
            body {
              background: #ffffff !important;
              -webkit-print-color-adjust: exact;
            }
            .page {
              padding: 0 !important; /* Let @page handle the clean outer margins */
              margin: 0 !important;
              page-break-after: always;
              break-after: page;
            }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for fonts to load completely inside iframe
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    const safeName = (profile.name || "Resume").replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
    const safeCo = (companyName || "Company").replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
    const filename = `${safeCo}_${safeName}_Resume.pdf`;

    setTimeout(() => {
      iframe.remove();
    }, 3000);

    log(`pdf print dialog triggered successfully · ${filename}`, "ok");
    return { filename };

  } catch (err) {
    iframe.remove();
    console.error("PDF Print Error:", err);
    throw new Error("PDF print failed: " + err.message);
  }
}
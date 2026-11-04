// ============================================================
// Resume Parser — PDF/DOCX → plain text → OpenAI structured extraction
//
// Flow:
//   1. Extract plain text from PDF (pdfjs-dist) or DOCX (mammoth)
//   2. Truncate to ~8000 tokens to fit GPT-4o-mini context
//   3. Send to OpenAI with JSON mode for structured extraction
//   4. Return typed ResumeData
// ============================================================

// @language-guard-exempt: resume fields must stay verbatim in the user's original language. Locale normalization happens later at the display/autofill layer, not during parse.
import { callLLMStructured } from "@/lib/ai/structured-output";
import { ResumeDataSchema } from "@/lib/ai/output-schemas";
import type { ResumeData } from "./types";

const MAX_TEXT_LENGTH = 24000; // ~8000 tokens at ~3 chars/token
const MAX_PDF_PAGES = 50; // Reject multi-hundred-page PDFs (DoS guard)
const EXTRACT_TIMEOUT_MS = 15_000; // Hard cap on PDF/DOCX parsing
const MAX_DOCX_EXPANSION_RATIO = 200; // zip bomb guard (docx is zipped XML)
// Fail-fast ceiling on extracted text, applied BEFORE ratio check so a
// zip-bomb that inflates to e.g. 500MB is rejected as soon as we see the
// absolute size, even if the input buffer is also large.
const MAX_EXTRACTED_TEXT_BYTES = 10 * 1024 * 1024; // 10MB

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// ── DOMMatrix polyfill for serverless (Vercel) ──
// pdfjs-dist requires DOMMatrix for coordinate transforms.
// Node.js/serverless doesn't have it. Minimal stub for text extraction.
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    constructor(init?: number[]) {
      if (Array.isArray(init) && init.length === 6) {
        this.m11 = init[0];
        this.m12 = init[1];
        this.m21 = init[2];
        this.m22 = init[3];
        this.m41 = init[4];
        this.m42 = init[5];
      }
    }
    get a() {
      return this.m11;
    }
    get b() {
      return this.m12;
    }
    get c() {
      return this.m21;
    }
    get d() {
      return this.m22;
    }
    get e() {
      return this.m41;
    }
    get f() {
      return this.m42;
    }
    get is2D() {
      return true;
    }
    get isIdentity() {
      return (
        this.m11 === 1 &&
        this.m12 === 0 &&
        this.m21 === 0 &&
        this.m22 === 1 &&
        this.m41 === 0 &&
        this.m42 === 0
      );
    }
    inverse() {
      return new DOMMatrix();
    }
    multiply() {
      return new DOMMatrix();
    }
    scale() {
      return new DOMMatrix();
    }
    translate() {
      return new DOMMatrix();
    }
    transformPoint(p: { x?: number; y?: number } = {}) {
      return { x: p.x ?? 0, y: p.y ?? 0, z: 0, w: 1 };
    }
    toFloat64Array() {
      return new Float64Array([
        this.m11,
        this.m12,
        this.m13,
        this.m14,
        this.m21,
        this.m22,
        this.m23,
        this.m24,
        this.m31,
        this.m32,
        this.m33,
        this.m34,
        this.m41,
        this.m42,
        this.m43,
        this.m44,
      ]);
    }
  };
}

/**
 * Extract plain text from a PDF buffer using pdfjs-dist.
 *
 * Uses pdfjs-dist directly (pure JS) instead of pdf-parse to avoid
 * the @napi-rs/canvas native dependency that fails on serverless platforms.
 */
async function extractTextFromPDF(
  buffer: Buffer,
  deadlineMs: number,
): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableWorker: true,
    // `stopAtErrors: true` aborts on malformed structures instead of
    // trying heroic recovery that can spin CPU on a crafted PDF.
    stopAtErrors: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdfjs-dist types don't expose all valid options
  } as any).promise;

  if (doc.numPages > MAX_PDF_PAGES) {
    throw new Error(
      `PDF has ${doc.numPages} pages, exceeds the ${MAX_PDF_PAGES}-page limit`,
    );
  }

  const pages: string[] = [];
  let totalChars = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    // Per-iteration deadline check: withTimeout can reject its outer
    // Promise, but pdfjs doesn't accept a cancellation signal — so we
    // bail from the loop ourselves rather than letting the underlying
    // parse continue consuming CPU past the deadline.
    if (Date.now() > deadlineMs) {
      throw new Error(
        `PDF extraction exceeded deadline at page ${i} of ${doc.numPages}`,
      );
    }
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: Record<string, unknown>) =>
        typeof item.str === "string" ? item.str : "",
      )
      .join(" ");
    pages.push(pageText);
    totalChars += pageText.length;
    // Short-circuit: stop extracting once we have enough text to fill the
    // LLM context window. A legitimate resume is well under this.
    if (totalChars >= MAX_TEXT_LENGTH) break;
  }
  return pages.join("\n");
}

/**
 * Extract plain text from a DOCX buffer using mammoth.
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  // Zip-bomb guard: a docx is a zipped XML bundle. A tiny file that expands
  // to megabytes of text is a classic decompression-ratio attack vector.
  // Absolute ceiling fires first so a large input that inflates to an even
  // larger output is rejected even when the ratio stays under 200×.
  if (result.value.length > MAX_EXTRACTED_TEXT_BYTES) {
    throw new Error(
      `DOCX extracted text ${(result.value.length / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_EXTRACTED_TEXT_BYTES / 1024 / 1024}MB ceiling`,
    );
  }
  if (result.value.length > buffer.byteLength * MAX_DOCX_EXPANSION_RATIO) {
    throw new Error(
      `DOCX expansion ratio ${Math.round(result.value.length / buffer.byteLength)}:1 exceeds ${MAX_DOCX_EXPANSION_RATIO}:1 limit`,
    );
  }
  return result.value;
}

/**
 * Extract plain text from a resume file (PDF or DOCX).
 */
async function extractText(file: Buffer, mimeType: string): Promise<string> {
  let text: string;
  const deadlineMs = Date.now() + EXTRACT_TIMEOUT_MS;

  if (mimeType === "application/pdf") {
    text = await withTimeout(
      extractTextFromPDF(file, deadlineMs),
      EXTRACT_TIMEOUT_MS,
      "PDF extraction",
    );
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    text = await withTimeout(
      extractTextFromDOCX(file),
      EXTRACT_TIMEOUT_MS,
      "DOCX extraction",
    );
  } else {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  // Truncate to stay within GPT-4o-mini context limits
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
  }

  return text;
}

const EXTRACTION_PROMPT = `You are a resume parser. Extract structured information from the resume text below.

Return a JSON object with EXACTLY this schema (no additional fields):

{
  "experience": [
    {
      "title": "job title verbatim from resume",
      "company": "company name verbatim",
      "industry": "inferred industry (e.g. technology, finance, healthcare, education, consulting)",
      "durationMonths": number (approximate total months in this role),
      "responsibilities": ["key responsibility 1", "key responsibility 2"]
    }
  ],
  "skills": ["skill1", "skill2", ...],
  "languages": [
    {
      "language": "language name (e.g. English, Chinese, Spanish)",
      "proficiency": "native" | "fluent" | "professional" | "basic"
    }
  ],
  "industries": ["unique industry names across all experience"],
  "education": [
    {
      "degree": "degree type (e.g. Bachelor, Master, PhD)",
      "field": "field of study",
      "institution": "school name"
    }
  ],
  "yearsOfExperience": number (total years of professional experience),
  "seniority": "entry" | "mid" | "senior" | "executive" | "unknown"
}

Rules:
- Extract ONLY what is explicitly stated in the resume. Do NOT infer or guess.
- For languages: only include if explicitly mentioned or if the resume language itself implies native proficiency.
- For seniority: infer from job titles and years of experience (0-2y=entry, 3-6y=mid, 7-14y=senior, 15+=executive).
- If a field cannot be determined from the resume, use empty arrays or "unknown".
- Keep all text verbatim from the resume where possible.`;

/**
 * Parse a resume file (PDF/DOCX) into structured ResumeData.
 *
 * Uses a two-step process:
 *   1. Extract plain text from the file format
 *   2. Send text to OpenAI GPT-4o-mini for structured extraction
 */
export async function parseResume(
  file: Buffer,
  mimeType: string,
): Promise<ResumeData> {
  const text = await extractText(file, mimeType);

  if (!text.trim()) {
    throw new Error("Resume file contains no extractable text");
  }

  return callLLMStructured(
    "resume-parse",
    [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: text },
    ],
    ResumeDataSchema,
    { temperature: 0.1, maxTokens: 2000 },
  );
}

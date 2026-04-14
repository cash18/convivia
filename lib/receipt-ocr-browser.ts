/**
 * OCR lato browser per scontrini: ridimensionamento, preprocess (contrasto),
 * ritaglio fascia bassa + passaggio full-page se necessario.
 */

import { extractEuroTotalFromReceiptText, hasLikelyTotalLine } from "@/lib/receipt-total-parse";

const MAX_OCR_DIMENSION = 2200;
const BOTTOM_CROP_FRACTION = 0.48;

function enhanceContrastGray(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]!;
    const g = d[i + 1]!;
    const b = d[i + 2]!;
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    d[i] = d[i + 1] = d[i + 2] = gray;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i]!;
    const stretched = Math.round(((v - min) / range) * 255);
    const boosted = Math.min(255, Math.round(stretched * 1.08 + 4));
    d[i] = d[i + 1] = d[i + 2] = boosted;
  }
  ctx.putImageData(img, 0, 0);
}

async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  try {
    let { width, height } = bitmap;
    const scale = Math.min(1, MAX_OCR_DIMENSION / Math.max(width, height));
    if (scale < 1) {
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas non disponibile");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    enhanceContrastGray(canvas);
    return canvas;
  } finally {
    bitmap.close();
  }
}

export type ReceiptOcrResult = {
  textFull: string;
  textBottom: string;
};

/**
 * OCR sulla fascia inferiore e, se serve, sull’intera immagine.
 */
export async function runReceiptOcr(file: File): Promise<ReceiptOcrResult> {
  const canvas = await fileToCanvas(file);
  const { createWorker, PSM } = await import("tesseract.js");

  const worker = await createWorker("ita+eng", 1, {
    logger: () => {},
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      user_defined_dpi: "300",
    });

    const w = canvas.width;
    const h = canvas.height;
    const cropH = Math.max(120, Math.floor(h * BOTTOM_CROP_FRACTION));
    const top = h - cropH;

    const bottomRes = await worker.recognize(canvas, {
      rectangle: { left: 0, top, width: w, height: cropH },
    });
    const textBottom = bottomRes.data.text?.trim() ?? "";

    const quick = extractEuroTotalFromReceiptText(textBottom);
    const likelyLine = hasLikelyTotalLine(textBottom);
    const longEnough = textBottom.length >= 18;
    if (quick !== null && quick >= 0.05 && likelyLine && longEnough) {
      return { textBottom, textFull: textBottom };
    }

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      user_defined_dpi: "300",
    });
    const fullRes = await worker.recognize(canvas);
    const textFull = fullRes.data.text?.trim() ?? "";

    return { textFull, textBottom };
  } finally {
    await worker.terminate();
  }
}

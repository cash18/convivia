/**
 * OCR lato browser per scontrini: ridimensionamento, ritaglio della fascia bassa (totale in genere in fondo),
 * Tesseract con PSM adatto. Se il fondo contiene già una riga “totale” affidabile, salta il secondo passaggio (più veloce).
 */

import { extractEuroTotalFromReceiptText, hasLikelyTotalLine } from "@/lib/receipt-total-parse";

const MAX_OCR_DIMENSION = 1800;
const BOTTOM_CROP_FRACTION = 0.44;

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
      user_defined_dpi: "200",
    });

    const w = canvas.width;
    const h = canvas.height;
    const cropH = Math.max(100, Math.floor(h * BOTTOM_CROP_FRACTION));
    const top = h - cropH;

    const bottomRes = await worker.recognize(canvas, {
      rectangle: { left: 0, top, width: w, height: cropH },
    });
    const textBottom = bottomRes.data.text?.trim() ?? "";

    const quick = extractEuroTotalFromReceiptText(textBottom);
    if (
      quick !== null &&
      quick >= 0.2 &&
      hasLikelyTotalLine(textBottom) &&
      textBottom.length >= 28
    ) {
      return { textBottom, textFull: textBottom };
    }

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });
    const fullRes = await worker.recognize(canvas);
    const textFull = fullRes.data.text?.trim() ?? "";

    return { textFull, textBottom };
  } finally {
    await worker.terminate();
  }
}

import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const ALLOWED = new Set([192, 512]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const raw = (await context.params).size?.replace(/\.png$/i, "") ?? "";
  const size = parseInt(raw, 10);
  if (!ALLOWED.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  const svgPath = path.join(process.cwd(), "public", "convivia-icon.svg");
  const svg = fs.readFileSync(svgPath, "utf8");
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6366f1",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={uri} width={size} height={size} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}

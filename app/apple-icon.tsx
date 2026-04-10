import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const svgPath = path.join(process.cwd(), "public", "convivia-icon.svg");
  const svg = fs.readFileSync(svgPath, "utf8");
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={uri} width={size.width} height={size.height} alt="" />
      </div>
    ),
    { ...size },
  );
}

import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: { "/api/**": ["./node_modules/ffmpeg-static/ffmpeg"] },
};
export default config;

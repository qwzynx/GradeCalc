import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core"],
  env: {
    // Vercel's serverless functions have no display and don't bundle the
    // Playwright browser binaries, so the popup login flow can't run there.
    NEXT_PUBLIC_ECLASS_POPUP_SUPPORTED: process.env.VERCEL ? "" : "1",
  },
};

export default nextConfig;

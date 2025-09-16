// apps/web/next.config.mjs
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { externalDir: true }, // allow importing from ../../packages
  webpack: (config) => {
    // Resolve @ttpro/core to the local source (no package build needed)
    config.resolve.alias["@ttpro/core"] = path.resolve(
      __dirname,
      "../../packages/core/src"
    );
    return config;
  },
};

export default nextConfig;
